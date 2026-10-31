"""Picks Ward Lite's "hurtful" threshold per script (Bangla, Devanagari, Latin) on the DEV split,
never on the scorecard, and writes it into ward-lite.json. The app detects the script of each
message and uses that script's threshold. Danger gets one calibrated threshold, `danger_threshold`
(see below); readers fall back to `threshold` when it's missing.

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

# Danger: one threshold for every script (danger positives are too few per script). A danger flag
# makes a message severity 3, "urgent", so false alarms cost a lot; missing a real threat costs
# more. Pick the highest threshold that keeps at least 97% of the danger recall reached at 0.5 on
# the dev split (never below 0.5): it trims the borderline flags without giving up real threats.
yd = np.array([r["danger"] for r in rows])
pd = p[:, 1]
def danger_stats(t):
    pred = pd >= t
    tp = (pred & (yd == 1)).sum()
    return tp / max(1, (yd == 1).sum()), tp / max(1, pred.sum()), int((pred & (yd == 0)).sum())
rec05, prec05, fp05 = danger_stats(0.5)
grid = np.arange(0.5, 0.951, 0.01)
ok = [t for t in grid if danger_stats(t)[0] >= rec05 * 0.97]
dt = round(float(max(ok)), 2)
rec, prec, fp = danger_stats(dt)
print(f"danger: {int(yd.sum())} positives in dev; at 0.50 recall {rec05:.3f} precision {prec05:.3f} ({fp05} false); at {dt:.2f} recall {rec:.3f} precision {prec:.3f} ({fp} false)")
meta["danger_threshold"] = dt
(MODEL / "ward-lite.json").write_text(json.dumps(meta, indent=2))
print(json.dumps(meta))
