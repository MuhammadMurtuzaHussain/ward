// Synthetic kid-style chat messages, written by Gemma 4 on this machine, for training Ward Lite.
// Public datasets are tweets and YouTube comments; children's group chats look different, and
// friendly banter (insult words used with affection) is the hardest negative to learn. Each
// message's label comes from the kind it was asked to write. Resumable: reruns skip done batches.
//   node --experimental-strip-types gen-synthetic.ts
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const OUT = new URL("./data/synthetic.jsonl", import.meta.url);
// Bangla first: it has no public non-abusive examples, so it needs these the most.
const LANGS: Record<string, string> = {
  bn: "Bangla, mostly in Bangla script with some Banglish (Bangla in Latin letters), the way Bangladeshi kids text",
  "hi-Latn": "Hinglish: Hindi written in Latin letters mixed with English, the way Indian kids text",
  "ur-Latn": "Roman Urdu: Urdu written in Latin letters the way Pakistani kids text, with English mixed in and inconsistent spelling",
  en: "English, the way 10 to 17 year olds text (lowercase, slang, typos, emoji)",
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
  // Hard negatives and intent-only threats (added after Ward Lite learned that "see you tomorrow"
  // is a threat: the threat batches above are full of "later", "tomorrow", "after school", "meet
  // me", and almost nothing friendly used those words). See DATA.md.
  ["plans", 0, 0, "friendly everyday plans and goodbyes between friends or family that use the same words threats use, but clearly kind: see you tomorrow, see you later, see you after school, meet at the gate, wait for me at the bus stop, I'll come over later, bring my notebook tomorrow, practice after school, tuition at 5, good night see you in the morning. Include many very short ones (1 to 5 words) like a real goodbye"],
  ["caring", 0, 0, "kids being warm and helpful to a friend or sibling with words that could look scary out of context but are clearly kind: I'll get you a snack, I'm coming to your house, wait there I'm coming, I'll find you at break, don't tell anyone about the surprise party, I'll save you a seat, we're coming for you at 6 to go to the match"],
  ["gaming", 0, 0, "friendly trash talk about a video game or sport that clearly names the game (Free Fire, PUBG, FIFA, Minecraft, Roblox, cricket, ludo), both kids laughing, about the game only, nobody's real body or life threatened"],
  ["threat-intent", 1, 1, "real threats of violence to one classmate that say what will be done to them, WITHOUT any time or meeting words (no tomorrow, later, after school, tonight, meet me, see you, wait): I'll break your teeth, you're going to get hurt, my brother will beat you, nobody will save you, I'll make you bleed"],
  ["coercion", 1, 1, "real threats or pressure WITHOUT any time or meeting words (no tomorrow, later, after school, tonight, meet me, see you): threatening to post a classmate's private photos or chats, blackmail for money, pressuring them to send photos of themselves, telling them to kill themselves"],
];
const PER_CALL = 25;
const CALLS = 3;
const CALLS_FOR: Record<string, number> = { plans: 5, caring: 4, gaming: 2, "threat-intent": 4, coercion: 3 };

const done = new Set<string>();
if (existsSync(OUT)) for (const l of readFileSync(OUT, "utf8").split("\n").filter(Boolean)) done.add(JSON.parse(l).batch);

const schema = { type: "object", properties: { messages: { type: "array", items: { type: "string" } } }, required: ["messages"] };

for (const [lang, langDesc] of Object.entries(LANGS)) {
  for (const [kind, hurtful, danger, desc] of KINDS) {
    // Extra Bangla negatives, for the reason above.
    const calls = CALLS_FOR[kind] ?? (lang === "bn" && !hurtful ? CALLS + 3 : CALLS);
    for (let c = 0; c < calls; c++) {
      const batch = `${lang}/${kind}/${c}`;
      if (done.has(batch)) continue;
      const prompt = `You are helping build a free, open-source app that protects children from cyberbullying by recognising it on their own phone. To train its classifier we need realistic example messages.

Write ${PER_CALL} different single chat messages in ${langDesc}.
Kind: ${desc}.
Make them varied: different lengths (2 to 25 words), different names (South Asian and other names), different situations. They must sound like real teenagers in a WhatsApp group, not like a textbook. Do not number them. Return JSON {"messages": [...]}.${c % 3 === 1 ? " Use more slang and creative spelling this time." : c % 3 === 2 ? " Make some of them subtle or indirect this time." : ""}${c >= 3 ? " Different topics and names from before." : ""}`;
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
