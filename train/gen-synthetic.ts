// Synthetic kid-style chat messages, written by Gemma 4 on this machine, for training Ward Lite.
// Public datasets are tweets and YouTube comments; children's group chats look different, and
// friendly banter (insult words used with affection) is the hardest negative to learn. Each
// message's label comes from the kind it was asked to write. Resumable: reruns skip done batches.
//   node --experimental-strip-types gen-synthetic.ts
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const OUT = new URL("./data/synthetic.jsonl", import.meta.url);
const LANGS: Record<string, string> = {
  en: "English, the way 10 to 17 year olds text (lowercase, slang, typos, emoji)",
  "ur-Latn": "Roman Urdu: Urdu written in Latin letters the way Pakistani kids text, with English mixed in and inconsistent spelling",
  "hi-Latn": "Hinglish: Hindi written in Latin letters mixed with English, the way Indian kids text",
  bn: "Bangla, mostly in Bangla script with some Banglish (Bangla in Latin letters), the way Bangladeshi kids text",
};
// [kind, hurtful, danger, instruction]
const KINDS: [string, 0 | 1, 0 | 1, string][] = [
  ["normal", 0, 0, "ordinary group-chat messages: homework, exams, cricket, football, games, plans, food, family, jokes"],
  ["banter", 0, 0, "friends teasing each other affectionately, both laughing, using mild insult words like idiot, donkey, crazy, loser in a friendly way, clearly not meant to hurt"],
  ["support", 0, 0, "kids standing up for someone or comforting a friend: telling bullies to stop, checking a friend is okay"],
  ["venting", 0, 0, "kids complaining or upset about school, teachers, parents or a bad day, without attacking anyone"],
  ["insult", 1, 0, "messages insulting one specific classmate: calling them stupid, worthless, a loser, mocking how they talk or what they do"],
  ["appearance", 1, 0, "messages mocking one classmate's body, weight, skin colour, face or clothes"],
  ["exclusion", 1, 0, "messages leaving one classmate out on purpose: don't add them, remove them from the group, nobody wants them, don't sit with them"],
  ["mockery", 1, 0, "several kids laughing at one classmate together, sharing their photo to laugh at, calling them a crybaby or attention seeker"],
  ["threat", 1, 1, "threats of violence to one classmate: meet me after school, I'll beat you, watch your back, you'll see what happens"],
  ["selfharm", 1, 1, "messages telling one classmate to kill themselves, die, or that the world is better without them"],
  ["sexual", 1, 1, "messages pressuring a classmate to send photos or video call, or sexual comments about them"],
  ["exposure", 1, 1, "threats to share a classmate's private photos, chats or address with everyone, or make them go viral, or blackmail"],
];
const PER_CALL = 25;
const CALLS = 3;

const done = new Set<string>();
if (existsSync(OUT)) for (const l of readFileSync(OUT, "utf8").split("\n").filter(Boolean)) done.add(JSON.parse(l).batch);

const schema = { type: "object", properties: { messages: { type: "array", items: { type: "string" } } }, required: ["messages"] };

for (const [lang, langDesc] of Object.entries(LANGS)) {
  for (const [kind, hurtful, danger, desc] of KINDS) {
    for (let c = 0; c < CALLS; c++) {
      const batch = `${lang}/${kind}/${c}`;
      if (done.has(batch)) continue;
      const prompt = `You are helping build a free, open-source app that protects children from cyberbullying by recognising it on their own phone. To train its classifier we need realistic example messages.

Write ${PER_CALL} different single chat messages in ${langDesc}.
Kind: ${desc}.
Make them varied: different lengths (2 to 25 words), different names (South Asian and other names), different situations. They must sound like real teenagers in a WhatsApp group, not like a textbook. Do not number them. Return JSON {"messages": [...]}.${c === 1 ? " Use more slang and creative spelling this time." : c === 2 ? " Make some of them subtle or indirect this time." : ""}`;
      try {
        const r = await fetch("http://127.0.0.1:11434/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ model: "gemma4:e4b", stream: false, think: false, format: schema, options: { temperature: 0.95, num_ctx: 4096 }, messages: [{ role: "user", content: prompt }] }),
        });
        const j = (await r.json()) as { message: { content: string } };
        const msgs = (JSON.parse(j.message.content).messages as string[]).map((s) => s.trim()).filter((s) => s.length > 1);
        for (const text of msgs) appendFileSync(OUT, JSON.stringify({ text, hurtful, danger, lang, kind, source: "synthetic-gemma4", batch }) + "\n");
        console.log(batch, msgs.length);
      } catch (e) {
        console.log(batch, "failed", String(e).slice(0, 100));
      }
    }
  }
}
