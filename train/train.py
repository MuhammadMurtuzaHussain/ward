"""Trains Ward Lite: a small multilingual classifier with two outputs per message, "hurtful" and
"danger" (threats, self-harm urging, sexual pressure, threats to expose). Fine-tunes
intfloat/multilingual-e5-small on data/train.jsonl, keeps the best epoch on data/dev.jsonl, then
exports int8 ONNX in the layout transformers.js reads, into ../apps/web/public/models/ward-lite/.

    .venv/bin/python train.py            # train + export
    .venv/bin/python train.py --export   # export the saved checkpoint only
"""
import json, math, random, sys, time
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import f1_score, precision_score, recall_score
from transformers import AutoModelForSequenceClassification, AutoTokenizer

HERE = Path(__file__).parent
BASE = "intfloat/multilingual-e5-small"
CKPT = HERE / "checkpoints" / "ward-lite"
OUT = HERE.parent / "apps" / "web" / "public" / "models" / "ward-lite"
MAX_LEN = 96
BATCH = 32
EPOCHS = int(__import__("os").environ.get("WARD_EPOCHS", 4))
LR = 4e-5
SEED = 26

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
device = "mps" if torch.backends.mps.is_available() else "cpu"


def load(name):
    return [json.loads(l) for l in (HERE / "data" / name).read_text(encoding="utf-8").split("\n") if l.strip()]


def batches(rows, tok, shuffle):
    idx = list(range(len(rows)))
    if shuffle:
        random.shuffle(idx)
    for i in range(0, len(idx), BATCH):
        chunk = [rows[j] for j in idx[i : i + BATCH]]
        enc = tok([r["text"] for r in chunk], truncation=True, max_length=MAX_LEN, padding=True, return_tensors="pt")
        y = torch.tensor([[r["hurtful"], r["danger"]] for r in chunk], dtype=torch.float32)
        yield {k: v.to(device) for k, v in enc.items()}, y.to(device)


@torch.no_grad()
def evaluate(model, rows, tok):
    model.eval()
    probs, ys = [], []
    for x, y in batches(rows, tok, False):
        probs.append(torch.sigmoid(model(**x).logits).cpu().numpy())
        ys.append(y.cpu().numpy())
    p, y = np.concatenate(probs), np.concatenate(ys)
    out = {}
    for k, name in enumerate(["hurtful", "danger"]):
        pred = p[:, k] >= 0.5
        out[name] = {
            "f1": round(f1_score(y[:, k], pred, zero_division=0), 4),
            "precision": round(precision_score(y[:, k], pred, zero_division=0), 4),
            "recall": round(recall_score(y[:, k], pred, zero_division=0), 4),
        }
    # Per-language hurtful F1, so a language that's being sacrificed shows up.
    langs = sorted({r["lang"] for r in rows})
    out["by_lang"] = {
        l: round(f1_score(y[[r["lang"] == l for r in rows], 0], p[[r["lang"] == l for r in rows], 0] >= 0.5, zero_division=0), 4) for l in langs
    }
    return out


