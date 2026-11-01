# Help-page check, 2026-11-01

Ward's Coach steps (apps/web/src/i18n/en.ts, `coach.apps`) against each app's own help page today.
**no-ward-step**: Ward gives no step for this action in this app, so there is nothing to compare (the page is still linked). **drift** means a button or menu name Ward tells kids to look for wasn't on the page: a person should check the app and the page, then fix `en.ts` and `ur.ts` together. Written by `pnpm helpcheck`.

| App | Action | Status | Not on the page | Help page |
| --- | --- | --- | --- | --- |
| WhatsApp | report | ok |  | [About reporting and blocking on WhatsApp](https://faq.whatsapp.com/414631957536067/) |
| WhatsApp | block | ok |  | [How to block and report someone / WhatsApp Help Center](https://faq.whatsapp.com/1142481766359885) |
| WhatsApp | proof | no-ward-step |  | [How to export your chat history / WhatsApp Help Center](https://faq.whatsapp.com/1180414079177245) |
| Instagram | report | ok |  | [Help Center](https://help.instagram.com/) |
| Instagram | block | drift | three dots | [Help Center](https://help.instagram.com/454180787965921) |
| Instagram | proof | no-ward-step |  | [Help Center](https://help.instagram.com/272077316522642) |
| TikTok | report | drift | share arrow | [Report a problem - TikTok Help Center](https://support.tiktok.com/en/safety-hc/report-a-problem/report-a-post) |
| TikTok | block | drift | share arrow | [Blocking someone - TikTok Help Center](https://support.tiktok.com/en/using-tiktok/followers-and-following/blocking-the-users?lang=en) |
| TikTok | proof | no-ward-step |  | [TikTok Support](https://support.tiktok.com/?lang=en-us) |
| Snapchat | report | drift | manage friendship, block | [Snapchat Support](https://help.snapchat.com/hc/en-us/p/5153567363039232-help-topic) |
| Snapchat | block | ok |  | [How do I block a friend on Snapchat? - Snapchat Support](https://help.snapchat.com/hc/en-us/articles/7012401093396-How-do-I-block-a-friend-on-Snapchat) |
| Snapchat | proof | no-ward-step |  | [When I save a Snap in Chat, where is it stored? - Snapchat Support](https://help.snapchat.com/hc/en-us/articles/7012354501524-When-I-save-a-Snap-in-Chat-where-is-it-stored) |
| Discord | report | drift | right-click, report message | [Reporting Abusive Behavior to Discord](https://support.discord.com/hc/en-us/articles/22582288274071-Reporting-Abusive-Behavior-to-Discord) |
| Discord | block | drift | three dots | [Blocking & Privacy Settings - Discord](https://support.discord.com/hc/en-us/articles/217916488-Blocking-Privacy-Settings) |
| Discord | proof | no-ward-step |  | [Sending Messages - Discord](https://support.discord.com/hc/en-us/articles/360034632292-Sending-Messages) |

## Instagram: block

Ward says:
- On their profile, tap the three dots at the top right, then Block. Restrict is a quieter option: they won't know, and you won't see their comments.

The page says:
- click the chat with the person you want to block/unblock, then click  information at the top.
- click block/unblock, then click again to confirm.

## TikTok: report

Ward says:
- Press and hold a mean comment, then tap Report.
- On their profile, tap the share arrow at the top right, then Report or Block.

The page says:
- (no step-like lines found; read the page)

## TikTok: block

Ward says:
- On their profile, tap the share arrow at the top right, then Report or Block.

The page says:
- 3. tap block at the bottom, then tap block again to confirm.
- 4. select the comments from accounts you want to block, then tap more at the bottom.
- 5. tap block accounts.
- 6. tap block to confirm.
- 3. tap unblock at the bottom to confirm.

## Snapchat: report

Ward says:
- Tap Manage Friendship, then Report or Block.

The page says:
- press and hold on the profile or content you’d like to report, then tap 'report.'

## Discord: report

Ward says:
- Press and hold (or right-click) a message, then Report Message.

The page says:
- (no step-like lines found; read the page)

## Discord: block

Ward says:
- Tap their name, then the three dots, then Block.

The page says:
- 1. to block specific individuals, open a user's profile from the members list by selecting the member.
- 2. then, press the ellipsis [] and choose block.
- 3.  once you confirm your action, the user will be blocked.
- 2. select a user, tap the ellipsis [], and choose block to instantly block the user.
