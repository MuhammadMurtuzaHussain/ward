import type { Story } from "./types.ts";

// The reader is always "you", never named and never given a gender. Each story has at least one
// kind ending, and every hard ending points back to something that still helps.

export const STORIES: Story[] = [
  {
    id: "mias-drawing",
    unit: "upstand",
    title: "Mia's drawing",
    line: "The class chat thinks it's funny. Mia's in the chat too.",
    ages: ["8"],
    place: "Class 4 fun 🎉",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "Mia drew a cat for the art wall. Someone took a photo of it." },
          { from: "Rohan", text: "lol look at Mia's cat 😂 it looks like a potato" },
          { from: "Hamza", text: "potato cat 🥔🐱🥔🐱" },
          { from: "Kabir", text: "😂😂" },
          { text: "Mia is in the group. She hasn't said anything." },
        ],
        choices: [
          { text: "Send a 😂 too. Everyone else is.", next: "laugh" },
          { text: "Say nothing and put the phone down.", next: "quiet" },
          { text: "Write: \"I like it. Cats can be round 🐱\"", next: "speak" },
        ],
      },
      laugh: {
        lines: [
          { me: true, text: "😂" },
          { from: "Rohan", text: "even you think so lol" },
          { from: "Hamza", text: "potato cat for president 🥔" },
          { text: "Mia left the group." },
        ],
        choices: [
          { text: "Message Mia on her own", next: "sorry" },
          { text: "Leave it. It was only an emoji.", next: "endLeft" },
        ],
      },
      quiet: {
        lines: [
          { text: "You put the phone face down. When you look again, there are 14 more messages about the potato cat." },
          { text: "Mia still hasn't said anything." },
        ],
        choices: [
          { text: "Message Mia on her own", next: "private" },
          { text: "Show a grown-up", next: "adult" },
        ],
      },
      speak: {
        lines: [
          { me: true, text: "I like it. Cats can be round 🐱" },
          { from: "Zara", text: "same, it's cute" },
          { from: "Rohan", text: "ok ok it was just a joke" },
          { from: "Mia", text: "thanks 😊" },
          { text: "The jokes stop. It took one message, and then Zara joined in." },
        ],
        end: {
          tone: "kind",
          title: "One message turned it around",
          body: "Most people in a group chat don't like the jokes either. They're waiting for someone to go first. You went first, kindly, without being mean back.",
        },
      },
      private: {
        lines: [
          { me: true, text: "I liked your cat drawing. Rohan's jokes weren't funny." },
          { from: "Mia", text: "thanks. I almost took it off the wall" },
          { from: "Mia", text: "I won't take it off now 🙂" },
        ],
        end: {
          tone: "kind",
          title: "A quiet kind of brave",
          body: "You didn't have to say it in front of everyone. One private message told Mia she wasn't on her own. If the jokes keep coming, showing a grown-up is a good next step too.",
        },
      },
      adult: {
        lines: [
          { text: "You show the messages to Ms Farah after class." },
          { from: "Ms Farah", text: "Thank you for showing me. I'll talk to the class about kind messages, and I won't say who told me." },
          { text: "The next day, the potato cat jokes have stopped. Mia's drawing is still on the wall." },
        ],
        end: {
          tone: "kind",
          title: "Telling isn't snitching",
          body: "Snitching is getting someone in trouble for fun. Telling is getting help when someone is being hurt. You helped.",
        },
      },
      sorry: {
        lines: [
          { me: true, text: "sorry I laughed. your cat is good" },
          { from: "Mia", text: "it's ok. it was a bit mean though" },
          { me: true, text: "yeah. it was." },
        ],
        end: {
          tone: "mixed",
          title: "It's never too late to fix it",
          body: "Laughing along made the joke bigger, and Mia noticed. Saying sorry, and meaning it, helped. Next time you could be the one who says \"I like it\" in the group.",
        },
      },
      endLeft: {
        lines: [{ text: "The group moves on to talking about football. Mia doesn't come back to the chat." }],
        end: {
          tone: "hard",
          title: "Mia left the group",
          body: "One emoji feels small, but every 😂 told Mia that everyone agreed. That's how a joke turns into bullying. You can still help: a private \"sorry I laughed\" means a lot, even days later.",
        },
      },
    },
  },

  {
    id: "secret-fan",
    unit: "stop",
    title: "The secret fan",
    line: "An account you don't know starts messaging you.",
    ages: ["11"],
    place: "ur_secret_fan_09",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "A new account follows you. It has no photo and no posts. Then a message arrives." },
          { from: "ur_secret_fan_09", text: "everyone in 7B laughs at you behind ur back" },
          { from: "ur_secret_fan_09", text: "even ur friends. ask them lol" },
        ],
        choices: [
          { text: "Reply: \"who are you?? leave me alone\"", next: "reply" },
          { text: "Screenshot it, then block and report", next: "save" },
          { text: "Keep reading. Maybe they'll say more.", next: "read" },
        ],
      },
      reply: {
        lines: [
          { me: true, text: "who are you?? leave me alone" },
          { from: "ur_secret_fan_09", text: "aww did i upset u 😂" },
          { from: "ur_secret_fan_09", text: "wouldn't u like to know" },
          { text: "They're enjoying this. Your heart is beating fast." },
        ],
        choices: [
          { text: "Reply again, angrier", next: "endFight" },
          { text: "Stop. Screenshot, block, report.", next: "save" },
        ],
      },
      read: {
        lines: [
          { from: "ur_secret_fan_09", text: "ur so annoying in class" },
          { from: "ur_secret_fan_09", text: "nobody wanted u on the trip" },
          { text: "It's late. You've read the messages five times. They feel worse each time." },
        ],
        choices: [
          { text: "Screenshot, block, report", next: "save" },
          { text: "Ask Zara if it's true", next: "zara" },
        ],
      },
      save: {
        lines: [
          { text: "You take screenshots that show the account name and the times. Then you tap Block, and Report: \"Bullying or harassment\"." },
          { text: "The messages are gone from your screen. The proof isn't." },
        ],
        choices: [
          { text: "Tell Zara what happened", next: "zara" },
          { text: "Show Ammi the screenshots", next: "ammi" },
        ],
      },
      zara: {
        lines: [
          { me: true, text: "some account is messaging me saying everyone laughs at me. is that true?" },
          { from: "Zara", text: "WHAT. no!! that's so creepy" },
          { from: "Zara", text: "nobody laughs at you. I think they messaged Mia too" },
          { from: "Zara", text: "you should tell someone. I'll come with you" },
        ],
        choices: [
          { text: "Show Ammi, with Zara there", next: "ammi" },
          { text: "Just block them and forget it", next: "endBlock" },
        ],
      },
      ammi: {
        lines: [
          { text: "Ammi looks at the screenshots for a long time." },
          { from: "Ammi", text: "I'm glad you showed me. You didn't do anything wrong. Tomorrow we'll show your class teacher. If it's the same account messaging other children, the school needs to know." },
        ],
        end: {
          tone: "kind",
          title: "Shut down, saved, and told",
          body: "You didn't feed it, you kept the proof, you closed the door, and you told someone who could act. That's the whole playbook. Accounts like this usually pick on more than one person, so telling helps them too.",
        },
      },
      endBlock: {
        lines: [{ text: "You block the account. A week later, a new one appears: ur_secret_fan_10." }],
        end: {
          tone: "mixed",
          title: "Blocking helped, for a while",
          body: "Blocking was right, and saving the screenshots first was smart. But people behind fake accounts often make another one. That's when an adult or the school can help, and you already have the proof ready.",
        },
      },
      endFight: {
        lines: [
          { me: true, text: "ur the pathetic one hiding behind a fake account" },
          { from: "ur_secret_fan_09", text: "screenshotted 😂 everyone's gonna see how u talk" },
        ],
        end: {
          tone: "hard",
          title: "They got what they wanted",
          body: "Getting a reaction is the whole point for them, and now they have something of yours to show around. It's not your fault you got angry. It's still not too late: screenshot everything, block, report, and show an adult. Your screenshots show they started it.",
        },
      },
    },
  },

  {
    id: "the-screenshot",
    unit: "lock",
    title: "The screenshot",
    line: "Zara posted something private. Now it's everywhere.",
    ages: ["14"],
    place: "Hamza",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "Zara posted on her close-friends story that she likes someone in your year. Hamza was on her close friends list. He took a screenshot." },
          { from: "Hamza", text: "😂😂 look what zara posted" },
          { from: "Hamza", text: "[screenshot]" },
          { from: "Hamza", text: "send it to the year group, they'll lose it" },
        ],
        choices: [
          { text: "Forward it. It's just a crush, not a big deal.", next: "forward" },
          { text: "Ignore him and don't open it again", next: "ignore" },
          { text: "Tell Hamza no", next: "no" },
        ],
      },
      forward: {
        lines: [
          { text: "Within an hour the screenshot is in three group chats. Someone has drawn hearts on it. Zara's name is the joke of the evening." },
          { from: "Zara", text: "did you send my story to people??" },
        ],
        choices: [
          { text: "Say sorry and help her fix it", next: "fix" },
          { text: "\"Everyone had it already\"", next: "endSpread" },
        ],
      },
      ignore: {
        lines: [
          { text: "You leave it on read. Later, you see the screenshot in your class group anyway. Someone else forwarded it." },
          { text: "Zara has gone quiet in every chat." },
        ],
        choices: [
          { text: "Message Zara", next: "tellZara" },
          { text: "It's not your business", next: "endIgnore" },
        ],
      },
      no: {
        lines: [
          { me: true, text: "nah. that was her close friends, delete it" },
          { from: "Hamza", text: "relax it's a joke" },
          { me: true, text: "it's not your story to share. delete it" },
          { from: "Hamza", text: "fine. whatever" },
        ],
        choices: [
          { text: "Tell Zara he screenshotted it", next: "tellZara" },
          { text: "Leave it there. He said fine.", next: "endNo" },
        ],
      },
      tellZara: {
        lines: [
          { me: true, text: "hey, heads up. hamza screenshotted your close friends story and it's going round. I didn't send it. I'm sorry" },
          { from: "Zara", text: "oh no. I want to disappear" },
          { from: "Zara", text: "please don't tell any adults, it'll make it worse" },
        ],
        choices: [
          { text: "Help her report it and take it down", next: "report" },
          { text: "Promise not to tell anyone", next: "promise" },
        ],
      },
      fix: {
        lines: [
          { me: true, text: "I did. I'm really sorry, it was a stupid thing to do. I'll delete it and ask the groups to delete it too" },
          { from: "Zara", text: "ok. thanks for saying it at least" },
          { text: "You post in each group: \"delete that screenshot, it was private\". Two people do. You report the rest." },
        ],
        end: {
          tone: "mixed",
          title: "You owned it",
          body: "Forwarding made it spread fast, and that can't be fully undone. Owning it, saying sorry without a \"but\", and cleaning up what you could made a real difference. Next time the screenshot stops with you.",
        },
      },
      report: {
        lines: [
          { text: "You both report the screenshot in each app as \"sharing private information\". Zara removes Hamza from close friends." },
          { from: "Zara", text: "if it doesn't stop, will you come with me to Ms Farah?" },
          { me: true, text: "yeah, of course" },
        ],
        end: {
          tone: "kind",
          title: "On her side, and smart about it",
          body: "You told Zara the truth, helped her get it taken down, and stayed ready to bring in an adult. Telling an adult isn't breaking a promise when something is spreading out of control. It's how it stops.",
        },
      },
      promise: {
        lines: [
          { text: "You promise. Over the weekend, the screenshot turns into memes. Someone posts Zara's username with it." },
        ],
        choices: [
          { text: "Tell Zara you think an adult needs to know", next: "report" },
          { text: "Keep the promise", next: "endPromise" },
        ],
      },
      endSpread: {
        lines: [{ from: "Zara", text: "wow. ok." }],
        end: {
          tone: "hard",
          title: "It spread, and you were part of it",
          body: "\"Everyone had it already\" is what everyone tells themselves, and it's how private things go everywhere. It's not too late: say sorry properly, ask the groups to delete it, and report the copies.",
        },
      },
      endIgnore: {
        lines: [{ text: "By Monday, everyone has seen it. Zara doesn't come to school." }],
        end: {
          tone: "hard",
          title: "Staying out of it left her alone",
          body: "Not forwarding it was right. But silence can feel like agreement to the person it's about. A two-line message to Zara, or reporting the copies, would still help.",
        },
      },
      endNo: {
        lines: [{ text: "Hamza doesn't delete it. He sends it to someone else instead." }],
        end: {
          tone: "mixed",
          title: "A good \"no\", then a gap",
          body: "Saying no to Hamza took guts, and you didn't spread it. But Zara didn't know it was out there, so she couldn't protect herself. Telling her, and reporting it, closes the gap.",
        },
      },
      endPromise: {
        lines: [{ text: "The memes keep going for weeks." }],
        end: {
          tone: "hard",
          title: "Some promises are too heavy",
          body: "Keeping a friend's secret matters. But when something is spreading or someone is getting hurt, getting help isn't a betrayal. You can still go back to Zara and say: \"I'm worried. Let's tell someone together.\"",
        },
      },
    },
  },
];