def train():
    train_rows, dev_rows = load("train.jsonl"), load("dev.jsonl")
    tok = AutoTokenizer.from_pretrained(BASE)
    model = AutoModelForSequenceClassification.from_pretrained(BASE, num_labels=2, problem_type="multi_label_classification").to(device)
    # Danger is rare and missing it is the costly mistake: weight its positives up.
    n_danger = sum(r["danger"] for r in train_rows)
    pos_weight = torch.tensor([1.0, max(1.0, (len(train_rows) - n_danger) / max(1, n_danger) / 4)], device=device)
    loss_fn = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)
    steps = EPOCHS * math.ceil(len(train_rows) / BATCH)
    sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda s: min(1.0, s / (0.06 * steps)) * max(0.0, (steps - s) / steps))
    best, history, step = -1.0, [], 0
    print(f"{len(train_rows)} train, {len(dev_rows)} dev, {n_danger} danger, device {device}, pos_weight {pos_weight.tolist()}")
    for epoch in range(EPOCHS):
        model.train()
        t0, total = time.time(), 0.0
        for x, y in batches(train_rows, tok, True):
            loss = loss_fn(model(**x).logits, y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            sched.step()
            opt.zero_grad()
            total += loss.item()
            step += 1
        m = evaluate(model, dev_rows, tok)
        score = m["hurtful"]["f1"] + m["danger"]["recall"] * 0.5
        history.append({"epoch": epoch + 1, "loss": round(total / max(1, step), 4), "seconds": round(time.time() - t0), **m})
        print(json.dumps(history[-1]))
        if score > best:
            best = score
            CKPT.mkdir(parents=True, exist_ok=True)
            model.save_pretrained(CKPT)
            tok.save_pretrained(CKPT)
    (HERE / "results").mkdir(exist_ok=True)
    (HERE / "results" / "train-history.json").write_text(json.dumps(history, indent=2))


def corpus():
    """Every text Ward Lite should tokenize exactly as the full model would: its training data,
    the slang packs and the lessons. (Not the scorecard's eval sets.)"""
    texts = [r["text"] for r in load("train.jsonl") + load("dev.jsonl")]
    for f in (HERE.parent / "packages" / "engine" / "packs").glob("*.json"):
        texts += [e["t"] for e in json.loads(f.read_text())["entries"]]
    units = (HERE.parent / "packages" / "lessons" / "src" / "units.ts").read_text()
    texts += units.split("\n")
    return texts


def trim_vocab(model, tok, texts):
    """Keeps only the vocabulary pieces our languages use (plus every single character, so any
    text still tokenizes). The 250k-row embedding table is most of the model; this cuts it to a
    fraction with identical outputs on everything in the corpus."""
    from tokenizers import Tokenizer
    from transformers import PreTrainedTokenizerFast

    used = set()
    for i in range(0, len(texts), 512):
        for ids in tok(texts[i : i + 512], add_special_tokens=False)["input_ids"]:
            used.update(ids)
    t = json.loads(tok.backend_tokenizer.to_str())
    vocab = t["model"]["vocab"]
    chars = {i for i, (piece, _) in enumerate(vocab) if len(piece.replace("\u2581", "")) <= 1}
    keep = sorted(used | chars | {0, 1, 2, 3, len(vocab) - 1})
    remap = {old: new for new, old in enumerate(keep)}
    assert all(remap[i] == i for i in range(4)), "special tokens must keep their ids"
    t["model"]["vocab"] = [vocab[i] for i in keep]
    t["model"]["unk_id"] = remap[3]
    for a in t["added_tokens"]:
        a["id"] = remap[a["id"]]
    for v in t["post_processor"]["special_tokens"].values():
        v["ids"] = [remap[i] for i in v["ids"]]
    new_tok = PreTrainedTokenizerFast(
        tokenizer_object=Tokenizer.from_str(json.dumps(t)),
        bos_token="<s>", eos_token="</s>", unk_token="<unk>", pad_token="<pad>", mask_token="<mask>", cls_token="<s>", sep_token="</s>",
        model_max_length=512,
    )
    old_emb = model.get_input_embeddings()
    new_emb = torch.nn.Embedding(len(keep), old_emb.weight.shape[1], padding_idx=1)
    new_emb.weight.data = old_emb.weight.data[keep].clone()
    model.set_input_embeddings(new_emb)
    model.config.vocab_size = len(keep)
    print(f"vocab {len(vocab)} -> {len(keep)}")
    return model, new_tok


def export():
    import copy

    import onnx
    from onnxruntime.quantization import QuantType, quantize_dynamic

    full_tok = AutoTokenizer.from_pretrained(CKPT)
    full = AutoModelForSequenceClassification.from_pretrained(CKPT).eval()
    model, tok = trim_vocab(copy.deepcopy(full), full_tok, corpus())
    model.eval()
    # The trimmed model must give the same answers as the full one.
    sample = [r["text"] for r in load("dev.jsonl")[:256]]
    with torch.no_grad():
        a = full(**full_tok(sample, truncation=True, max_length=MAX_LEN, padding=True, return_tensors="pt")).logits
        b = model(**tok(sample, truncation=True, max_length=MAX_LEN, padding=True, return_tensors="pt")).logits
    drift = (a - b).abs().max().item()
    print(f"max logit difference after trimming: {drift:.2e}")
    assert drift < 1e-3, "trimming changed the model's answers"
    (OUT / "onnx").mkdir(parents=True, exist_ok=True)
    fp32 = HERE / "checkpoints" / "model.onnx"
    dummy = tok(["ek do teen", "a b"], padding=True, return_tensors="pt")
    torch.onnx.export(
        model,
        (dummy["input_ids"], dummy["attention_mask"]),
        str(fp32),
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={"input_ids": {0: "batch", 1: "seq"}, "attention_mask": {0: "batch", 1: "seq"}, "logits": {0: "batch"}},
        opset_version=17,
        dynamo=False,
    )
    onnx.checker.check_model(str(fp32))
    quantize_dynamic(str(fp32), str(OUT / "onnx" / "model_quantized.onnx"), weight_type=QuantType.QInt8)
    tok.save_pretrained(OUT)
    model.config.save_pretrained(OUT)
    meta = {"labels": ["hurtful", "danger"], "max_length": MAX_LEN, "base": BASE, "threshold": 0.5}
    (OUT / "ward-lite.json").write_text(json.dumps(meta, indent=2))
    size = (OUT / "onnx" / "model_quantized.onnx").stat().st_size / 1e6
    print(f"exported {OUT} ({size:.1f} MB int8)")


if __name__ == "__main__":
    if "--export" not in sys.argv:
        train()
    export()
