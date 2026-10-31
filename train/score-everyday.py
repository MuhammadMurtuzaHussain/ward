"""The everyday false-alarm check: runs the exported Ward Lite on eval/everyday/everyday.jsonl
(ordinary, clearly friendly kid-style messages, many sharing words with threats: "see you
tomorrow", "wait for me at the gate") and reports how often it flags them, the way the app
decides: hurtful at or above the script's threshold, or danger at or above the danger threshold
(which makes a message severity 3, "urgent").

Every message in the set is benign, so every flag is a false alarm. Training never reads this
set: build-data.ts drops any training message that matches or nearly matches one.

    .venv/bin/python score-everyday.py [model dir] [--save name]
"""
import json, re, sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

HERE = Path(__file__).parent
SAVE = sys.argv[sys.argv.index("--save") + 1] if "--save" in sys.argv else None
args = [a for a in sys.argv[1:] if not a.startswith("--") and a != SAVE]
MODEL = Path(args[0]) if args else HERE.parent / "apps" / "web" / "public" / "models" / "ward-lite"
SET = HERE.parent / "eval" / "everyday" / "everyday.jsonl"

meta = json.loads((MODEL / "ward-lite.json").read_text())
tok = AutoTokenizer.from_pretrained(MODEL)
sess = ort.InferenceSession(str(MODEL / "onnx" / "model_quantized.onnx"), providers=["CPUExecutionProvider"])


def script(text):
    if re.search(r"[ঀ-৿]", text):
        return "bengali"
    if re.search(r"[ऀ-ॿ]", text):
        return "devanagari"
    return "latin"


hurt_t = lambda text: meta.get("thresholds", {}).get(script(text), meta["threshold"])
danger_t = meta.get("danger_threshold", meta["threshold"])

rows = [json.loads(l) for l in SET.read_text(encoding="utf-8").split("\n") if l.strip()]
probs = []
for i in range(0, len(rows), 32):
    enc = tok([r["text"] for r in rows[i : i + 32]], truncation=True, max_length=meta["max_length"], padding=True, return_tensors="np")
    logits = sess.run(["logits"], {"input_ids": enc["input_ids"].astype(np.int64), "attention_mask": enc["attention_mask"].astype(np.int64)})[0]
    probs.append(1 / (1 + np.exp(-logits)))
p = np.concatenate(probs)

out = {"model": str(MODEL.name), "danger_threshold": danger_t, "hurtful_thresholds": meta.get("thresholds", {}), "by_lang": {}, "items": []}
for r, (h, d) in zip(rows, p):
    out["items"].append({**r, "hurtful": round(float(h), 3), "danger": round(float(d), 3), "flagged": bool(h >= hurt_t(r["text"]) or d >= danger_t), "urgent": bool(d >= danger_t)})


def summary(items):
    n = len(items)
    return {
        "n": n,
        "flagged": sum(i["flagged"] for i in items),
        "urgent": sum(i["urgent"] for i in items),
        "false_alarm_rate": round(sum(i["flagged"] for i in items) / max(1, n), 3),
        "urgent_rate": round(sum(i["urgent"] for i in items) / max(1, n), 3),
    }


items = out["items"]
for lang in sorted({i["lang"] for i in items}):
    out["by_lang"][lang] = summary([i for i in items if i["lang"] == lang])
out["shares_threat_words"] = summary([i for i in items if i.get("shares")])
out["ordinary"] = summary([i for i in items if not i.get("shares")])
out["all"] = summary(items)

print(f"{'set':<22}{'n':>5}{'flagged':>9}{'urgent':>8}")
for name, s in [*out["by_lang"].items(), ("shares threat words", out["shares_threat_words"]), ("ordinary", out["ordinary"]), ("all", out["all"])]:
    print(f"{name:<22}{s['n']:>5}{s['false_alarm_rate']:>9.0%}{s['urgent_rate']:>8.0%}")
if SAVE:
    (HERE.parent / "eval" / "everyday" / f"results-{SAVE}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
