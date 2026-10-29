# Ward Lite

A small multilingual classifier that reads chat messages on any device, including cheap phones
with no internet. It's `intfloat/multilingual-e5-small` fine-tuned with two outputs per message,
**hurtful** and **danger** (threats, telling someone to hurt themselves, sexual pressure, threats
to expose), then trimmed to the vocabulary our languages use and quantised to int8 ONNX.

In the app it has **raise-only** authority: it can flag what the word lists missed, but it can
never clear a warning. Only Gemma 4 on a computer may decide that rude words between friends
were banter.

## Reproduce it

```bash
uv venv --python 3.12 .venv && uv pip install --python .venv -r pyproject.toml pyarrow
.venv/bin/python fetch.py                          # public train splits, as parquet
ollama pull gemma4:e4b
node --experimental-strip-types gen-synthetic.ts   # kid-style chats written by Gemma 4 (resumable)
node --experimental-strip-types build-data.ts      # dedupe + leak check against the scorecard
.venv/bin/python train.py                          # fine-tune, trim, export to apps/web/public/models
.venv/bin/python score.py                          # run the exported model on the scorecard sample
cd .. && pnpm eval -- --only="Ward Lite,Phone: packs + Ward Lite"
```

`build-data.ts` refuses to run until `pnpm eval` has cached the scorecard's eval sets, because it
needs them to drop any training message the scorecard tests on. The data card is
[DATA.md](DATA.md).

Training takes minutes on an Apple M-series laptop (PyTorch on MPS). Don't run it while Ollama
has Gemma loaded on a 16 GB machine; they compete for the same memory.
