// For the adult a child chose to tell. Bullying research is consistent that what helps most is
// an adult who listens and acts, and that children stop telling when telling costs them (their
// phone, a scene at school). This page is written to be handed over on the child's phone, in
// English or Urdu.

import { useState } from "react";
import { Check, X } from "@phosphor-icons/react";
import { HelpNow } from "../components/HelpNow.tsx";
import { BackBar, Screen } from "../components/ui.tsx";

type Lang = "en" | "ur";

const TEXT: Record<
  Lang,
  { title: string; intro: string; doTitle: string; dos: string[]; dontTitle: string; donts: string[]; nextTitle: string; next: [string, string][]; careTitle: string; care: string }
> = {
  en: {
    title: "For the adult they trusted",
    intro: "A child showed you this because they trust you. What you do in the next few minutes decides whether they tell you next time.",
    doTitle: "Do",
    dos: [
      "Listen first. Let them finish. Don't ask why they didn't tell you sooner.",
      "Believe them, and tell them it isn't their fault.",
      "Thank them for telling you. It took courage.",
      "Leave their phone with them. Taking it away feels like a punishment, and fear of losing it is why many children never tell.",
      "Keep the evidence before anything is deleted. If they saved it in Ward's vault, it's already safe.",
      "Decide the next step together, and tell them before you do anything.",
    ],
    dontTitle: "Don't",
    donts: [
      "Don't reply to the bully or post about it.",
      "Don't confront the other child or their family in anger. It can make school harder for your child.",
      "Don't say \"just ignore it\" or \"toughen up\".",
      "Don't show their messages to anyone without asking them first.",
    ],
    nextTitle: "Next steps",
    next: [
      ["School", "Ask to meet the class teacher or counsellor and bring the report from Ward's vault. Ask for a written plan, and check back after a week."],
      ["The app", "Report and block the accounts. The steps for each app are on Ward's \"What do I do?\" page."],
      ["A helpline", "For threats, sexual images, blackmail, or if the school doesn't act, call a helpline below. They help with complaints to the police too."],
      ["Right now", "If they talk about hurting themselves or they're in danger, stay with them and call the emergency number below."],
    ],
    careTitle: "Over the next weeks",
    care: "Watch for changes in sleep, eating, or not wanting to go to school. Keep talking, and ask again in a few days how things are. One conversation is a start, not the end.",
  },
  ur: {
    title: "اُس بڑے کے لیے جن پر بچے نے بھروسہ کیا",
    intro: "بچے نے آپ کو یہ اس لیے دکھایا ہے کیونکہ انہیں آپ پر بھروسہ ہے۔ اگلے چند منٹ میں آپ کا رویہ طے کرے گا کہ اگلی بار وہ آپ کو بتائیں گے یا نہیں۔",
    doTitle: "کیا کریں",
    dos: [
      "پہلے پوری بات سنیں۔ بیچ میں نہ ٹوکیں، اور یہ نہ پوچھیں کہ پہلے کیوں نہیں بتایا۔",
      "اُن کا یقین کریں، اور کہیں کہ اس میں اُن کا کوئی قصور نہیں۔",
      "بتانے پر اُن کا شکریہ ادا کریں۔ یہ ہمت کی بات ہے۔",
      "فون اُن سے نہ لیں۔ فون لے لینا سزا لگتا ہے، اور بہت سے بچے اسی ڈر سے کبھی نہیں بتاتے۔",
      "کچھ ڈیلیٹ ہونے سے پہلے ثبوت محفوظ کریں۔ اگر بچے نے Ward کے والٹ میں رکھا ہے تو وہ پہلے سے محفوظ ہے۔",
      "اگلا قدم مل کر طے کریں، اور کچھ کرنے سے پہلے اُنہیں بتائیں۔",
    ],
    dontTitle: "کیا نہ کریں",
    donts: [
      "تنگ کرنے والے کو جواب نہ دیں اور اس بارے میں کچھ پوسٹ نہ کریں۔",
      "غصے میں دوسرے بچے یا اُس کے گھر والوں سے نہ اُلجھیں۔ اس سے اسکول میں آپ کے بچے کی مشکل بڑھ سکتی ہے۔",
      "یہ نہ کہیں کہ \"نظرانداز کر دو\" یا \"مضبوط بنو\"۔",
      "بچے سے پوچھے بغیر اُن کے پیغامات کسی کو نہ دکھائیں۔",
    ],
    nextTitle: "اگلے قدم",
    next: [
      ["اسکول", "کلاس ٹیچر یا کونسلر سے ملاقات کریں اور Ward کے والٹ سے رپورٹ ساتھ لے جائیں۔ تحریری منصوبہ مانگیں اور ایک ہفتے بعد دوبارہ پوچھیں۔"],
      ["ایپ", "اکاؤنٹس کو رپورٹ اور بلاک کریں۔ ہر ایپ کا طریقہ Ward کے \"کیا کروں؟\" صفحے پر ہے۔"],
      ["ہیلپ لائن", "دھمکیوں، تصویروں، بلیک میل، یا اگر اسکول کچھ نہ کرے تو نیچے دی گئی ہیلپ لائن پر کال کریں۔ پاکستان میں ڈیجیٹل رائٹس فاؤنڈیشن کی سائبر ہراسمنٹ ہیلپ لائن 0800-39393 (پیر سے جمعہ، صبح 9 سے شام 5 بجے) پولیس میں شکایت میں بھی مدد کرتی ہے۔"],
      ["فوری خطرہ", "اگر بچہ خود کو نقصان پہنچانے کی بات کرے یا خطرے میں ہو تو اُن کے ساتھ رہیں اور 15 پر کال کریں۔"],
    ],
    careTitle: "آنے والے ہفتوں میں",
    care: "نیند، کھانے، یا اسکول نہ جانے کی خواہش میں تبدیلی پر نظر رکھیں۔ بات کرتے رہیں، اور چند دن بعد خود پوچھیں کہ اب کیسا ہے۔ ایک بات چیت آغاز ہے، اختتام نہیں۔",
  },
};

