import type { Unit } from "./types.ts";

const ALL = ["8", "11", "14"] as const;
const OLDER = ["11", "14"] as const;

export const UNITS: Unit[] = [
  {
    id: "spot",
    title: "Spot it",
    about: "Tell the difference between friends joking and someone being bullied.",
    icon: "eye",
    lessons: [
      {
        id: "spot-1",
        title: "Joke or jab?",
        line: "Banter goes both ways. Bullying doesn't.",
        ages: [...ALL],
        exercises: [
          {
            kind: "truefalse",
            statement: "If someone says \"it was just a joke\", then it wasn't bullying.",
            answer: false,
            why: "A joke is only a joke if everyone is laughing. If it keeps hurting the same person, it's bullying, whatever they call it.",
          },
          {
            kind: "sort",
            prompt: "Sort these into friendly teasing and bullying.",
            bins: ["Friendly teasing", "Bullying"],
            items: [
              { text: "Two friends calling each other \"donkey\" and both laughing", bin: 0 },
              { text: "The whole group laughing at one person's photo every day", bin: 1 },
              { text: "\"Nobody wants you here\"", bin: 1 },
              { text: "\"You're so bad at FIFA lol, rematch?\"", bin: 0 },
              { text: "Making a new account just to send someone insults", bin: 1 },
            ],
            why: "Teasing between friends goes both ways and stops when someone's hurt. Bullying keeps landing on the same person, and they can't make it stop.",
          },
          {
            kind: "choose",
            prompt: "Zara keeps posting \"lol\" under every mean comment about Ayesha. Is Zara part of it?",
            options: [
              { text: "No, she didn't write anything mean", why: "Laughing along tells the bully the audience is with them. It's a small push, but it is a push." },
              { text: "Yes, laughing along makes it bigger", right: true, why: "Right. Bullies need an audience. Every \"lol\" makes it feel like everyone agrees." },
              { text: "Only if Ayesha sees it", why: "Ayesha almost always sees it. That's the point of doing it in a group." },
            ],
          },
          {
            kind: "spot",
            prompt: "Tap the message where teasing turns into bullying.",
            chat: [
              { from: "Rohan", text: "bro you missed an open goal 😂" },
              { from: "Kabir", text: "haha I know, my legs gave up" },
              { from: "Rohan", text: "next time I'm passing to the goalpost" },
              { from: "Dev", text: "honestly kabir just quit, nobody wants you on the team", flag: true },
              { from: "Kabir", text: "..." },
            ],
            why: "The first jokes were about one bad shot, and Kabir joined in. \"Nobody wants you\" is about him as a person, and he stops talking.",
          },
        ],
      },
      {
        id: "spot-2",
        title: "Quiet kinds of mean",
        line: "Leaving out, ghosting, and the eye-roll emoji.",
        ages: [...ALL],
        exercises: [
          {
            kind: "truefalse",
            statement: "Bullying always uses rude words.",
            answer: false,
            why: "Leaving someone out of a group on purpose, ignoring only them, or sharing their secrets can hurt as much as name-calling.",
          },
          {
            kind: "choose",
            prompt: "A new group chat is made for the class trip. Everyone is in it except Mia. What is this?",
            options: [
              { text: "Probably a mistake, check before deciding", why: "It's fair to check. But if people say \"don't add her\", it isn't a mistake." },
              { text: "Exclusion, if it's on purpose", right: true, why: "Yes. Leaving someone out on purpose is a kind of bullying. Ward looks for it." },
              { text: "Not a big deal, it's just a chat", why: "For the person left out it can feel like the whole class decided against them." },
            ],
          },
          {
            kind: "spot",
            prompt: "Which message is exclusion?",
            chat: [
              { from: "Sana", text: "who's coming saturday?" },
              { from: "Hira", text: "me!! what time" },
              { from: "Sana", text: "4pm. dont tell mia btw, she'll want to come", flag: true },
              { from: "Hira", text: "ok 👍" },
            ],
            why: "Planning to keep one person out, and hiding it from her, is exclusion.",
          },
        ],
      },
    ],
  },
  {
    id: "stop",
    title: "Shut it down",
    about: "Block, mute and report, so the bully loses their way in.",
    icon: "hand",
    lessons: [
      {
        id: "stop-1",
        title: "Don't feed it",
        line: "Why replying angry gives them what they want.",
        ages: [...ALL],
        exercises: [
          {
            kind: "choose",
            prompt: "Someone you don't know sends: \"ur so ugly lmao\". What's the best first move?",
            options: [
              { text: "Reply with something meaner", why: "That's what they hoped for. Now there's a fight, and it can look like you started it." },
              { text: "Don't reply. Save it, then block.", right: true, why: "Yes. No reaction means no fun for them, and the saved message is your evidence." },
              { text: "Delete the whole chat so you don't see it", why: "Understandable, but then the proof is gone. Save it first, then block." },
            ],
          },
          {
            kind: "truefalse",
            statement: "Blocking someone means you're weak or scared.",
            answer: false,
            why: "Blocking is like closing your front door. You decide who gets in. That's strength.",
          },
          {
            kind: "sort",
            prompt: "Which of these help, and which make it worse?",
            bins: ["Helps", "Makes it worse"],
            items: [
              { text: "Muting the group at night", bin: 0 },
              { text: "Posting about the bully to get back at them", bin: 1 },
              { text: "Reporting the account to the app", bin: 0 },
              { text: "Reading the mean messages again and again", bin: 1 },
              { text: "Leaving the group if it keeps happening", bin: 0 },
            ],
            why: "Anything that cuts off their way to you helps. Anything that keeps you inside the fight, or keeps it in your head, makes it worse.",
          },
        ],
      },
      {
        id: "stop-2",
        title: "Report it right",
        line: "Where the report button is, and what happens next.",
        ages: [...ALL],
        exercises: [
          {
            kind: "truefalse",
            statement: "When you report someone on WhatsApp, Instagram or TikTok, they are told who reported them.",
            answer: false,
            why: "Reports are anonymous on these apps. The person isn't told it was you.",
          },
          {
            kind: "choose",
            prompt: "On WhatsApp, how do you report someone?",
            options: [
              { text: "Open the chat, tap their name, scroll down to Report", right: true, why: "Yes. WhatsApp also sends the last few messages with the report, so they can see what happened." },
              { text: "Email WhatsApp a screenshot", why: "Reporting inside the app is faster, and it includes the recent messages automatically." },
              { text: "There's no way to report on WhatsApp", why: "There is. Their name, then scroll down to Report." },
            ],
          },
          {
            kind: "choose",
            prompt: "You reported an account but it's still there a day later. Now what?",
            options: [
              { text: "Give up, reporting doesn't work", why: "Apps don't always act fast. Your report still counts, and more reports help." },
              { text: "Block it, keep your evidence, and tell an adult you trust", right: true, why: "Yes. Blocking protects you now. An adult can report it again, or to your school." },
              { text: "Make an account to bully them back", why: "That puts you in trouble too, and the bullying gets bigger." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "save",
    title: "Save it",
    about: "Keep proof, so adults have to take it seriously.",
    icon: "camera",
    lessons: [
      {
        id: "save-1",
        title: "Proof that sticks",
        line: "Screenshots, dates and names.",
        ages: [...ALL],
        exercises: [
          {
            kind: "truefalse",
            statement: "A screenshot is good evidence even if you can't see who sent the message or when.",
            answer: false,
            why: "A good screenshot shows who sent it and when. Without those, it's easy for someone to say it was made up.",
          },
          {
            kind: "choose",
            prompt: "What should you save before you block someone?",
            options: [
              { text: "Only the worst message", why: "One message can look like a one-off. The pattern is what proves bullying." },
              { text: "The messages, with names and times showing", right: true, why: "Yes. Ward's vault keeps the whole chat with times, and locks it with your PIN." },
              { text: "Nothing, blocking deletes it anyway", why: "Blocking doesn't delete the chat, but you might delete it later. Save first." },
            ],
          },
          {
            kind: "truefalse",
            statement: "Ward's vault sends your saved evidence to your school.",
            answer: false,
            why: "Ward never sends anything. The vault is locked on your device. You can make a report and choose who to give it to.",
          },
        ],
      },
    ],
  },
  {
    id: "say",
    title: "Say it",
    about: "Tell someone you trust, and know what to say.",
    icon: "chat",
    lessons: [
      {
        id: "say-1",
        title: "Who's in your corner?",
        line: "Picking your trusted adults.",
        ages: [...ALL],
        exercises: [
          {
            kind: "truefalse",
            statement: "Telling an adult is the same as snitching.",
            answer: false,
            why: "Snitching is getting someone in trouble for fun. Telling is getting help when someone is being hurt, and that someone is you.",
          },
          {
            kind: "sort",
            prompt: "Who could be a trusted adult?",
            bins: ["Could be", "Probably not"],
            items: [
              { text: "A parent, aunt, uncle or older cousin", bin: 0 },
              { text: "A teacher or school counsellor", bin: 0 },
              { text: "A stranger online who says they can help", bin: 1 },
              { text: "A coach or imam or youth leader you know well", bin: 0 },
              { text: "The bully's friend", bin: 1 },
            ],
            why: "A trusted adult is someone you know in real life who listens and acts. Pick two, in case one isn't around.",
          },
          {
            kind: "write",
            prompt: "Write a short message to a trusted adult telling them something is wrong. Ward can help you send one like it later.",
            goal: "Says what is happening, roughly how long, how it makes them feel, and asks for help. Short and honest.",
            example: "Can we talk tonight? Some people in my class group keep saying mean things about me and it's been going on for a week. I feel really bad about it and I don't know what to do.",
          },
        ],
      },
      {
        id: "say-2",
        title: "When they don't get it",
        line: "What to do if the first adult brushes it off.",
        ages: [...OLDER],
        exercises: [
          {
            kind: "choose",
            prompt: "You told a teacher and they said \"just ignore it\". It's still happening. What now?",
            options: [
              { text: "Stop telling people, it's pointless", why: "One adult not getting it doesn't mean nobody will. Keep going." },
              { text: "Tell another trusted adult and show them your saved evidence", right: true, why: "Yes. A clear report with dates is hard to brush off." },
              { text: "Handle it yourself by getting back at them", why: "That usually makes it bigger and can get you in trouble." },
            ],
          },
          {
            kind: "write",
            prompt: "Write what you'd say the second time, so it's taken seriously.",
            goal: "Says it is still happening, that it has been going on for a while, mentions evidence, and clearly asks for action.",
            example: "I told you about this last week and it's still happening. I've saved the messages, they're from the last 10 days. I need help making it stop.",
          },
        ],
      },
    ],
  },
  {
    id: "upstand",
    title: "Back them up",
    about: "What to do when it's happening to someone else.",
    icon: "users",
    lessons: [
      {
        id: "upstand-1",
        title: "Be the first one",
        line: "One person speaking up changes the whole chat.",
        ages: [...ALL],
        exercises: [
          {
            kind: "choose",
            prompt: "In your group, people are piling on Bilal. You don't want to be next. What's a safe way to help?",
            options: [
              { text: "Message Bilal privately: \"that wasn't ok, you alright?\"", right: true, why: "Yes. A private message is safe for you and means a lot to him. You can do more if you feel able." },
              { text: "Say nothing, it's not your business", why: "Silence can feel like agreement to the person being bullied." },
              { text: "Join in a little so they leave you alone", why: "That makes the pile-on bigger, and it doesn't really protect you." },
            ],
          },
          {
            kind: "spot",
            prompt: "Which message is someone being an upstander?",
            chat: [
              { from: "Usman", text: "ayesha ki shakal dekhi 😂" },
              { from: "Hamza", text: "rone wali aa gayi" },
              { from: "Zara", text: "guys stop, ye theek nahi hai", flag: true },
              { from: "Usman", text: "relax zara" },
            ],
            why: "Zara said \"stop, this isn't okay\". It's short, calm and doesn't attack anyone back. That's all it takes.",
          },
          {
            kind: "write",
            prompt: "Write a short, calm message you could send in a group chat to stop a pile-on.",
            goal: "Calm, short, doesn't insult the bullies, makes clear it isn't okay. Optional: changes the subject or checks on the person.",
            example: "ok that's enough guys, not funny anymore",
          },
        ],
      },
    ],
  },
  {
    id: "lock",
    title: "Lock it down",
    about: "Keep your photos, passwords and location yours.",
    icon: "lock",
    lessons: [
      {
        id: "lock-1",
        title: "What's safe to share",
        line: "Location, school, passwords, photos.",
        ages: [...ALL],
        exercises: [
          {
            kind: "sort",
            prompt: "Okay to share with online friends, or keep private?",
            bins: ["Okay to share", "Keep private"],
            items: [
              { text: "Your favourite game", bin: 0 },
              { text: "Your password, even with your best friend", bin: 1 },
              { text: "Your home address", bin: 1 },
              { text: "A drawing you made", bin: 0 },
              { text: "Your live location", bin: 1 },
              { text: "Your school's name and your class", bin: 1 },
            ],
            why: "Anything that helps someone find you, or get into your accounts, stays private. Friendships change, and passwords should never be part of one.",
          },
          {
            kind: "truefalse",
            statement: "A message on Snapchat that disappears can't be saved by anyone.",
            answer: false,
            why: "Anyone can screenshot it, or film the screen with another phone. Only send what you'd be okay with everyone seeing.",
          },
        ],
      },
      {
        id: "lock-2",
        title: "If someone asks for photos",
        line: "Pressure, threats, and why it's never your fault.",
        ages: ["14"],
        exercises: [
          {
            kind: "truefalse",
            statement: "If someone threatens to share a private photo unless you pay or send more, paying makes it stop.",
            answer: false,
            why: "Paying or sending more almost always leads to more demands. Stop replying, don't pay, keep the evidence, and tell a trusted adult right away.",
          },
          {
            kind: "choose",
            prompt: "Someone you met online says \"send a pic or I'll tell everyone you're a liar\". What do you do?",
            options: [
              { text: "Send one so they stop", why: "This is how sextortion starts. It won't stop, and it gets worse." },
              { text: "Stop replying, save the chat, block, and tell an adult", right: true, why: "Yes. You haven't done anything wrong. Adults and the apps can deal with this person." },
              { text: "Argue until they give up", why: "They're trying to keep you talking. The less you say, the better." },
            ],
          },
          {
            kind: "truefalse",
            statement: "If a private photo of you is shared, you can ask to have it taken down even if you sent it yourself.",
            answer: true,
            why: "Yes. Services like Take It Down (takeitdown.ncmec.org) help remove images of under-18s, and the apps must remove them. It's not your fault.",
          },
        ],
      },
    ],
  },
  {
    id: "bounce",
    title: "Bounce back",
    about: "Look after yourself when it gets heavy.",
    icon: "heart",
    lessons: [
      {
        id: "bounce-1",
        title: "It's not about you",
        line: "Why bullies pick on people, and why it isn't your fault.",
        ages: [...ALL],
        exercises: [
          {
            kind: "truefalse",
            statement: "People get bullied because something is wrong with them.",
            answer: false,
            why: "Bullies pick on people to feel powerful or to fit in. It says something about them, not about you.",
          },
          {
            kind: "sort",
            prompt: "Which thoughts help, and which make it heavier?",
            bins: ["Helps", "Heavier"],
            items: [
              { text: "\"This is happening to me, it isn't who I am.\"", bin: 0 },
              { text: "\"Everyone must think the same as them.\"", bin: 1 },
              { text: "\"I've got people who like me.\"", bin: 0 },
              { text: "\"I deserve it.\"", bin: 1 },
              { text: "\"I can take a break from my phone.\"", bin: 0 },
            ],
            why: "Bullies try to get inside your head. Helpful thoughts keep the problem outside you, where it belongs.",
          },
          {
            kind: "write",
            prompt: "Write one kind thing you'd say to a friend going through this. Then read it to yourself.",
            goal: "Kind, specific, reminds them it isn't their fault or that they aren't alone.",
            example: "You didn't do anything to deserve this. They're being cruel, and I'm on your side.",
          },
        ],
      },
      {
        id: "bounce-2",
        title: "Night mode",
        line: "Sleep, muting, and taking a break.",
        ages: [...ALL],
        exercises: [
          {
            kind: "choose",
            prompt: "The worst messages always come late at night. What helps most?",
            options: [
              { text: "Keep the phone close in case something happens", why: "Then every buzz keeps you awake, and things feel worse at 2am." },
              { text: "Mute the chat at night and charge your phone outside your room", right: true, why: "Yes. Messages will still be there in the morning, when you're stronger and adults are awake." },
              { text: "Stay up and reply so they know you're not scared", why: "Replying keeps the fight going, and losing sleep makes everything harder." },
            ],
          },
          {
            kind: "truefalse",
            statement: "Taking a break from a group chat means the bullies won.",
            answer: false,
            why: "Stepping away is choosing yourself. You can come back when you want to, or not at all.",
          },
        ],
      },
    ],
  },
];
