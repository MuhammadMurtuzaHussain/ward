// Print one part of a screen (a lesson plan, the letter, the survey) on its own, through a
// hidden frame: the app's styles come along, the night-light colours turn into black on white,
// and the page direction follows the language being printed.

export function printPart(el: HTMLElement, { lang, title }: { lang: string; title: string }) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.append(frame);
  const doc = frame.contentDocument!;
  const styles = [...document.querySelectorAll('style, link[rel="stylesheet"]')].map((n) => n.outerHTML).join("\n");
  const dir = lang === "ur" ? "rtl" : "ltr";
  doc.open();
  doc.write(`<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${title.replace(/</g, "&lt;")}</title><base href="${document.baseURI}">${styles}
<style>
  :root { --bg:#fff; --surface:#fff; --raised:#f1f1f4; --line:#c9c9d3; --ink:#111; --dim:#444; --glow:#222; --glow-ink:#fff; --glow-soft:#f1f1f4; --alarm:#9b1c1c; --alarm-soft:#fbeaea; --safe:#1d6b45; }
  html, body { background:#fff !important; color:#111 !important; }
  body { margin: 0; padding: 0; }
  @page { margin: 14mm; }
  .page-break { break-before: page; }
  .no-print { display: none !important; }
  * { box-shadow: none !important; }
</style></head><body>${el.outerHTML}</body></html>`);
  doc.close();
  // Fonts and styles need a moment to apply before the print dialog opens.
  const go = () => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 1000);
  };
  if (doc.readyState === "complete") setTimeout(go, 250);
  else frame.onload = () => setTimeout(go, 250);
}