export function AdultGuide() {
  const [lang, setLang] = useState<Lang>("en");
  const t = TEXT[lang];
  const rtl = lang === "ur";
  return (
    <Screen>
      <BackBar
        right={
          <div className="flex rounded-full bg-raised p-1" role="group" aria-label="Language">
            {(["en", "ur"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`min-h-9 rounded-full px-4 text-sm font-bold ${lang === l ? "bg-glow text-glow-ink" : "text-dim"}`}
              >
                {l === "en" ? "English" : "اردو"}
              </button>
            ))}
          </div>
        }
      />
      <article dir={rtl ? "rtl" : "ltr"} lang={lang} className={rtl ? "font-[system-ui] text-[1.1rem] leading-[2]" : ""}>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-4 max-w-[60ch] text-lg">{t.intro}</p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-display text-xl font-bold text-safe">{t.doTitle}</h2>
            <ul className="mt-3 grid gap-3">
              {t.dos.map((d) => (
                <li key={d} className="flex gap-3">
                  <Check size={20} weight="bold" className="mt-1 shrink-0 text-safe" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-alarm">{t.dontTitle}</h2>
            <ul className="mt-3 grid gap-3">
              {t.donts.map((d) => (
                <li key={d} className="flex gap-3">
                  <X size={20} weight="bold" className="mt-1 shrink-0 text-alarm" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">{t.nextTitle}</h2>
          <dl className="mt-3 grid gap-3">
            {t.next.map(([k, v]) => (
              <div key={k} className="rounded-card border border-line bg-surface p-4">
                <dt className="font-display font-bold text-glow">{k}</dt>
                <dd className="mt-1 text-dim">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">{t.careTitle}</h2>
          <p className="mt-2 max-w-[60ch] text-dim">{t.care}</p>
        </section>
      </article>

      <div className="mt-10">
        <HelpNow />
      </div>
    </Screen>
  );
}
