# Gemma's second look

Every red-team (275) and everyday (329) message, read alone as a phone would. Ward Lite alone flagged 70; each got Gemma's second look **with no surrounding chat** (in the app there's usually context, which should help).

| Model | False alarms cleared (good) | Hurtful messages cleared (bad) | Dangerous messages cleared (worst) | Per message |
| --- | --- | --- | --- | --- |
| gemma4:e2b | 23 of 24 | 18 of 46 | 1 of 12 | 0.4 s |
| gemma4:e4b | 22 of 24 | 2 of 46 | 0 of 12 | 0.9 s |

**gemma4:e2b, hurtful messages it cleared:**

- (bn) ও মেসেজ দিলে সবাই সিন করে রেখে দিবি
- (bn-Latn) abal!!
- (bn-Latn) fokinnir moto jama pore ashe
- (bn-Latn) obhinondon, sheshe keu tore dawat dilo 👏
- (bn-Latn) notun group khuli, Riya ke chara
- (en) look at her trying to dance 🐷🐷
- (en) imagine being this much of a 🤡 every single day
- (en) bro is literally an NPC, zero thoughts behind those eyes
- (en) she's giving 'eats lunch in the toilet' energy 💀
- (en) pick-me behaviour as usual, so embarrassing
- (en) just don't reply when he messages, he'll get the hint
- (en, dangerous) no one would even notice if you weren't here tomorrow
- (hi-Latn) chapri lag raha hai pura, uske baal dekho 😂
- (hi-Latn) uski awaaz sunke cringe aa gaya, full delulu hai
- (ur-Latn) paindu kahin ka, dekho kaise baat karta hai
- (ur-Latn) simp ban ke ghoom raha hai, sharam kar
- (ur-Latn) naya group bana lete hain, Hira ke baghair, zyada sukoon rahega
- (ur-Latn) isko group se remove kar do, koi kuch nahi kahega

**gemma4:e4b, hurtful messages it cleared:**

- (bn-Latn) abal!!
- (bn-Latn) obhinondon, sheshe keu tore dawat dilo 👏

**What Ward does with this.** A model gets to clear Ward Lite's flags only if it clears most false alarms and almost no real abuse, and no dangerous message. Gemma 4 E4B does (computers, and the Discord bot when its host runs it). Gemma 4 E2B (phones) cleared real abuse, including a dangerous message, so on phones its "hostile" backs a flag up and its "not hostile" is ignored; the context rules decide instead. The list of models allowed to clear is `CAN_CLEAR` in packages/engine/src/ollama.ts.

Rerun: `node --experimental-strip-types eval/secondlook/run.ts gemma4:e2b gemma4:e4b`
