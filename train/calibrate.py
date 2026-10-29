"""Picks Ward Lite's "hurtful" threshold per script (Bangla, Devanagari, Latin) on the DEV split,
never on the scorecard, and writes it into ward-lite.json. The app detects the script of each
message and uses that script's threshold. Danger keeps a single threshold.

    .venv/bin/python calibrate.py
"""
import json, re
from pathlib import Path

import numpy as np
import onnxruntime as ort
from sklearn.metrics import f1_score
from transformers import AutoTokenizer

HERE = Path(__file__).parent
MODEL = HERE.parent / "apps" / "web" / "public" / "models" / "ward-lite"
meta = json.loads((MODEL / "ward-lite.json").read_text())
tok = AutoTokenizer.from_pretrained(MODEL)
sess = ort.InferenceSession(str(MODEL / "onnx" / "model_quantized.onnx"), providers=["CPUExecutionProvider"])


def script(text: str) -> str:
    if re.search(r"[ঀ-৿]", text):
        return "bengali"
    if re.search(r"[ऀ-ॿ]", text):
        return "devanagari"
    return "latin"


rows = [json.loads(l) for l in (HERE / "data" / "dev.jsonl").read_text(encoding="utf-8").split("\n") if l.strip()]
probs = []
for i in range(0, len(rows), 32):
    enc = tok([r["text"] for r in rows[i : i + 32]], truncation=True, max_length=meta["max_length"], padding=True, return_tensors="np")
    logits = sess.run(["logits"], {"input_ids": enc["input_ids"].astype(np.int64), "attention_mask": enc["attention_mask"].astype(np.int64)})[0]
    probs.append(1 / (1 + np.exp(-logits)))
p = np.concatenate(probs)
y = np.array([r["hurtful"] for r in rows])
scripts = np.array([script(r["text"]) for r in rows])

thresholds = {}
for s in ["bengali", "devanagari", "latin"]:
    m = scripts == s
    if m.sum() < 50:
        continue
    grid = np.arange(0.1, 0.91, 0.02)
    # Balanced F1. (F2, weighting recall, flagged things like "thanks ayesha" in real chats and
    # listed upstanders beside bullies; the word lists and patterns already lean towards recall.)
    def f1(t):
        pred = p[m, 0] >= t
        tp = (pred & (y[m] == 1)).sum()
        prec = tp / max(1, pred.sum())
        rec = tp / max(1, (y[m] == 1).sum())
        return 2 * prec * rec / max(1e-9, prec + rec)
    best = max(grid, key=f1)
    thresholds[s] = round(float(best), 2)
    print(f"{s}: {m.sum()} dev rows, threshold {best:.2f}, F1 {f1(best):.3f} (at 0.5: {f1(0.5):.3f})")

meta["thresholds"] = thresholds
(MODEL / "ward-lite.json").write_text(json.dumps(meta, indent=2))
print(json.dumps(meta))
