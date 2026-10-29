"""Runs the exported Ward Lite (the same int8 ONNX file the app ships) on the scorecard's sample
and writes eval/results/ward-lite.preds.json for eval/run.ts. Also reports CPU speed.

    .venv/bin/python score.py
"""
import json, time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

HERE = Path(__file__).parent
MODEL = HERE.parent / "apps" / "web" / "public" / "models" / "ward-lite"
EVAL = HERE.parent / "eval" / "results"

meta = json.loads((MODEL / "ward-lite.json").read_text())
tok = AutoTokenizer.from_pretrained(MODEL)
opts = ort.SessionOptions()
opts.intra_op_num_threads = 1  # like a phone's WebView: one thread
sess = ort.InferenceSession(str(MODEL / "onnx" / "model_quantized.onnx"), opts, providers=["CPUExecutionProvider"])

sets = json.loads((EVAL / "scorecard.raw.json").read_text())["sets"]
preds, n, t0 = {}, 0, time.time()
for name, items in sets.items():
    preds[name] = {}
    texts = [it["text"] for it in items]
    for i in range(0, len(texts), 16):
        enc = tok(texts[i : i + 16], truncation=True, max_length=meta["max_length"], padding=True, return_tensors="np")
        logits = sess.run(["logits"], {"input_ids": enc["input_ids"].astype(np.int64), "attention_mask": enc["attention_mask"].astype(np.int64)})[0]
        p = 1 / (1 + np.exp(-logits))
        for t, row in zip(texts[i : i + 16], p):
            preds[name][t] = bool(row[0] >= meta["threshold"] or row[1] >= meta["threshold"])
        n += len(texts[i : i + 16])
ms = (time.time() - t0) * 1000 / n
(EVAL / "ward-lite.preds.json").write_text(json.dumps(preds, ensure_ascii=False))
print(f"{n} messages, {ms:.1f} ms per message on one CPU thread")
for name, items in sets.items():
    y = np.array([it["bad"] for it in items])
    p = np.array([preds[name][it["text"]] for it in items])
    tp = int((p & y).sum())
    print(f"{name}: recall {tp / max(1, y.sum()):.0%}, precision {tp / max(1, p.sum()):.0%}")
