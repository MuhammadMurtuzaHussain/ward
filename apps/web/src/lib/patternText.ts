// A pattern's sentence for the child, in their language, from the facts the engine found.
// Evidence saved before patterns carried facts falls back to the engine's English sentence.

import type { Pattern } from "@ward/engine";
import type { Dict } from "../i18n/index.ts";

export function patternText(p: Pattern, t: Dict): string {
  const d = p.data;
  if (!d) return p.summary;
  switch (p.kind) {
    case "danger":
      return t.patterns.danger((d.kinds ?? []).map((k) => t.patterns.dangerKinds[k]).filter((x): x is string => !!x));
    case "campaign":
      return t.patterns.campaign(d.lead ?? p.senders[0] ?? "", d.count ?? 0, d.days ?? 0, d.others ?? []);
    case "pileon":
      return t.patterns.pileon(d.count ?? p.senders.length);
    case "ghosts":
      return t.patterns.ghosts(d.names ?? p.senders);
    case "exclusion":
      return t.patterns.exclusion(!!d.removed);
    case "nightwatch":
      return t.patterns.nightwatch(d.count ?? p.messageIds.length);
    case "escalating":
      return t.patterns.escalating;
  }
}
