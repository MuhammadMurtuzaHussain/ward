// Ward's Discord commands. Every one works both ways: installed to a teen's own account (so it
// works in any server or DM, even ones that never added Ward) and installed to a server.

import { WANTS } from "@ward/engine";
import { REGIONS } from "../../web/src/lib/help.ts";

const BOTH = { integration_types: [0, 1], contexts: [0, 1, 2] };

export const CHECK = "Check with Ward";
export const SAVE = "Save as evidence";

export const COMMANDS = [
  { type: 3, name: CHECK, ...BOTH },
  { type: 3, name: SAVE, ...BOTH },
  {
    type: 1,
    name: "ward",
    description: "Ward: help with bullying online",
    ...BOTH,
    options: [
      {
        type: 1,
        name: "help",
        description: "Free, private people you can talk to",
        options: [{ type: 3, name: "country", description: "Where you are", choices: REGIONS.map((r) => ({ name: r.name, value: r.id })) }],
      },
      {
        type: 1,
        name: "report",
        description: "Turn the messages you saved into a report you can give to an adult",
        options: [
          {
            type: 3,
            name: "for",
            description: "Who it's for",
            required: true,
            choices: [
              { name: "A helpline", value: "helpline" },
              { name: "My school", value: "school" },
              { name: "The police", value: "police" },
              { name: "An adult I trust", value: "adult" },
            ],
          },
          {
            type: 3,
            name: "in_danger",
            description: "Are you in danger right now?",
            choices: [
              { name: "Yes", value: "yes" },
              { name: "No", value: "no" },
              { name: "I'd rather not say", value: "skip" },
            ],
          },
          { type: 3, name: "want", description: "What do you want to happen?", choices: Object.entries(WANTS).map(([value, name]) => ({ name, value })) },
          { type: 3, name: "first_name", description: "Your first name, if you want to share it", max_length: 40 },
          {
            type: 3,
            name: "age",
            description: "Your age, if you want to share it",
            choices: [
              { name: "13", value: "11" },
              { name: "14 to 17", value: "14" },
            ],
          },
        ],
      },
      { type: 1, name: "about", description: "What Ward does, and what it keeps (nothing)" },
      { type: 1, name: "server", description: "For moderators: Ward's server mode" },
    ],
  },
];
