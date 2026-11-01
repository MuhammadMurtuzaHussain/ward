# Help-page check, 2026-11-01

Ward's Coach steps (apps/web/src/i18n/en.ts, `coach.apps`) against each app's own help page today.
**no-ward-step**: Ward gives no step for this action in this app, so there is nothing to compare (the page is still linked). **drift** means a button or menu name Ward tells kids to look for wasn't on the page: a person should check the app and the page, then fix `en.ts` and `ur.ts` together. Written by `pnpm helpcheck`.

| App | Action | Status | Not on the page | Help page |
| --- | --- | --- | --- | --- |
| WhatsApp | report | ok |  | [About reporting and blocking on WhatsApp](https://faq.whatsapp.com/414631957536067/) |
| WhatsApp | block | ok |  | [How to block and report someone / WhatsApp Help Center](https://faq.whatsapp.com/1142481766359885) |
| WhatsApp | proof | no-ward-step |  | [How to export your chat history / WhatsApp Help Center](https://faq.whatsapp.com/1180414079177245) |
| Instagram | report | ok |  | [Help Center](https://help.instagram.com/) |
| Instagram | block | ok |  | [Help Center](https://help.instagram.com/454180787965921) |
| Instagram | proof | no-ward-step |  | [Help Center](https://help.instagram.com/272077316522642) |
| TikTok | report | ok |  | [Report a problem - TikTok Help Center](https://support.tiktok.com/en/safety-hc/report-a-problem/report-a-post) |
| TikTok | block | ok |  | [Blocking someone - TikTok Help Center](https://support.tiktok.com/en/using-tiktok/followers-and-following/blocking-the-users?lang=en) |
| TikTok | proof | no-ward-step |  | [TikTok Support](https://support.tiktok.com/?lang=en-us) |
| Snapchat | report | ok |  | [Snapchat Support](https://help.snapchat.com/hc/en-us/p/5153567363039232-help-topic) |
| Snapchat | block | ok |  | [How do I block a friend on Snapchat? - Snapchat Support](https://help.snapchat.com/hc/en-us/articles/7012401093396-How-do-I-block-a-friend-on-Snapchat) |
| Snapchat | proof | no-ward-step |  | [When I save a Snap in Chat, where is it stored? - Snapchat Support](https://help.snapchat.com/hc/en-us/articles/7012354501524-When-I-save-a-Snap-in-Chat-where-is-it-stored) |
| Discord | report | drift | right-click, report message | [Reporting Abusive Behavior to Discord](https://support.discord.com/hc/en-us/articles/22582288274071-Reporting-Abusive-Behavior-to-Discord) |
| Discord | block | ok |  | [Blocking & Privacy Settings - Discord](https://support.discord.com/hc/en-us/articles/217916488-Blocking-Privacy-Settings) |
| Discord | proof | no-ward-step |  | [Sending Messages - Discord](https://support.discord.com/hc/en-us/articles/360034632292-Sending-Messages) |

## Discord: report

Ward says:
- Press and hold (or right-click) a message, then Report Message.

The page says:
- (no step-like lines found; read the page)
