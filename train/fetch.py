"""Downloads the public train splits as parquet (one request per file, no rate limits) and writes
them where build-data.ts reads them: data/raw/<dataset>__<config>__<split>.json."""
import json, sys, urllib.request, io
from pathlib import Path
import pyarrow.parquet as pq

RAW = Path(__file__).parent / "data" / "raw"
RAW.mkdir(parents=True, exist_ok=True)
SETS = [
    ("community-datasets/roman_urdu_hate_speech", "Coarse_Grained", "train"),
    ("surrey-nlp/Cyberbullying-Detection-CB1", "default", "train"),
    ("pankajbiswas6/prism-hinglish-hate-speech", "default", "train"),
    ("mteb/bengali_hate_speech", "default", "train"),
    ("mteb/bengali_hate_speech", "default", "test"),
    ("khondoker/SentNoB", "default", "train"),
]
for ds, cfg, split in SETS:
    urls = json.load(urllib.request.urlopen(f"https://huggingface.co/api/datasets/{ds}/parquet/{cfg}/{split}"))
    rows = []
    for u in urls:
        rows += pq.read_table(io.BytesIO(urllib.request.urlopen(u).read())).to_pylist()
    out = RAW / f"{ds.replace('/', '__')}__{cfg}__{split}.json"
    out.write_text(json.dumps(rows, ensure_ascii=False))
    print(len(rows), out.name)
