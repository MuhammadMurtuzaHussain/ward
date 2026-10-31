"""Runs Ward Lite (the same int8 ONNX file the app ships) on the red-team set and writes its raw
scores to eval/results/redteam-lite.preds.json for eval/redteam/run.ts, which applies the app's
thresholds. The same way train/score.py does it for the scorecard. Uses train/'s environment:

    train/.venv/bin/python eval/redteam/score-lite.py
"""
import hashlib, json
from pathlib import Path

import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
MODEL = ROOT / "apps" / "web" / "public" / "models" / "ward-lite"
ONNX = MODEL / "onnx" / "model_quantized.onnx"
OUT = ROOT / "eval" / "results" / "redteam-lite.preds.json"

meta = json.loads((MODEL / "ward-lite.json").read_text())
tok = AutoTokenizer.from_pretrained(MODEL)
opts = ort.SessionOptions()
opts.intra_op_num_threads = 1
sess = ort.InferenceSession(str(ONNX), opts, providers=["CPUExecutionProvider"])

texts = sorted(
    {json.loads(l)["text"] for f in sorted(HERE.glob("*.jsonl")) for l in f.read_text(encoding="utf8").splitlines() if l.strip()}
)
probs = {}
for i in range(0, len(texts), 16):
    batch = texts[i : i + 16]
    enc = tok(batch, truncation=True, max_length=meta["max_length"], padding=True, return_tensors="np")
    logits = sess.run(["logits"], {"input_ids": enc["input_ids"].astype(np.int64), "attention_mask": enc["attention_mask"].astype(np.int64)})[0]
    p = 1 / (1 + np.exp(-logits))
    for t, row in zip(batch, p):
        probs[t] = [round(float(row[0]), 4), round(float(row[1]), 4)]

OUT.parent.mkdir(parents=True, exist_ok=True)
sha = hashlib.sha256(ONNX.read_bytes()).hexdigest()
OUT.write_text(json.dumps({"model_sha256": sha, "labels": meta["labels"], "probs": probs}, ensure_ascii=False, indent=1))
print(f"Ward Lite scored {len(texts)} red-team messages -> {OUT.relative_to(ROOT)}")
