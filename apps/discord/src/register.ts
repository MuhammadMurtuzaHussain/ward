// Registers Ward's commands with Discord, globally. Run once after creating the app, and again
// whenever src/commands.ts changes: pnpm --filter @ward/discord register

import { REST, Routes } from "discord.js";
import { COMMANDS } from "./commands.ts";

const token = process.env.DISCORD_TOKEN;
const app = process.env.DISCORD_APP_ID;
if (!token || !app) throw new Error("Set DISCORD_TOKEN and DISCORD_APP_ID (see apps/discord/README.md).");

const done = (await new REST().setToken(token).put(Routes.applicationCommands(app), { body: COMMANDS })) as unknown[];
console.log(`Registered ${done.length} commands.`);
