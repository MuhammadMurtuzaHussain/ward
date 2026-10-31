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
  // Ages 8 to 10: Class 4, with Mia, Kabir, Rohan, Hamza, Dev, Usman, Sana, Hira, Leo and Ms Farah.

  {
    id: "snail",
    unit: "spot",
    title: "Snail",
    line: "It was funny on Monday. It's Thursday now.",
    ages: ["8"],
    place: "Class 4 fun 🎉",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "On Monday it was sports day. Kabir's shoe flew off in the race and he came last." },
          { from: "Dev", text: "kabir ran like a snail 🐌" },
          { from: "Kabir", text: "haha my shoe fell off 😂" },
          { from: "Rohan", text: "snail kabir 🐌🐌" },
          { text: "That was Monday. It's Thursday now." },
          { from: "Dev", text: "morning snail 🐌" },
          { from: "Hamza", text: "snail is typing... very slowly 🐌" },
          { from: "Kabir", text: "ok" },
          { from: "Rohan", text: "snail can't come to my party, it'll take him a year to get there 😂" },
          { text: "Kabir hasn't sent anything else. On Monday he was laughing." },
        ],
        choices: [
          { text: "Send a 🐌. Kabir laughed on Monday, so it's fine.", next: "join" },
          { text: "Message Kabir on his own: \"do you mind the snail thing?\"", next: "ask" },
          { text: "Write in the group: \"the snail joke is getting old\"", next: "group" },
        ],
      },
      join: {
        lines: [
          { me: true, text: "🐌" },
          { from: "Dev", text: "🐌🐌🐌 snail army" },
          { text: "Kabir changes his name in the group to just \"K\". Then he goes offline." },
        ],
        choices: [
          { text: "Ask Kabir if he's ok", next: "askLate" },
          { text: "It's only a nickname. Everyone has one.", next: "endJoin" },
        ],
      },
      ask: {
        lines: [
          { me: true, text: "hey, do you mind the snail thing? you can tell me" },
          { from: "Kabir", text: "a bit" },
          { from: "Kabir", text: "it was funny on monday. now it's every day" },
        ],
        choices: [
          { text: "Stop using it, and send him something nice", next: "endPrivate" },
          { text: "Change the subject in the group", next: "subject" },
        ],
      },
      group: {
        lines: [
          { me: true, text: "the snail joke is getting old" },
          { from: "Rohan", text: "it's just a joke" },
        ],
        choices: [
          { text: "Add: \"Kabir stopped laughing ages ago\"", next: "groupStop" },
          { text: "Send \"jk 😅\" so nobody's cross", next: "endJk" },
        ],
      },
      groupStop: {
        lines: [
          { me: true, text: "Kabir stopped laughing ages ago" },
          { from: "Dev", text: "oh. sorry kabir, didn't mean it like that" },
          { from: "Kabir", text: "it's ok 👍" },
          { from: "Hira", text: "kabir was winning before the shoe anyway" },
        ],
        end: {
          tone: "kind",
          title: "You noticed when the joke changed",
          body: "On Monday everyone was laughing, Kabir too. By Thursday only one person wasn't. Spotting that change is the hard part, and you said it simply, without being mean back.",
        },
      },
      subject: {
        lines: [
          { me: true, text: "new topic. who's watching the cartoon film on saturday? 🍿" },
          { from: "Hira", text: "meee" },
          { from: "Dev", text: "me!! 🍿" },
          { text: "Nobody says \"snail\" again that night." },
        ],
        end: {
          tone: "kind",
          title: "A clever change of subject",
          body: "You didn't need a big speech. Asking Kabir told you the joke had turned, and moving the chat on gave everyone a way out. If the snail comes back tomorrow, you can say it plainly, or tell Ms Farah.",
        },
      },
      endPrivate: {
        lines: [
          { me: true, text: "ok I won't say it any more. you were winning before the shoe 👟" },
          { from: "Kabir", text: "haha I WAS" },
          { from: "Kabir", text: "thanks" },
        ],
        end: {
          tone: "kind",
          title: "You asked instead of guessing",
          body: "The only way to know if a joke is still a joke is to ask the person it's about. Kabir got to say how he felt, and you stopped. If the others keep going, a grown-up like Ms Farah can help without making a fuss.",
        },
      },
      askLate: {
        lines: [
          { me: true, text: "hey are you ok? sorry for the snail" },
          { from: "Kabir", text: "it's fine. it was funny at first" },
        ],
        end: {
          tone: "mixed",
          title: "Joke or jab? Ask.",
          body: "On Monday the snail was a joke. By Thursday it was landing on one person, and your 🐌 added to it. Saying sorry fixed some of it. Next time someone goes quiet, check with them before you join in.",
        },
      },
      endJoin: {
        lines: [{ text: "On Friday, someone has drawn a snail on Kabir's desk. He sits on his own at lunch." }],
        end: {
          tone: "hard",
          title: "A nickname that stuck",
          body: "A joke that everyone laughed at once can turn into something that follows a person around. The sign was there: Kabir stopped laughing. It's not too late to message him, or to stop using the name yourself.",
        },
      },
      endJk: {
        lines: [
          { me: true, text: "jk 😅" },
          { from: "Dev", text: "🐌" },
        ],
        end: {
          tone: "mixed",
          title: "Almost",
          body: "Saying it was brave, and taking it back when someone pushes is very normal. Next time, keep it short and stick with it: \"Kabir's not laughing any more.\" Or check on Kabir privately.",
        },
      },
    },
  },

  {
    id: "the-treehouse",
    unit: "stop",
    title: "The treehouse",
    line: "You built it all afternoon. Someone just blew it up.",
    ages: ["8"],
    place: "Blocktown 🌳",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "You've spent all afternoon building a treehouse in Blocktown with Leo. It has a slide and a secret door." },
          { from: "SkullKing99", text: "lol nice treehouse noob" },
          { from: "SkullKing99", text: "*BOOM* 💥" },
          { text: "The treehouse is gone. SkullKing99 blew it up." },
          { from: "SkullKing99", text: "cry about it 😂" },
        ],
        choices: [
          { text: "Type: \"YOU'RE the noob!!\"", next: "reply" },
          { text: "Leave the game", next: "leave" },
          { text: "Block and report SkullKing99", next: "block" },
        ],
      },
      reply: {
        lines: [
          { me: true, text: "YOU'RE the noob!! build it back now" },
          { from: "SkullKing99", text: "make me 😂" },
          { from: "SkullKing99", text: "*BOOM* 💥" },
          { text: "Now Leo's house is gone too." },
          { from: "Leo", text: "nooo my house 😭" },
        ],
        choices: [
          { text: "Keep typing back", next: "endFight" },
          { text: "Stop. Block and report.", next: "block" },
        ],
      },
      leave: {
        lines: [
          { text: "You leave the game. The next day, you join again. SkullKing99 is there." },
          { from: "SkullKing99", text: "the noob came back 😂" },
        ],
        choices: [
          { text: "Block and report this time", next: "block" },
          { text: "Log out and stop playing Blocktown", next: "endQuit" },
        ],
      },
      block: {
        lines: [
          { text: "You tap SkullKing99's name. Block. Then Report, and pick \"Being mean or breaking things\"." },
          { from: "Leo", text: "did you block him? I did too" },
          { text: "SkullKing99's messages disappear. Now SkullKing99 can't join your games." },
        ],
        choices: [
          { text: "Tell Abbu what happened", next: "abbu" },
          { text: "Build the treehouse again with Leo", next: "endBuild" },
        ],
      },
      abbu: {
        lines: [
          { me: true, text: "Abbu, someone blew up my treehouse in Blocktown and said I should cry. I blocked them" },
          { from: "Abbu", text: "Blocking was exactly right. Thank you for telling me." },
          { from: "Abbu", text: "Want me to help you make your games friends-only? Then only Leo and your real friends can join." },
          { me: true, text: "yes please" },
        ],
        end: {
          tone: "kind",
          title: "Shut it down, then tell",
          body: "SkullKing99 wanted an angry reply, and you didn't give one. You blocked, reported, and told a grown-up who could make the game safer. That's the whole thing.",
        },
      },
      endBuild: {
        lines: [
          { text: "You and Leo build an even bigger treehouse, with two slides. SkullKing99 can't see it." },
          { from: "Leo", text: "this one's better anyway 🌳" },
        ],
        end: {
          tone: "kind",
          title: "Blocked, and back to building",
          body: "Blocking took away SkullKing99's way in. Reporting helps the game stop them doing it to other children. If it happens again, telling a grown-up is a great next step.",
        },
      },
      endFight: {
        lines: [
          { me: true, text: "I HATE you. you ruin everything" },
          { from: "SkullKing99", text: "😂😂 so mad" },
          { from: "SkullKing99", text: "*BOOM* 💥" },
        ],
        end: {
          tone: "hard",
          title: "SkullKing99 loved every message",
          body: "People who break things in games want a reaction. Every angry message is a prize for them. Being angry is normal. The fastest way to win is to give them nothing: block, report, and tell a grown-up.",
        },
      },
      endQuit: {
        lines: [{ text: "You stop playing Blocktown. Leo plays on his own now." }],
        end: {
          tone: "mixed",
          title: "Safe, but you lost your game",
          body: "Leaving kept you away from SkullKing99, and that's ok. But you shouldn't have to give up something you love. Block and report take away their way in, so you can keep playing.",
        },
      },
    },
  },

  {
    id: "now-you-see-it",
    unit: "save",
    title: "Now you see it",
    line: "Usman's messages vanish before anyone else can see them.",
    ages: ["8"],
    place: "Usman",
    start: "start",
    scenes: {
      start: {
        lines: [
          { from: "Usman", text: "your drawing in art was sooo bad 😂" },
          { text: "A minute later:" },
          { from: "Usman", text: "🚫 This message was deleted" },
          { from: "Usman", text: "your bag smells like old eggs 🥚" },
          { from: "Usman", text: "🚫 This message was deleted" },
          { from: "Usman", text: "what? I didn't say anything 😇" },
        ],
        choices: [
          { text: "Next time, take a screenshot fast", next: "ready" },
          { text: "Delete the whole chat so you don't have to see it", next: "deleteChat" },
          { text: "Tell Ammi now, even without proof", next: "tellNoProof" },
        ],
      },
      ready: {
        lines: [
          { text: "You keep the chat open. Your thumb is ready." },
          { from: "Usman", text: "nobody wants to sit next to you tomorrow 🙄" },
          { text: "Snap! You take a screenshot. It shows Usman's name and the time: 7:42 pm." },
          { from: "Usman", text: "🚫 This message was deleted" },
        ],
        choices: [
          { text: "Show Ammi the screenshot", next: "ammi" },
          { text: "Send it to Usman: \"I saw it\"", next: "confront" },
        ],
      },
      confront: {
        lines: [
          { me: true, text: "[screenshot] I saw it" },
          { from: "Usman", text: "that's fake lol. you made it up" },
        ],
        choices: [
          { text: "Show Ammi instead", next: "ammi" },
          { text: "Argue until Usman admits it", next: "endArgue" },
        ],
      },
      ammi: {
        lines: [
          { from: "Ammi", text: "Good thinking. This shows who sent it and when." },
          { from: "Ammi", text: "Let's keep it safe in Ward's vault, and show Ms Farah tomorrow." },
          { text: "The next day, Ms Farah talks to Usman. The messages stop." },
        ],
        end: {
          tone: "kind",
          title: "Proof that sticks",
          body: "Messages that vanish are made to leave no trace. A quick screenshot with the name and time catches them. Then a grown-up can act, and nobody can say you made it up.",
        },
      },
      deleteChat: {
        lines: [
          { text: "You delete the whole chat. It feels better for a minute." },
          { text: "At school, Usman whispers \"egg bag\" and two people giggle. You tell Ms Farah what happened." },
          { from: "Ms Farah", text: "I'm sorry, that sounds horrible. Do you have any of the messages?" },
        ],
        choices: [
          { text: "Save the next ones, starting now", next: "fresh" },
          { text: "Give up. Nobody can prove it.", next: "endGiveUp" },
        ],
      },
      fresh: {
        lines: [
          { text: "The next time Usman sends something, you screenshot it before it vanishes. Then the next one. By Friday you have four." },
          { from: "Ms Farah", text: "Thank you. These show his name and the time. That's exactly what I need." },
        ],
        end: {
          tone: "kind",
          title: "Late, but not too late",
          body: "Deleting the chat made sense, because who wants to see that? But proof helps grown-ups act. You started saving and kept going, and now Ms Farah can do something.",
        },
      },
      tellNoProof: {
        lines: [
          { me: true, text: "Ammi, Usman keeps sending mean things and then deleting them" },
          { from: "Ammi", text: "I believe you. That isn't ok." },
          { from: "Ammi", text: "Next time, take a screenshot quickly, before it disappears. Then we have something to show Ms Farah." },
        ],
        end: {
          tone: "kind",
          title: "Believed, and ready for next time",
          body: "You don't need proof to tell someone you trust. Ammi believed you. Screenshots just make it easier for the school to act, so next time grab one before it vanishes. Ward's vault can keep them locked away.",
        },
      },
      endArgue: {
        lines: [
          { me: true, text: "it's REAL. I saw it!!" },
          { from: "Usman", text: "lol prove it" },
          { text: "You go round and round until bedtime." },
        ],
        end: {
          tone: "mixed",
          title: "The proof was yours. The argument wasn't.",
          body: "Taking the screenshot was the smart part. Sending it to Usman just started the fight he wanted. Proof is for grown-ups who can act, like Ammi or Ms Farah.",
        },
      },
      endGiveUp: {
        lines: [{ text: "The egg jokes keep going all week." }],
        end: {
          tone: "hard",
          title: "It isn't hopeless",
          body: "Without the messages it's harder, but not impossible. Ms Farah still wanted to help. Save anything new with a screenshot that shows the name and time, and go back to her.",
        },
      },
    },
  },

  {
    id: "the-tablet-worry",
    unit: "say",
    title: "The tablet worry",
    line: "Telling might mean losing the tablet. Or it might not.",
    ages: ["8"],
    place: "Class 4 fun 🎉",
    start: "start",
    scenes: {
      start: {
        lines: [
          { from: "Hamza", text: "crybaby is online 😭😭" },
          { from: "Rohan", text: "😭" },
          { from: "Hamza", text: "go tell your mummy, crybaby" },
          { text: "It started after you cried at the school play. This is the fourth day in a row." },
          { text: "You want to tell Ammi. But what if the tablet goes in the drawer?" },
        ],
        choices: [
          { text: "Tell Ammi tonight", next: "ammi" },
          { text: "Tell Khala instead. Khala is less strict.", next: "khala" },
          { text: "Don't tell. You might lose the tablet.", next: "secret" },
        ],
      },
      secret: {
        lines: [
          { text: "You keep it to yourself. The messages keep coming." },
          { text: "On Sunday night your tummy hurts so much that you don't want to go to school." },
        ],
        choices: [
          { text: "Tell someone after all", next: "pick" },
          { text: "Keep holding it in", next: "endSecret" },
        ],
      },
      pick: {
        lines: [{ text: "Who's the best person to tell?" }],
        choices: [
          { text: "Ammi", next: "ammi" },
          { text: "Ms Farah", next: "farah" },
        ],
      },
      ammi: {
        lines: [
          { me: true, text: "Ammi, can I show you something? please don't be cross" },
          { from: "Ammi", text: "Of course, jaan. Show me." },
          { text: "You show Ammi the messages." },
          { from: "Ammi", text: "Thank you for telling me. You're not in trouble, and you're not losing the tablet." },
          { from: "Ammi", text: "Let's mute that group tonight. Tomorrow we'll talk to Ms Farah together." },
        ],
        end: {
          tone: "kind",
          title: "Telling made it lighter",
          body: "Lots of children don't tell because they're scared of losing their tablet or phone. Most grown-ups are just glad you told them. Now you're not carrying it on your own.",
        },
      },
      farah: {
        lines: [
          { me: true, text: "Ms Farah, people in the class chat keep calling me crybaby" },
          { from: "Ms Farah", text: "I'm really glad you came to me. Can you show me?" },
          { from: "Ms Farah", text: "This isn't ok, and it isn't your fault. I'll talk to the class. I'd like to tell Ammi too, so you have help at home." },
        ],
        end: {
          tone: "kind",
          title: "Two grown-ups in your corner",
          body: "Ms Farah can help at school and Ammi can help at home. Telling one grown-up often brings in another, and that's a good thing. Calling someone \"crybaby\" every day is bullying, even if it's \"just a word\".",
        },
      },
      khala: {
        lines: [
          { me: true, text: "Khala, can I tell you something? don't tell Ammi" },
          { from: "Khala", text: "You can tell me anything." },
          { text: "You tell Khala about the crybaby messages." },
          { from: "Khala", text: "Oh, jaan. I'm so glad you told me. That isn't ok." },
          { from: "Khala", text: "I think Ammi needs to know. I won't do it behind your back. Shall we tell her together?" },
        ],
        choices: [
          { text: "Yes, together", next: "together" },
          { text: "Not yet", next: "endNotYet" },
        ],
      },
      together: {
        lines: [
          { text: "Khala holds your hand while you show Ammi." },
          { from: "Ammi", text: "You did the right thing. You're not in any trouble." },
          { from: "Ammi", text: "Let's mute that group, and talk to Ms Farah tomorrow." },
        ],
        end: {
          tone: "kind",
          title: "Your corner got bigger",
          body: "Khala didn't keep a secret that was hurting you, and didn't go behind your back either. Telling together made it easier. Now two grown-ups are helping.",
        },
      },
      endNotYet: {
        lines: [{ from: "Khala", text: "Ok. I'll ask how you're doing tomorrow. I'm here, any time." }],
        end: {
          tone: "mixed",
          title: "One grown-up knows",
          body: "Telling Khala was a real step, and now someone is looking out for you. Grown-ups can do more when home and school both know. Khala can help you tell Ammi when you're ready.",
        },
      },
      endSecret: {
        lines: [{ text: "At night you can't sleep. The tablet buzzes on the shelf." }],
        end: {
          tone: "hard",
          title: "Carrying it alone is heavy",
          body: "Lots of children keep it in because they're scared of losing their tablet. Most grown-ups are just glad to be told. Pick two grown-ups you trust, and tell one of them tomorrow. You can show them this story first if it helps.",
        },
      },
    },
  },

  {
    id: "best-friends-password",
    unit: "lock",
    title: "Best friends share everything?",
    line: "Sana wants your Blocktown password. Just for tonight.",
    ages: ["8"],
    place: "Sana 💛",
    start: "start",
    scenes: {
      start: {
        lines: [
          { from: "Sana", text: "omg give me your Blocktown password!!" },
          { from: "Sana", text: "I'll get you loads of coins while you're at dinner 🪙🪙" },
          { from: "Sana", text: "we're best friends, it's fine" },
        ],
        choices: [
          { text: "Send it. Sana is your best friend.", next: "send" },
          { text: "Say no, nicely", next: "no" },
          { text: "Ask Abbu first", next: "abbu" },
        ],
      },
      send: {
        lines: [
          { me: true, text: "ok 🔑 here it is" },
          { from: "Sana", text: "yay!! 🪙🪙🪙" },
          { text: "Two days later, you log in. Your treehouse is gone. Your name is \"SmellyFeet\". All your coins are spent." },
          { from: "Sana", text: "it wasn't me!! I gave Hira the password so she could help 😬 sorry" },
        ],
        choices: [
          { text: "Change the password with Abbu", next: "fixIt" },
          { text: "Tell Sana she's the worst", next: "endFight" },
        ],
      },
      no: {
        lines: [
          { me: true, text: "I can't. passwords are just for me and Abbu" },
          { from: "Sana", text: "you don't trust me?? 😢" },
        ],
        choices: [
          { text: "Explain it's not about trust", next: "explain" },
          { text: "Give in, so Sana isn't sad", next: "send" },
        ],
      },
      explain: {
        lines: [
          { me: true, text: "I DO trust you! passwords just stay private, even with best friends. play together after dinner?" },
          { from: "Sana", text: "ok fair. my mum says that too lol" },
          { from: "Sana", text: "after dinner then 🐯" },
        ],
        end: {
          tone: "kind",
          title: "Best friends, own passwords",
          body: "Friends change, tablets get borrowed, secrets slip. A password that only you and your grown-up know keeps your things yours. You said no and kept the friendship, both at once.",
        },
      },
      abbu: {
        lines: [
          { from: "Abbu", text: "Good thing you asked. Passwords stay between you and me, even with best friends." },
          { from: "Abbu", text: "Why not ask Sana to play with you after dinner instead?" },
          { me: true, text: "Abbu says passwords stay private. but play after dinner?" },
          { from: "Sana", text: "ok!! 🎮" },
        ],
        end: {
          tone: "kind",
          title: "Asking first was smart",
          body: "When you're not sure if something is safe to share, asking a grown-up is always a good move. Passwords, your address and where you are right now stay private. Playing with friends doesn't need any of them.",
        },
      },
      fixIt: {
        lines: [
          { text: "Abbu helps you make a new password. Now only you and Abbu know it." },
          { from: "Abbu", text: "Thanks for telling me straight away. The coins are gone, but your account is yours again." },
        ],
        end: {
          tone: "mixed",
          title: "Locked again",
          body: "Sharing a password with a best friend feels safe, but then it travels. You fixed it fast: a new password, and a grown-up who knows. The new one stays just yours.",
        },
      },
      endFight: {
        lines: [
          { me: true, text: "you're the WORST friend ever" },
          { from: "Sana", text: "fine. I'm not your friend then 😤" },
        ],
        end: {
          tone: "hard",
          title: "Lost coins, and a fight",
          body: "It hurts when someone breaks your things, and it's normal to be angry. But someone else still has your password. Change it with a grown-up today, and talk to Sana when you're both calm.",
        },
      },
    },
  },

  {
    id: "the-bedtime-buzz",
    unit: "bounce",
    title: "The bedtime buzz",
    line: "It's past bedtime. The tablet just lit up.",
    ages: ["8"],
    place: "Class 4 fun 🎉",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "It's past bedtime. You're under the blanket with the tablet, just checking one thing." },
          { from: "Rohan", text: "teams for football tomorrow 👇" },
          { from: "Rohan", text: "nobody wants you on theirs btw 😂" },
          { from: "Hamza", text: "true 😂" },
          { text: "Your eyes feel hot." },
        ],
        choices: [
          { text: "Keep scrolling, in case there's more", next: "scroll" },
          { text: "Type back: \"I don't care!!\"", next: "reply" },
          { text: "Put the tablet outside your room", next: "away" },
        ],
      },
      scroll: {
        lines: [
          { from: "Rohan", text: "😂😂" },
          { text: "You read it again. And again. Now it's half past ten." },
        ],
        choices: [
          { text: "Go and find Ammi", next: "ammi" },
          { text: "Keep reading", next: "endScroll" },
        ],
      },
      reply: {
        lines: [
          { me: true, text: "I don't care!!" },
          { from: "Rohan", text: "then why are you still awake 😂" },
          { text: "You do care. That's ok." },
        ],
        choices: [
          { text: "Put the tablet outside your room", next: "away" },
          { text: "Wait for Rohan's next message", next: "endWait" },
        ],
      },
      away: {
        lines: [
          { text: "You mute the group and put the tablet on the kitchen table. The house is quiet." },
          { text: "In bed, a little thought comes: \"maybe they're right.\"" },
        ],
        choices: [
          { text: "Think of three people who like you", next: "three" },
          { text: "Get up and tell Ammi", next: "ammi" },
        ],
      },
      three: {
        lines: [
          { text: "Nani, who calls you every Sunday. Leo, who saved you a seat on the bus. Ms Farah, who said your story was the best one." },
          { text: "Rohan's message is still there. But it feels smaller now." },
        ],
        end: {
          tone: "kind",
          title: "Smaller by morning",
          body: "Mean messages feel biggest at night. Muting, putting the tablet away and remembering who likes you gives you your sleep back. In the morning, tell a grown-up if it keeps happening.",
        },
      },
      ammi: {
        lines: [
          { text: "Ammi sits on the edge of the bed and reads the messages." },
          { from: "Ammi", text: "Mean words say more about the person who sends them. Not about you." },
          { from: "Ammi", text: "Let's leave the tablet in the kitchen tonight. Tomorrow we'll think about what to do, together." },
        ],
        end: {
          tone: "kind",
          title: "Not on your own",
          body: "Telling Ammi at bedtime was brave. Now a grown-up knows, the tablet is out of your room, and tomorrow there's a plan. It was never your fault.",
        },
      },
      endWait: {
        lines: [{ text: "Rohan doesn't reply. You wait and wait, and fall asleep holding the tablet." }],
        end: {
          tone: "mixed",
          title: "You said it, then you waited",
          body: "\"I don't care\" was a way of sticking up for yourself, and that's ok. But waiting for an answer kept you awake and let Rohan take over your night. Putting the tablet away gives your night back to you.",
        },
      },
      endScroll: {
        lines: [{ text: "You fall asleep at midnight with the tablet on your pillow. In the morning, you feel too tired for football." }],
        end: {
          tone: "hard",
          title: "The night made it heavier",
          body: "Reading mean messages over and over makes them feel truer than they are. It's not your fault. Tonight, try muting the group, leaving the tablet outside your room, and telling a grown-up in the morning.",
        },
      },
    },
  },

  // Ages 11 to 13: class 7B, with the same cast a few years on, plus Yusuf, Kai and Mr Okafor.

  {
    id: "saturday-plans",
    unit: "spot",
    title: "Saturday plans",
    line: "A new group for bowling. One name is missing.",
    ages: ["11"],
    place: "Saturday 🎳",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "Sana makes a new group: \"Saturday 🎳\". Almost all of 7B is in it. You scroll the names. Mia isn't." },
          { from: "Sana", text: "bowling sat 4pm!! who's in" },
          { from: "Hira", text: "meee 🎳" },
          { from: "Sana", text: "don't add mia btw. she's sooo clingy" },
          { from: "Hira", text: "lol true" },
          { from: "Sana", text: "and don't tell her 🤫" },
        ],
        choices: [
          { text: "Reply \"in!\" and ignore the Mia part", next: "in" },
          { text: "Ask: \"why not Mia?\"", next: "why" },
          { text: "Message Mia on her own", next: "tellMia" },
        ],
      },
      in: {
        lines: [
          { me: true, text: "in! 🎳" },
          { text: "On Saturday, everyone posts bowling selfies. Mia likes every one of them." },
          { text: "Then Mia posts a story. A black screen and one word: \"ok.\"" },
        ],
        choices: [
          { text: "Message Mia", next: "lateMia" },
          { text: "Don't make it awkward", next: "endIn" },
        ],
      },
      why: {
        lines: [
          { me: true, text: "why not mia? she's fine" },
          { from: "Sana", text: "omg it's one bowling trip, it's not a big deal" },
          { from: "Hira", text: "she'd just follow sana around all day" },
          { text: "Nobody else says anything." },
        ],
        choices: [
          { text: "Invite Mia to come with you", next: "invite" },
          { text: "Drop it. It's only bowling.", next: "endDrop" },
        ],
      },
      invite: {
        lines: [
          { me: true, text: "I'm bringing mia. more people, more fun 🎳" },
          { from: "Sana", text: "...fine. whatever" },
          { text: "You message Mia. The answer comes back with nine exclamation marks." },
          { text: "On Saturday, Mia gets three strikes. By the end, Hira is asking Mia for tips." },
        ],
        end: {
          tone: "kind",
          title: "You spotted the quiet kind of mean",
          body: "No one said anything rude, so it was easy to miss. But a plan built around leaving one person out, and hiding it from them, is exclusion. You named it calmly and made room. That's often all it takes.",
        },
      },
      tellMia: {
        lines: [
          { me: true, text: "hey, there's a bowling thing on saturday. come with me?" },
          { from: "Mia", text: "oh! nobody told me" },
          { from: "Mia", text: "wait, is everyone going?" },
        ],
        choices: [
          { text: "Tell Mia exactly what Sana said", next: "truth" },
          { text: "Keep it simple: \"come with me, it'll be fun\"", next: "cameWithYou" },
        ],
      },
      truth: {
        lines: [
          { me: true, text: "honestly, sana said not to add you. I think that's mean. I really want you to come though" },
          { from: "Mia", text: "oh." },
          { from: "Mia", text: "thanks for telling me. I don't think I'll go now" },
        ],
        end: {
          tone: "mixed",
          title: "Honest, but it stung",
          body: "Telling the truth came from a good place, but hearing Sana's exact words hurt Mia more. Sometimes the kind move is to just make room, and save the details for a grown-up if the leaving-out keeps happening.",
        },
      },
      cameWithYou: {
        lines: [
          { me: true, text: "come with me, it'll be fun" },
          { from: "Mia", text: "yes!! thank you 🥹" },
          { text: "On Saturday, Sana looks surprised, then shrugs. Mia beats everyone on the air hockey after." },
        ],
        end: {
          tone: "kind",
          title: "Room for one more",
          body: "You didn't need a big speech. Making room for Mia stopped the leaving-out from working. If Sana keeps planning things around keeping Mia out, that's a pattern worth telling a grown-up about.",
        },
      },
      lateMia: {
        lines: [
          { me: true, text: "hey. saw your story. you ok?" },
          { from: "Mia", text: "I saw the bowling pics. I didn't even know there was a group" },
          { me: true, text: "it wasn't fair. next time come with me?" },
          { from: "Mia", text: "ok 🙂" },
        ],
        end: {
          tone: "mixed",
          title: "Late, but it counted",
          body: "Leaving someone out doesn't need mean words. Going along with it was easy, and that's how it works. Checking on Mia afterwards still mattered. Next time, you could make room before the plan, not after.",
        },
      },
      endIn: {
        lines: [{ text: "On Monday, Mia sits on her own at lunch." }],
        end: {
          tone: "hard",
          title: "Nobody said anything mean. That was the problem.",
          body: "Exclusion is quiet. Nobody has to type an insult for it to hurt. It's not too late: a private \"you ok?\" to Mia, or inviting her next time, changes it.",
        },
      },
      endDrop: {
        lines: [{ text: "The plan goes ahead without Mia." }],
        end: {
          tone: "mixed",
          title: "You asked the right question",
          body: "\"Why not Mia?\" made people think, even if the answer was a shrug. Next step: make room yourself, or check on Mia privately. If it keeps happening to her, tell a grown-up.",
        },
      },
    },
  },

  {
    id: "the-rate-page",
    unit: "save",
    title: "The rate page",
    line: "Someone is rating everyone in 7B. Today it's your turn.",
    ages: ["11"],
    place: "7b.ratings",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "Zara sends you a link to a new account: 7b.ratings." },
          { from: "Zara", text: "have you seen this?? it's rating everyone in our class" },
          { text: "Your class photo is on it, with a big red \"3/10 🤢\" across your face. 41 likes." },
          { from: "kab1r_x", text: "😂😂 accurate" },
          { from: "7b.ratings", text: "next one tomorrow 👀" },
        ],
        choices: [
          { text: "Report it right now so it's gone", next: "reportNow" },
          { text: "Screenshot everything first", next: "save" },
          { text: "Comment: \"whoever made this is a loser\"", next: "comment" },
        ],
      },
      reportNow: {
        lines: [
          { text: "You report the post. A few hours later, the whole account is gone." },
          { from: "Zara", text: "it's gone!! but someone said they're making a new one" },
          { text: "You go to Ms Farah. But there's nothing left to show." },
          { from: "Ms Farah", text: "I believe you. Do you have any screenshots? Anything that shows the account and the comments?" },
        ],
        choices: [
          { text: "Ask Zara if she took any", next: "zaraShots" },
          { text: "Say no, and leave it", next: "endGone" },
        ],
      },
      zaraShots: {
        lines: [
          { from: "Zara", text: "yes!! I screenshotted it last night, sending now" },
          { text: "Zara's screenshots show the account name, the dates, and who commented." },
          { from: "Ms Farah", text: "This is exactly what I needed. Leave it with me." },
        ],
        end: {
          tone: "kind",
          title: "Saved by a friend's screenshots",
          body: "Reporting fast was right, and it got the post down. But when a post goes, the proof goes with it. Zara saved the day. Next time: screenshot first, then report, then block.",
        },
      },
      save: {
        lines: [
          { text: "Your hands are shaking a bit. You screenshot the post, the comments, the account page, and the date." },
          { text: "You lock them in Ward's vault." },
        ],
        choices: [
          { text: "Now report it, and tell Ms Farah", next: "reported" },
          { text: "Work out who made it first", next: "detective" },
        ],
      },
      detective: {
        lines: [
          { text: "You spend an hour looking for clues. Maybe it's Usman's cousin. Maybe it's Dev. You're not sure." },
          { me: true, text: "did you make 7b.ratings??" },
          { from: "Dev", text: "what?? no. why would you even think that" },
        ],
        choices: [
          { text: "Stop guessing. Report it and tell Ms Farah.", next: "reported" },
          { text: "Post in the class group that it was Dev", next: "endAccuse" },
        ],
      },
      reported: {
        lines: [
          { text: "You report the account for bullying. Then you show Ms Farah your screenshots." },
          { from: "Ms Farah", text: "These have the account, the comments and the dates. That makes it easy for me to act. The school will report it too, and talk to the class." },
          { text: "Three days later the account is gone, and an assembly about rate pages has everyone squirming." },
        ],
        end: {
          tone: "kind",
          title: "Saved, reported, handed over",
          body: "You saved first, reported second, and let an adult do the detective work. Screenshots with the account name, the comments and the dates are what make adults and apps take it seriously.",
        },
      },
      comment: {
        lines: [
          { me: true, text: "whoever made this is a loser" },
          { from: "7b.ratings", text: "aww 3/10 is mad 😂" },
          { from: "kab1r_x", text: "😂😂" },
          { text: "Now your comment is on the post too, and more people are looking." },
        ],
        choices: [
          { text: "Delete your comment, then screenshot and report", next: "save" },
          { text: "Keep arguing in the comments", next: "endArgue" },
        ],
      },
      endAccuse: {
        lines: [
          { text: "You post: \"Dev made the rate page.\" By lunch, Dev's parents are at school." },
          { text: "It wasn't Dev." },
        ],
        end: {
          tone: "hard",
          title: "The wrong person got blamed",
          body: "Being hurt makes you want answers fast, and guessing can hurt someone who did nothing. Your screenshots are still the best thing you have: give them to Ms Farah and let the school find out. A sorry to Dev would help too.",
        },
      },
      endGone: {
        lines: [{ text: "A week later, a new account appears: 7b.ratings2." }],
        end: {
          tone: "mixed",
          title: "Gone, but not finished",
          body: "Getting the post down was good. But without screenshots, the school couldn't find who made it, and now there's a new one. This time, screenshot it first, then report, then tell.",
        },
      },
      endArgue: {
        lines: [{ text: "By bedtime there are 90 comments. Most of them are about you." }],
        end: {
          tone: "hard",
          title: "The comments made it bigger",
          body: "Fighting back on their page gave it an audience. It's normal to want to. It's still not too late: delete your comments, screenshot everything, report the account, and show a trusted adult.",
        },
      },
    },
  },

  {
    id: "just-ignore-it",
    unit: "say",
    title: "Just ignore it",
    line: "You told a teacher. It didn't stop.",
    ages: ["11"],
    place: "7B 💬",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "For two weeks, Usman and Dev have called you \"NPC\" in the 7B group. Every time you post, someone replies with a robot gif." },
          { from: "Usman", text: "NPC has entered the chat 🤖" },
          { from: "Dev", text: "*loading default dialogue* 🤖" },
          { from: "Usman", text: "beep boop 😂" },
          { text: "Last week you told Mr Okafor. His answer: \"Just ignore them, they'll get bored.\"" },
          { text: "They haven't got bored." },
        ],
        choices: [
          { text: "Ignore it harder. Maybe Mr Okafor is right.", next: "ignore" },
          { text: "Make a meme about Usman back", next: "meme" },
          { text: "Tell a different adult", next: "who" },
        ],
      },
      ignore: {
        lines: [
          { text: "You mute the group. But now people make robot noises when you walk down the corridor." },
          { text: "You've stopped putting your hand up in class." },
        ],
        choices: [
          { text: "Try a different adult", next: "who" },
          { text: "Stop telling people. It's pointless.", next: "endGiveUp" },
        ],
      },
      meme: {
        lines: [
          { me: true, text: "[meme: Usman's face on a clown 🤡]" },
          { from: "Usman", text: "lol ok" },
          { text: "An hour later, Usman sends your meme to Mr Okafor." },
          { from: "Mr Okafor", text: "I've been shown a meme you made about Usman. That's not acceptable." },
        ],
        choices: [
          { text: "Show Mr Okafor the whole two weeks", next: "show" },
          { text: "Say nothing. What's the point?", next: "endMeme" },
        ],
      },
      who: {
        lines: [{ text: "First, you scroll back and screenshot two weeks of messages, with the names and dates showing. Then, who to tell?" }],
        choices: [
          { text: "Ammi", next: "ammi" },
          { text: "Ms Farah, your teacher from last year", next: "farah" },
        ],
      },
      ammi: {
        lines: [
          { me: true, text: "Ammi, can I show you something? I already told Mr Okafor but it didn't stop" },
          { from: "Ammi", text: "Two weeks? I'm so glad you told me. You shouldn't have to deal with this by yourself." },
          { from: "Ammi", text: "Let's email the school tonight with these screenshots, and ask for a meeting." },
        ],
        end: {
          tone: "kind",
          title: "Second time, taken seriously",
          body: "One adult not getting it doesn't mean nobody will. Going to the next one, with screenshots and dates, is hard to brush off. You did both.",
        },
      },
      farah: {
        lines: [
          { me: true, text: "Ms Farah, can I talk to you? I told Mr Okafor and he said to ignore it, but it's been two weeks" },
          { from: "Ms Farah", text: "Thank you for coming to someone again. That takes courage. Can I see?" },
          { text: "You show Ms Farah the screenshots." },
          { from: "Ms Farah", text: "This is a pattern, not banter. I'll speak to Mr Okafor and your head of year today." },
        ],
        end: {
          tone: "kind",
          title: "You didn't stop at the first no",
          body: "\"Just ignore it\" works for a one-off, not for two weeks of the same thing. Saying \"I already told someone and it hasn't stopped\", with proof, is what gets adults moving.",
        },
      },
      show: {
        lines: [
          { me: true, text: "they've called me NPC every day for two weeks. here." },
          { text: "You show Mr Okafor the screenshots, one after another." },
          { from: "Mr Okafor", text: "I didn't realise it was this much. I'm sorry I brushed it off. I'll talk to both of them, and call your parents." },
        ],
        end: {
          tone: "mixed",
          title: "The proof turned it round",
          body: "The meme gave Usman a way to make you look like the problem. Showing the whole pattern helped Mr Okafor see what was really going on. Next time, go straight to the proof and another adult. It works without the risk.",
        },
      },
      endMeme: {
        lines: [{ text: "Now you're the one in trouble. The robot gifs keep coming." }],
        end: {
          tone: "hard",
          title: "It turned around on you",
          body: "Getting back at them felt fair after two weeks. But it gave them a way to make you look like the problem. It's still not too late: screenshots of the whole two weeks tell the real story. Show them to another trusted adult.",
        },
      },
      endGiveUp: {
        lines: [{ text: "The robot noises carry on until half-term." }],
        end: {
          tone: "hard",
          title: "Don't let one adult be the last",
          body: "When the first adult brushes it off, it's easy to think nobody will help. That isn't true. Tell another trusted adult, bring screenshots with names and dates, and say: \"I already told someone and it hasn't stopped.\"",
        },
      },
    },
  },

  {
    id: "the-yo-yo",
    unit: "upstand",
    title: "The yo-yo",
    line: "The new kid keeps getting added to the class group, and removed.",
    ages: ["11"],
    place: "7B 💬",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "Yusuf joined 7B on Monday. He's from Leeds and supports the wrong football team." },
          { text: "Usman added Yusuf" },
          { from: "Usman", text: "welcome new kid 👋" },
          { text: "Usman removed Yusuf" },
          { from: "Hamza", text: "😂😂😂" },
          { text: "Usman added Yusuf" },
          { text: "Usman removed Yusuf" },
          { from: "Usman", text: "he's a yo-yo 🪀" },
          { from: "Hamza", text: "again again" },
        ],
        choices: [
          { text: "Send a 😂. It's kind of funny.", next: "laugh" },
          { text: "Message Yusuf on his own", next: "dm" },
          { text: "Write: \"ok stop, add him and leave him in\"", next: "stop" },
        ],
      },
      laugh: {
        lines: [
          { me: true, text: "😂" },
          { text: "Usman adds and removes Yusuf six more times. The last time, nobody adds him back." },
        ],
        choices: [
          { text: "Message Yusuf now", next: "dmLate" },
          { text: "It's a joke. Yusuf will get over it.", next: "endLaugh" },
        ],
      },
      dm: {
        lines: [
          { me: true, text: "hey, I'm in 7B too. that group thing wasn't ok. you alright?" },
          { from: "Yusuf", text: "I guess. is everyone like this here?" },
          { me: true, text: "no. most people aren't. sit with us at lunch tomorrow?" },
          { from: "Yusuf", text: "ok. thanks 🙂" },
        ],
        choices: [
          { text: "Ask the group to stop, too", next: "stop" },
          { text: "Leave it there", next: "endDm" },
        ],
      },
      stop: {
        lines: [
          { me: true, text: "ok stop. add yusuf and leave him in" },
          { from: "Usman", text: "relax it's banter" },
          { from: "Zara", text: "it's not banter if he's not laughing. add him back" },
          { text: "Usman added Yusuf" },
          { text: "Nobody removes Yusuf again." },
        ],
        end: {
          tone: "kind",
          title: "Two people, and it stopped",
          body: "One calm message gave Zara the courage to join in, and then it stopped. You didn't attack Usman. You just said what plenty of people were thinking. If it starts again, tell your class teacher.",
        },
      },
      endDm: {
        lines: [{ text: "At lunch, Yusuf sits at your table and does a perfect impression of the head teacher." }],
        end: {
          tone: "kind",
          title: "The first friendly face",
          body: "Being new is hard, and being the joke on your first week is harder. A private message was safe for you and meant everything to Yusuf. If the group keeps doing it, you can say something there too, or tell a teacher.",
        },
      },
      dmLate: {
        lines: [
          { me: true, text: "hey, sorry about the group. I shouldn't have laughed. you ok?" },
          { from: "Yusuf", text: "it's fine. I wasn't going to stay in it anyway" },
          { from: "Yusuf", text: "thanks for saying sorry though" },
        ],
        end: {
          tone: "mixed",
          title: "Sorry still matters",
          body: "Laughing along is how a pile-on grows, and the yo-yo joke got bigger with every 😂. Saying sorry privately helped. Next time, you could be the one who says \"leave him in\".",
        },
      },
      endLaugh: {
        lines: [{ text: "Yusuf spends his first week eating lunch in the library." }],
        end: {
          tone: "hard",
          title: "A rough first week",
          body: "To the group it was a game. To Yusuf, it looked like the whole class deciding against him in his first week. It's not too late: a private message, or a saved seat at lunch, can still change his week.",
        },
      },
    },
  },

  {
    id: "on-the-map",
    unit: "lock",
    title: "On the map",
    line: "Kai from Blocktown can see where you live.",
    ages: ["11"],
    place: "Kai ⭐",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "You've played Blocktown with Kai for a month. Kai is funny, really good at the game, and always online." },
          { text: "Today you joined a new app with a map. Your dot is right on top of your house." },
          { from: "Kai", text: "yo I found you on the map!! 📍" },
          { from: "Kai", text: "wait you're in Westfield?? I'm like 10 mins away" },
          { from: "Kai", text: "what school do you go to? we should meet at the park on sat 🛝" },
        ],
        choices: [
          { text: "Tell Kai your school. It's just a name.", next: "school" },
          { text: "Say: \"I'm not allowed to meet online friends\"", next: "notAllowed" },
          { text: "Turn on ghost mode and show Abbu", next: "ghost" },
        ],
      },
      school: {
        lines: [
          { me: true, text: "westfield high, 7B" },
          { from: "Kai", text: "nice. what time do you finish?" },
          { from: "Kai", text: "and don't tell your parents about sat, they'll make it weird 🤫" },
          { text: "Something about that last message makes your stomach drop." },
        ],
        choices: [
          { text: "Stop replying and show Abbu", next: "abbuAfter" },
          { text: "Keep it secret, like Kai said", next: "endSecret" },
        ],
      },
      notAllowed: {
        lines: [
          { me: true, text: "I'm not allowed to meet online friends, sorry" },
          { from: "Kai", text: "your parents don't need to know lol" },
          { from: "Kai", text: "come on. I thought we were friends 😢" },
        ],
        choices: [
          { text: "Show Abbu the chat", next: "abbu" },
          { text: "Say yes, but bring Zara", next: "endMeet" },
        ],
      },
      ghost: {
        lines: [
          { text: "You switch on ghost mode. Your dot disappears from the map." },
          { from: "Kai", text: "where did you go?? 😠" },
          { from: "Kai", text: "turn it back on" },
          { text: "You show Abbu." },
          { from: "Abbu", text: "You did exactly the right thing. A friend from a game doesn't need to know where you live." },
          { from: "Abbu", text: "Let's save the chat, then block and report Kai." },
        ],
        end: {
          tone: "kind",
          title: "Off the map",
          body: "Your location, your school and when you finish are the kind of things that stay private online, even with people who feel like friends. You hid your dot and told Abbu, and that's the whole thing.",
        },
      },
      abbu: {
        lines: [
          { text: "You show Abbu the whole chat." },
          { from: "Abbu", text: "Thank you for showing me. You're not in trouble." },
          { from: "Abbu", text: "Real friends don't ask you to keep secrets from your parents. Let's save this, block and report Kai, and switch on ghost mode." },
        ],
        end: {
          tone: "kind",
          title: "No secrets, no meet-up",
          body: "\"Your parents don't need to know\" is the clearest warning sign there is. You held your no, and you told someone. Kai can't see where you are any more.",
        },
      },
      abbuAfter: {
        lines: [
          { text: "You stop replying, and show Abbu the whole chat." },
          { from: "Abbu", text: "You're not in trouble. That message about keeping secrets was the warning sign, and you spotted it." },
          { from: "Abbu", text: "Let's save it, block and report the account, turn off your location, and tell the school, just in case." },
        ],
        end: {
          tone: "mixed",
          title: "You listened to the warning",
          body: "Telling Kai your school was easy to do, because Kai seemed fun. But \"don't tell your parents\" was the moment to stop, and you did. Telling Abbu fast was the most important part.",
        },
      },
      endSecret: {
        lines: [{ text: "You don't go on Saturday. But Kai keeps messaging, every day, asking why." }],
        end: {
          tone: "hard",
          title: "Secrets like this get heavier",
          body: "When someone online asks you to keep secrets from your parents, that's the moment to tell them. You haven't done anything wrong, and it's not too late. Show a trusted adult the chat today. They can block, report and help.",
        },
      },
      endMeet: {
        lines: [
          { me: true, text: "ok, but Zara's coming too" },
          { from: "Kai", text: "no. just you. don't bring anyone" },
          { text: "That message is the moment you know something is wrong." },
        ],
        end: {
          tone: "mixed",
          title: "That's the warning sign",
          body: "Wanting to bring Zara was a good instinct. But someone who only wants to meet you alone, in secret, isn't someone to trust, however fun they are in the game. Don't go. Save the chat, block, report, and show a trusted adult today.",
        },
      },
    },
  },

  {
    id: "two-thousand-views",
    unit: "bounce",
    title: "2,400 views",
    line: "Someone filmed you falling at sports day.",
    ages: ["11"],
    place: "Zara",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "At sports day, you slipped in the relay and landed in the mud. Someone filmed it." },
          { text: "Now it's online with sad trombone music. 2,400 views. Under it:" },
          { from: "kab1r_x", text: "😂😂😂 replay" },
          { from: "deadmemes_7b", text: "who is this lmaooo" },
          { from: "Zara", text: "hey. I saw the video. you ok?" },
        ],
        choices: [
          { text: "Read every comment", next: "read" },
          { text: "Reply to Zara: \"I'm fine lol\"", next: "fine" },
          { text: "Tell Zara the truth", next: "truth" },
        ],
      },
      read: {
        lines: [
          { text: "You read all 212 comments. Most are just emojis. Three are mean. Those three stay in your head." },
          { text: "\"Maybe I'm just embarrassing,\" you think." },
        ],
        choices: [
          { text: "Think what you'd tell Zara if it was her video", next: "friend" },
          { text: "Keep scrolling", next: "endScroll" },
        ],
      },
      fine: {
        lines: [
          { me: true, text: "I'm fine lol it's funny" },
          { from: "Zara", text: "ok. but if it's not funny, that's ok too" },
          { text: "It's not funny. You've watched it nine times." },
        ],
        choices: [
          { text: "Tell Zara the truth", next: "truth" },
          { text: "Delete every app and hide", next: "hide" },
        ],
      },
      truth: {
        lines: [
          { me: true, text: "honestly I hate it. I've watched it like ten times" },
          { from: "Zara", text: "ugh I'd hate it too. but nobody at school is talking about it, everyone's on about the new Spider-Man" },
          { from: "Zara", text: "want to report it together?" },
        ],
        choices: [
          { text: "Report it together, and tell Ammi", next: "report" },
          { text: "Mute the app for the weekend", next: "mute" },
        ],
      },
      report: {
        lines: [
          { text: "You and Zara both report the video for bullying. You send Ammi a screenshot." },
          { from: "Ammi", text: "Oh, jaan, that must feel awful. I'll call the school in the morning so they can get it taken down." },
          { from: "Ammi", text: "Want to go and get ice cream and not think about it for an hour?" },
          { text: "By Monday the video is gone." },
        ],
        end: {
          tone: "kind",
          title: "It passed, and you weren't alone",
          body: "Videos like this feel like the whole world is watching. Usually it's one afternoon of jokes. Reporting it, telling someone, and not reading every comment got you through. It's never your fault when someone posts you without asking.",
        },
      },
      mute: {
        lines: [
          { text: "You mute the app and turn off notifications. You play football with your cousins instead, and you're rubbish, and nobody films it." },
          { text: "On Monday, two people mention the video. Then they talk about something else." },
        ],
        end: {
          tone: "kind",
          title: "Taking a break isn't losing",
          body: "Stepping away gave you back your weekend. The video was about someone wanting views, not about who you are. If it's still up, reporting it and telling a grown-up can get it taken down.",
        },
      },
      friend: {
        lines: [
          { text: "If it was Zara's video, you'd say: \"it's one slip. you're still you. anyone laughing is being mean, not funny.\"" },
          { text: "You say it to yourself. It helps, a bit." },
        ],
        choices: [
          { text: "Message Zara back", next: "truth" },
          { text: "Mute the app for the weekend", next: "mute" },
        ],
      },
      hide: {
        lines: [{ text: "You delete all your apps. On Sunday night you tell Ammi you've got a tummy ache and can't go to school." }],
        choices: [
          { text: "Tell Ammi the real reason", next: "ammiTruth" },
          { text: "Stay home and say nothing", next: "endHide" },
        ],
      },
      ammiTruth: {
        lines: [
          { me: true, text: "it's not my tummy. someone posted a video of me falling over" },
          { from: "Ammi", text: "Oh, jaan. Thank you for telling me the real reason." },
          { from: "Ammi", text: "It's not your fault. I'll call school first thing so they can get it taken down. You can go in with your head up." },
        ],
        end: {
          tone: "kind",
          title: "The real reason",
          body: "Wanting to hide is completely normal. Telling Ammi the real reason meant someone could help get the video down. Being filmed without asking is on the person who posted it, not on you.",
        },
      },
      endScroll: {
        lines: [{ text: "It's 1am. You know every comment by heart. You don't feel any better." }],
        end: {
          tone: "hard",
          title: "Reading it again made it bigger",
          body: "Three mean comments out of 212, but at 1am they feel like everyone. That's what reading over and over does. It's not about you, it's about people wanting a laugh. Tonight: mute it, report it, and tell someone tomorrow.",
        },
      },
      endHide: {
        lines: [{ text: "You stay home on Monday. And Tuesday. The video is still up." }],
        end: {
          tone: "hard",
          title: "Hiding kept it with you",
          body: "Wanting to hide is completely normal. But keeping it secret means nobody can help get the video taken down. Tell a grown-up the real reason. It's never your fault when someone posts you without asking.",
        },
      },
    },
  },

  // Ages 14 to 17: Year 10, the same cast older, with Bilal, Ayesha, Ms Lina and cousin Ali.

  {
    id: "roast-night",
    unit: "spot",
    title: "Roast night",
    line: "Everyone's getting roasted. Then it's only Bilal.",
    ages: ["14"],
    place: "Y10 roast 🔥",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "Friday night. The Year 10 group has turned into a roast battle, and everyone's getting it." },
          { from: "Rohan", text: "kabir's hairline is already in year 13 💀" },
          { from: "Kabir", text: "rohan's moustache is 3 hairs and a dream 💀" },
          { from: "Dev", text: "LMAOOO" },
          { text: "Then it turns to Bilal." },
          { from: "Dev", text: "bilal's trainers are from the market fr 😭" },
          { from: "Rohan", text: "bilal's family car runs on prayers 🙏" },
          { from: "Bilal", text: "lol ok" },
          { text: "Your thumb hovers. You've got a good one about Bilal's flat." },
        ],
        choices: [
          { text: "Send it. It's a roast, everyone's getting it.", next: "send" },
          { text: "Roast Rohan instead", next: "swap" },
          { text: "Write: \"leave his family out of it\"", next: "line" },
        ],
      },
      send: {
        lines: [
          { me: true, text: "bilal's flat is so small the wifi router has its own bedroom 💀" },
          { from: "Dev", text: "NAHHH 💀💀💀" },
          { from: "Rohan", text: "bilal went quiet 😭" },
          { text: "Bilal's last seen says 9:41. He doesn't come back." },
        ],
        choices: [
          { text: "Message Bilal privately", next: "sorry" },
          { text: "It's a roast. Bilal would do the same.", next: "endSend" },
        ],
      },
      swap: {
        lines: [
          { me: true, text: "rohan roasting cars when his mum still drops him at the gate 💀" },
          { from: "Dev", text: "ROHANNN 💀" },
          { from: "Rohan", text: "ok that's fair 😭" },
          { text: "The roast moves on. A few minutes later, Bilal sends a 😂." },
        ],
        choices: [
          { text: "Leave it there", next: "endSwap" },
          { text: "Check on Bilal anyway", next: "check" },
        ],
      },
      line: {
        lines: [
          { me: true, text: "ok leave bilal's family out of it. that's not a roast, that's just money" },
          { from: "Dev", text: "who made you roast police 😭" },
          { from: "Bilal", text: "it's fine lol" },
          { text: "The money jokes stop. The roast carries on." },
        ],
        choices: [
          { text: "Leave it. Bilal said it's fine.", next: "endLine" },
          { text: "Message Bilal privately", next: "check" },
        ],
      },
      check: {
        lines: [
          { me: true, text: "hey, were you ok with all that? some of it was a lot" },
          { from: "Bilal", text: "honestly it's always me and it's always money stuff" },
          { from: "Bilal", text: "my dad lost his job in the summer. I don't really want it in the group" },
          { me: true, text: "that makes sense. no more money jokes from me, and I'll shut them down if they start" },
          { from: "Bilal", text: "thanks. means a lot" },
        ],
        end: {
          tone: "kind",
          title: "You checked who was still laughing",
          body: "Roasting works when everyone's in on it and it goes round. When it keeps landing on one person, about the same sore spot, it isn't banter any more, even if they type \"lol\". Asking privately was the only way to know.",
        },
      },
      sorry: {
        lines: [
          { me: true, text: "hey. that roast was too far. I'm sorry, I didn't think" },
          { from: "Bilal", text: "it's whatever" },
          { from: "Bilal", text: "it's just always the money stuff. my dad lost his job" },
          { me: true, text: "I didn't know. it won't happen again from me" },
        ],
        end: {
          tone: "mixed",
          title: "You went too far, and you owned it",
          body: "It's easy to get carried away when the group is laughing. The signs were \"lol ok\" and the silence after. A sorry with no \"but\" counted. Next time, you could notice before you hit send.",
        },
      },
      endSend: {
        lines: [{ text: "On Monday Bilal sits at the other end of the bench in maths. Your roast has been screenshotted into two other chats." }],
        end: {
          tone: "hard",
          title: "The laugh lasted a minute. The roast didn't.",
          body: "\"They'd do the same\" is how roasts turn into something else. Bilal had gone quiet, and you couldn't see why. It's still fixable: a private, honest sorry, and dropping the money jokes for good.",
        },
      },
      endSwap: {
        lines: [{ text: "Roast night ends at midnight. Nobody mentions Bilal again." }],
        end: {
          tone: "mixed",
          title: "Smooth, for now",
          body: "Turning the roast back to someone who was in on it took the heat off Bilal, and it worked. But nobody knows if Bilal was ok, and the money jokes might come back next week. A private check-in would close the loop.",
        },
      },
      endLine: {
        lines: [{ text: "By midnight it's all hairlines and moustaches again." }],
        end: {
          tone: "mixed",
          title: "A line, drawn",
          body: "You drew a clear line without making a big deal of it, and it worked. But \"it's fine lol\" doesn't always mean fine. A quick private message to Bilal would tell you for sure.",
        },
      },
    },
  },

  {
    id: "one-hour",
    unit: "stop",
    title: "One hour",
    line: "Someone has a photo of you, and a countdown.",
    ages: ["14"],
    place: "jess.x.22",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "You met Jess on a game two weeks ago. Jess was funny, liked the same music, and said they were 15." },
          { text: "Last night Jess asked for a private photo. You trusted them, and you sent one." },
          { from: "jess.x.22", text: "so I have your pic now" },
          { from: "jess.x.22", text: "send £100 in gift cards in 1 hour or it goes to every follower you have" },
          { from: "jess.x.22", text: "I've got your followers. your school. your cousins 📸" },
          { from: "jess.x.22", text: "tell anyone and I post it straight away" },
        ],
        choices: [
          { text: "Pay. Just make it stop.", next: "pay" },
          { text: "Beg them not to", next: "beg" },
          { text: "Stop replying. Screenshot everything.", next: "stop" },
        ],
      },
      pay: {
        lines: [
          { text: "You spend your birthday money on a gift card and send the code." },
          { from: "jess.x.22", text: "good" },
          { from: "jess.x.22", text: "now £200 more or it still goes out" },
          { text: "Paying didn't stop it. It never does." },
        ],
        choices: [
          { text: "Stop replying now, and tell someone", next: "stop" },
          { text: "Find more money", next: "endPay" },
        ],
      },
      beg: {
        lines: [
          { me: true, text: "please don't. please" },
          { from: "jess.x.22", text: "then send more pics" },
          { from: "jess.x.22", text: "50 mins ⏳" },
          { text: "This is what they want: you scared, and still talking." },
        ],
        choices: [
          { text: "Stop replying. Screenshot everything.", next: "stop" },
          { text: "Do what they say", next: "endMore" },
        ],
      },
      stop: {
        lines: [
          { text: "You stop replying. Your hands are shaking, but you screenshot the chat, the account name and every threat." },
          { text: "Then you block and report the account." },
          { text: "Now the hardest part: telling someone." },
        ],
        choices: [
          { text: "Tell Ammi", next: "ammi" },
          { text: "Tell Ms Farah at school", next: "school" },
          { text: "Tell nobody. Hope it goes away.", next: "alone" },
        ],
      },
      ammi: {
        lines: [
          { me: true, text: "Ammi, I need to tell you something and I'm really scared" },
          { text: "You show Ammi everything. For a second Ammi is quiet. Then comes a hug." },
          { from: "Ammi", text: "Thank you for telling me. You are not in trouble. The person who did this is the one who did something wrong." },
          { from: "Ammi", text: "We'll report it together, to the app and to the police. And we'll use Take It Down, so the photo can be blocked from spreading." },
        ],
        end: {
          tone: "kind",
          title: "You took away their power",
          body: "People who do this rely on fear and silence. You stopped replying, kept the proof, blocked, reported and told an adult. Take It Down (takeitdown.ncmec.org) helps remove images of under-18s, even ones you sent yourself, and Ward's help page lists helplines for your country. It's never your fault.",
        },
      },
      school: {
        lines: [
          { me: true, text: "Ms Farah, can I talk to you? it's serious" },
          { from: "Ms Farah", text: "Of course. Take your time." },
          { text: "You show Ms Farah the screenshots." },
          { from: "Ms Farah", text: "I'm so glad you came to me. You haven't done anything wrong. What this person is doing is a crime." },
          { from: "Ms Farah", text: "We'll call home together, report it to the police, and use Take It Down so the photo can be blocked from spreading." },
        ],
        end: {
          tone: "kind",
          title: "Told someone who knew what to do",
          body: "Schools deal with this more often than you'd think, and they know the steps. Stopping, saving, blocking and telling was exactly right. Take It Down (takeitdown.ncmec.org) and the helplines on Ward's help page are there too. It's never your fault.",
        },
      },
      alone: {
        lines: [
          { text: "You try to forget it. Two days later, a new account messages you." },
          { from: "jess.x.23", text: "thought blocking would work? 📸" },
        ],
        choices: [
          { text: "Tell Ammi now", next: "ammi" },
          { text: "Keep it to yourself", next: "endAlone" },
        ],
      },
      endPay: {
        lines: [{ text: "You send another code. The next message asks for £500." }],
        end: {
          tone: "hard",
          title: "Paying never makes it stop",
          body: "They ask for more because paying shows them you're scared. It isn't too late, and you're not in trouble: stop replying, don't pay again, keep the screenshots, and tell a trusted adult today. Take It Down (takeitdown.ncmec.org) can help stop the photo spreading.",
        },
      },
      endMore: {
        lines: [{ text: "The demands come faster, and each time they want more." }],
        end: {
          tone: "hard",
          title: "It got heavier, and it can still stop",
          body: "Sending more only gives them more to threaten you with. None of this is your fault: the person doing it is committing a crime. Stop replying now, save everything, block, and tell a trusted adult. Take It Down (takeitdown.ncmec.org) helps remove images of under-18s.",
        },
      },
      endAlone: {
        lines: [{ text: "Messages keep coming from new accounts. Sleep gets harder." }],
        end: {
          tone: "hard",
          title: "Too big to carry alone",
          body: "Blocking was right, but people who do this make new accounts. Telling a trusted adult feels impossible, and it's still the way out. They can report it to the police and the apps, and Take It Down (takeitdown.ncmec.org) helps stop images spreading. Ward's help page has helplines too. You're not in trouble.",
        },
      },
    },
  },

  {
    id: "ask-me-anything",
    unit: "save",
    title: "Ask me anything",
    line: "The anonymous questions were fun. Then they weren't.",
    ages: ["14"],
    place: "anon inbox 💌",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "You put an anonymous questions link on your story: \"ask me anything 👀\". For a day, the questions were fun." },
          { text: "Then these arrived:" },
          { from: "anon", text: "why do you even bother coming to school" },
          { from: "anon", text: "everyone in Y10 thinks you're fake" },
          { from: "anon", text: "delete your account before I post what I know" },
        ],
        choices: [
          { text: "Post the worst one on your story with a clapback", next: "clapback" },
          { text: "Delete the app and every message", next: "delete" },
          { text: "Screenshot them and start a log", next: "log" },
        ],
      },
      clapback: {
        lines: [
          { me: true, text: "[story] imagine being this pressed anonymously 🥱" },
          { text: "Twenty people reply to your story. Some laugh. Some ask what the anon \"knows\"." },
          { from: "anon", text: "aww pressed? I'll post it monday" },
        ],
        choices: [
          { text: "Take the story down and start saving", next: "log" },
          { text: "Clap back again", next: "endClap" },
        ],
      },
      delete: {
        lines: [
          { text: "You delete the app and every message. Gone." },
          { text: "Two days later, an account nobody knows posts in the Year 10 group." },
          { from: "y10.tea", text: "someone in this chat is fake and we all know who 👀" },
          { from: "Mr Okafor", text: "I've heard there are anonymous messages going round about you. Have you got anything I can look at?" },
        ],
        choices: [
          { text: "Start saving everything from now", next: "log" },
          { text: "Say you've got nothing", next: "endNothing" },
        ],
      },
      log: {
        lines: [
          { text: "You screenshot every message with the date and time showing, and add them to Ward's vault with a short note: what came in, and when." },
          { text: "Day 1: three messages. Day 2: five. Day 3: \"I'll post what I know on monday.\"" },
        ],
        choices: [
          { text: "Take the log to Mr Okafor", next: "okafor" },
          { text: "Report it in the app first", next: "reportApp" },
        ],
      },
      reportApp: {
        lines: [{ text: "You report the messages as harassment and switch off anonymous questions. The link is dead." }],
        choices: [
          { text: "Now take the log to Mr Okafor", next: "okafor" },
          { text: "That's it. It's over.", next: "endReportOnly" },
        ],
      },
      okafor: {
        lines: [
          { from: "Mr Okafor", text: "This is really clear. Dates, times, and a threat. Thank you for keeping it." },
          { from: "Mr Okafor", text: "Threats like this are serious. I'll take it to our safeguarding lead today, and I'd like to call home, if that's ok with you." },
          { text: "The messages stop that week. The school deals with the person behind them." },
        ],
        end: {
          tone: "kind",
          title: "A log that did the talking",
          body: "Anonymous messages are designed to make you feel powerless. A dated log turns them into a pattern an adult can act on. You didn't argue, didn't lose the proof, and you chose who to show it to.",
        },
      },
      endClap: {
        lines: [
          { me: true, text: "[story] post it then, coward" },
          { text: "By Monday, the replies have turned into a rumour, in group chats you're not even in." },
        ],
        end: {
          tone: "hard",
          title: "The clapback fed it",
          body: "Posting it gave the sender exactly what they wanted: an audience. It's normal to want to hit back. You can still turn it round: take the stories down, screenshot everything with dates, report it, and tell a trusted adult.",
        },
      },
      endNothing: {
        lines: [
          { me: true, text: "no, I deleted it all" },
          { from: "Mr Okafor", text: "Ok. If anything else comes in, keep it and bring it to me." },
        ],
        end: {
          tone: "hard",
          title: "Without the proof, it's harder",
          body: "Deleting it made sense, because who wants to see that? But it left the school with nothing to act on. It's not over: screenshot anything new with the date, keep it safe in Ward's vault, and go back to Mr Okafor.",
        },
      },
      endReportOnly: {
        lines: [{ text: "The anon link is dead. On Monday, someone in the corridor says \"heard you're fake\"." }],
        end: {
          tone: "mixed",
          title: "Reported, but not finished",
          body: "Reporting shut that door, and keeping the log was smart. But the person behind it is still around. Your log is ready: take it to a trusted adult so they can deal with who it was.",
        },
      },
    },
  },

  {
    id: "the-other-group",
    unit: "say",
    title: "The other group",
    line: "Same friends. Same jokes. Minus you.",
    ages: ["14"],
    place: "Mia",
    start: "start",
    scenes: {
      start: {
        lines: [
          { from: "Mia", text: "hey. I wasn't going to say anything but I think you should know" },
          { from: "Mia", text: "there's another group. same people as ours, minus you" },
          { from: "Mia", text: "[screenshot]" },
          { text: "In the screenshot, Sana has posted your selfie with \"main character energy 🙄\". Hira replied \"ugh\". Twelve likes." },
          { text: "You've been in a group with these people since Year 7." },
          { from: "Mia", text: "I'm sorry. I left it." },
        ],
        choices: [
          { text: "Pretend you don't care", next: "pretend" },
          { text: "Call them out in the main group", next: "confront" },
          { text: "Talk to someone you trust", next: "whoTell" },
        ],
      },
      pretend: {
        lines: [
          { text: "You keep sending memes in the main group like nothing happened. Every reply from Sana feels fake now." },
          { text: "A week later, you've stopped eating lunch in the canteen." },
        ],
        choices: [
          { text: "Talk to someone you trust", next: "whoTell" },
          { text: "Keep it to yourself", next: "endPretend" },
        ],
      },
      confront: {
        lines: [
          { text: "You open the main group." },
          { me: true, text: "so is the other group fun? 🙂" },
          { from: "Sana", text: "what other group?? lol" },
          { from: "Hira", text: "who told you that" },
          { text: "Within minutes, someone guesses it was Mia." },
        ],
        choices: [
          { text: "Stop, and talk to someone you trust", next: "whoTell" },
          { text: "Post Mia's screenshot as proof", next: "endConfront" },
        ],
      },
      whoTell: {
        lines: [{ text: "Who do you tell?" }],
        choices: [
          { text: "Ammi", next: "ammi" },
          { text: "Ms Lina, the school counsellor", next: "counsellor" },
          { text: "Cousin Ali, who's away at uni", next: "ali" },
        ],
      },
      ammi: {
        lines: [
          { me: true, text: "Ammi, can I tell you something? but please don't message anyone's parents" },
          { from: "Ammi", text: "I'm listening. I won't do anything without talking to you first." },
          { text: "It all comes out in a rush." },
          { from: "Ammi", text: "That sounds really lonely. Thank you for telling me." },
          { from: "Ammi", text: "What would help most right now?" },
        ],
        choices: [
          { text: "Make a plan together", next: "plan" },
          { text: "Ask Ammi to call Sana's mum tonight", next: "endCall" },
        ],
      },
      plan: {
        lines: [{ text: "You and Ammi make a plan: mute the main group for now, eat lunch with Mia and the robotics lot, and if the posts carry on, show Ms Lina together." }],
        end: {
          tone: "kind",
          title: "Telling, on your terms",
          body: "Telling an adult doesn't have to mean losing control. You said what you needed (\"don't message anyone's parents\") and made a plan together. That's how telling works best.",
        },
      },
      endCall: {
        lines: [
          { from: "Ammi", text: "Ok. If that's what you want, I'll call her." },
          { text: "By morning, Sana knows you told. The main group goes silent, and Mia is getting the blame." },
        ],
        end: {
          tone: "mixed",
          title: "Help, a bit too fast",
          body: "Telling Ammi was right. Asking for a call that night moved faster than anyone was ready for, and Mia got caught up in it. Next time, agree the steps together first: what happens, who's told, and when.",
        },
      },
      counsellor: {
        lines: [
          { text: "You knock on Ms Lina's door at break." },
          { from: "Ms Lina", text: "Come in. Friendship stuff like this is some of the hardest there is. It isn't small." },
          { from: "Ms Lina", text: "What you say stays here unless you're in danger. Shall we work out what you want to happen?" },
        ],
        end: {
          tone: "kind",
          title: "A room to say it in",
          body: "School counsellors deal with friendship fallouts all the time, and they keep it private unless someone's at risk. Saying it out loud to someone outside the group made it smaller.",
        },
      },
      ali: {
        lines: [
          { me: true, text: "can I vent? friend stuff but it's kind of bad" },
          { from: "Ali", text: "always. go" },
          { text: "You tell Ali everything." },
          { from: "Ali", text: "that's genuinely rough. I'm sorry" },
          { from: "Ali", text: "tell someone there too though. your mum, or a counsellor. I'm 200 miles away, they're right there" },
        ],
        choices: [
          { text: "Tell Ammi too", next: "ammi" },
          { text: "Ali knowing is enough", next: "endAli" },
        ],
      },
      endAli: {
        lines: [{ from: "Ali", text: "ok. I'm here whenever. promise you'll say if it gets worse?" }],
        end: {
          tone: "mixed",
          title: "One person knows",
          body: "Venting to Ali helped, and having someone in your corner matters. But Ali is far away. A trusted adult nearby, at home or at school, can step in if it keeps happening. Ali can help you work out what to say.",
        },
      },
      endPretend: {
        lines: [{ text: "By half-term you've drifted out of the main group. Nobody asks why." }],
        end: {
          tone: "hard",
          title: "Carrying it on your own",
          body: "Pretending you don't care is a way of getting through, and lots of people do it. But it leaves you alone with it. It's not too late to tell someone: a parent, a counsellor, a cousin you trust. Start with \"something's been happening with my friends\".",
        },
      },
      endConfront: {
        lines: [
          { me: true, text: "[Mia's screenshot]" },
          { from: "Sana", text: "omg mia actually snitched" },
          { text: "Now Mia is a target too, and the other group has a new screenshot to laugh at." },
        ],
        end: {
          tone: "hard",
          title: "Proof, used as a weapon",
          body: "Wanting to prove them wrong in front of everyone is natural. But it put Mia in the firing line and gave the group something new. Screenshots are strongest with a trusted adult. It's not too late to talk to Mia, and to someone you trust.",
        },
      },
    },
  },

  {
    id: "the-poll",
    unit: "upstand",
    title: "The poll",
    line: "Ayesha's voice cracked at the talent show. Now there's a poll.",
    ages: ["14"],
    place: "Y10 ✨",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "Ayesha sang at the school talent show. Her voice cracked on the high note." },
          { text: "Tonight Dev posts a clip in the Year 10 group, with a poll." },
          { from: "Dev", text: "rate the high note 💀" },
          { from: "Dev", text: "[poll: 1 / 0 / -5 / call an ambulance]" },
          { from: "Hamza", text: "voted ambulance 🚑" },
          { from: "Rohan", text: "😭😭😭" },
          { from: "Dev", text: "everyone vote. if you don't vote you're defending her lol" },
        ],
        choices: [
          { text: "Vote \"1\". It's the least mean one.", next: "vote" },
          { text: "Don't vote. Message Ayesha privately.", next: "dm" },
          { text: "Write: \"take it down, dev\"", next: "speak" },
        ],
      },
      vote: {
        lines: [
          { me: true, text: "[voted: 1]" },
          { from: "Dev", text: "even the nice ones think it's bad 😭" },
          { text: "Ayesha's name shows under \"seen by\". A minute later, Ayesha leaves the group." },
        ],
        choices: [
          { text: "Message Ayesha", next: "dmLate" },
          { text: "Say nothing more", next: "endVote" },
        ],
      },
      dm: {
        lines: [
          { me: true, text: "hey, I saw the clip. that's so not ok. your song was actually good, voices crack, it happens" },
          { from: "Ayesha", text: "I can't go to school on monday" },
          { from: "Ayesha", text: "please don't make it a thing in the group. it'll be worse" },
        ],
        choices: [
          { text: "Report it quietly, and offer to go to Ms Farah together", next: "anon" },
          { text: "Promise to stay out of it", next: "stayOut" },
        ],
      },
      speak: {
        lines: [
          { me: true, text: "take it down, dev. she was brave to even get up there" },
          { from: "Dev", text: "oh here we go 😭 defending her" },
          { from: "Hamza", text: "you fancy her or something 👀" },
          { text: "Your face goes hot. Then:" },
          { from: "Mia", text: "nah, they're right. delete it dev" },
          { from: "Zara", text: "yeah it's weird. delete it" },
          { from: "Dev", text: "...fine. relax" },
          { text: "Dev deleted the poll." },
        ],
        choices: [
          { text: "Check on Ayesha privately too", next: "checkAfter" },
          { text: "Leave it now it's gone", next: "endSpeak" },
        ],
      },
      anon: {
        lines: [
          { text: "You screenshot the poll and the replies, then report the post for bullying. Nobody knows it was you." },
          { me: true, text: "I reported the post. I think Ms Farah should know too. come with me tomorrow? you won't have to say much" },
          { from: "Ayesha", text: "...ok. only if you come with me" },
        ],
        end: {
          tone: "kind",
          title: "On Ayesha's side, the quiet way",
          body: "You didn't join in, you didn't start a war in the group, and you didn't go behind Ayesha's back. A private message, a report, and an adult brought in together. That's upstanding when being loud feels too risky.",
        },
      },
      stayOut: {
        lines: [
          { me: true, text: "ok. I won't say anything" },
          { text: "On Monday, someone hums the high note when Ayesha walks into maths. People laugh." },
        ],
        choices: [
          { text: "Ask Ayesha if you can get help together", next: "anon" },
          { text: "Keep your promise", next: "endStayOut" },
        ],
      },
      checkAfter: {
        lines: [
          { me: true, text: "hey, dev deleted the clip. you ok? your song was good" },
          { from: "Ayesha", text: "I saw what you said. thank you. honestly" },
          { from: "Ayesha", text: "I thought everyone was laughing" },
        ],
        end: {
          tone: "kind",
          title: "Not everyone was laughing",
          body: "Speaking up when a group is piling on is one of the hardest things there is. Hamza tried to make you the next joke, and you held steady. Mia and Zara were waiting for someone to go first. Checking on Ayesha made sure she knew.",
        },
      },
      endSpeak: {
        lines: [{ text: "The clip is gone. Ayesha hasn't said a word in the group all night." }],
        end: {
          tone: "mixed",
          title: "Gone, but does Ayesha know?",
          body: "Getting the clip deleted was huge, and it took guts with Hamza in your face. But from Ayesha's side, it might look like everyone laughed and then it just went away. A short private message would let her know someone stood up for her.",
        },
      },
      dmLate: {
        lines: [
          { me: true, text: "hey, sorry I voted. it was a stupid poll and your song was fine" },
          { from: "Ayesha", text: "thanks I guess" },
        ],
        end: {
          tone: "mixed",
          title: "A small vote, a real sorry",
          body: "Voting \"1\" felt like the least harmful option. But to Ayesha, every vote meant everyone agreed. Saying sorry privately helped. You can still report the post, or tell an adult if the clip keeps spreading.",
        },
      },
      endVote: {
        lines: [{ text: "By morning the clip is in three other group chats." }],
        end: {
          tone: "hard",
          title: "The least mean vote was still a vote",
          body: "Polls like this only work if people vote. \"If you don't vote you're defending her\" is pressure, and it worked. It's not too late: a private sorry to Ayesha, reporting the post, or telling an adult can still help.",
        },
      },
      endStayOut: {
        lines: [{ text: "The humming goes on for weeks. Ayesha quits choir." }],
        end: {
          tone: "hard",
          title: "Staying out let it keep going",
          body: "Respecting what Ayesha asked mattered. But when it keeps happening, getting help isn't a betrayal. You can go back to Ayesha and say: \"I'm worried. Can we tell someone together?\"",
        },
      },
    },
  },

  {
    id: "one-am",
    unit: "bounce",
    title: "1:14am",
    line: "A vague post, a snake emoji, and no sleep.",
    ages: ["14"],
    place: "Y10 ✨",
    start: "start",
    scenes: {
      start: {
        lines: [
          { text: "It's 1:14am. You fell out with Rohan at lunch. Now his story says \"some people are so fake 🐍\"." },
          { text: "Twenty people have viewed it. Three replied with 🐍. In the Year 10 group:" },
          { from: "Rohan", text: "anyway who's coming saturday (not everyone 🙂)" },
          { from: "Dev", text: "🐍🐍" },
          { text: "You've refreshed it thirty times." },
        ],
        choices: [
          { text: "Reply to the story: \"say it to my face\"", next: "reply" },
          { text: "Keep checking who's viewed it", next: "check" },
          { text: "Mute everything and put the phone across the room", next: "mute" },
        ],
      },
      reply: {
        lines: [
          { me: true, text: "say it to my face then 🙂" },
          { from: "Rohan", text: "didn't say your name. guilty conscience? 😭" },
          { text: "Two minutes later, a screenshot of your reply is in the group." },
        ],
        choices: [
          { text: "Put the phone down", next: "mute" },
          { text: "Keep going", next: "endReply" },
        ],
      },
      check: {
        lines: [
          { text: "2:03am. Rohan's best mate viewed it. Your cousin viewed it. Someone you don't even know viewed it." },
          { text: "Your chest feels tight. Every view feels like a vote against you." },
        ],
        choices: [
          { text: "Message someone you trust, even this late", next: "friend" },
          { text: "Keep checking", next: "endCheck" },
        ],
      },
      mute: {
        lines: [
          { text: "You mute the group and Rohan's stories. Phone on charge, across the room. The ceiling is very boring." },
          { text: "Your brain replays lunch. You let it, then think about something else: Saturday's match, the series you're halfway through." },
        ],
        choices: [
          { text: "Sleep. Deal with it tomorrow.", next: "morning" },
          { text: "Grab the phone. Just one check.", next: "check" },
        ],
      },
      friend: {
        lines: [
          { text: "You message Zara." },
          { me: true, text: "you awake? rohan stuff. feeling kind of rubbish" },
          { from: "Zara", text: "I'm up. saw the story, it's so petty" },
          { from: "Zara", text: "it's not about you, it's rohan being embarrassed about lunch. he does this every time he loses an argument" },
          { from: "Zara", text: "mute it and sleep. walk in together tomorrow?" },
          { me: true, text: "ok. thanks" },
        ],
        end: {
          tone: "kind",
          title: "Someone else's 🐍 isn't the truth about you",
          body: "Vague posts are built to make you check and check. At 2am every view feels like the whole year turning on you. Messaging someone you trust, then putting the phone down, broke the loop. If nights like this keep coming, your safety plan in Ward and a trusted adult are there for the heavier ones.",
        },
      },
      morning: {
        lines: [{ text: "In the morning, the story's gone. At registration Rohan's in a weird mood, then asks to borrow a charger like nothing happened." }],
        end: {
          tone: "kind",
          title: "Muted, slept, sorted (mostly)",
          body: "Stories and messages will still be there in the morning, when you're stronger and adults are awake. Muting wasn't losing; it was choosing yourself. If the 🐍 posts keep coming, that's a pattern worth saving and showing a trusted adult.",
        },
      },
      endReply: {
        lines: [
          { me: true, text: "you're so pathetic lol" },
          { from: "Rohan", text: "screenshotted 😭" },
          { text: "At 3am you're still arguing. By first period, half the year has seen it." },
        ],
        end: {
          tone: "hard",
          title: "Up all night, and it got bigger",
          body: "Vague posts are bait, and a reply at 1am is exactly what they hope for. Being angry is fair. Next time: mute, phone across the room, and sort it out in daylight, with someone you trust if it keeps going.",
        },
      },
      endCheck: {
        lines: [{ text: "4:30am. No sleep. At school you feel like a ghost." }],
        end: {
          tone: "hard",
          title: "The views kept you up, not the post",
          body: "Checking who viewed it felt like doing something, but every refresh made it heavier. Vague posts say more about the person posting than about you. Tonight, try: mute, phone across the room, and one message to someone you trust. If it's ever more than a bad night, your safety plan and a trusted adult are there.",
        },
      },
    },
  },
];
