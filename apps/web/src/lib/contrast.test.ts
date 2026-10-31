import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Every look holds WCAG AA: body text and glow-coloured text at 4.5:1 on each surface they sit
// on, the focus ring at 3:1. The tokens are read straight from styles.css, cascading the way the
// browser does (:root and the look's own blocks, in source order), so a new look or a changed
// colour is checked without touching this file.

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const LOOKS = ["lantern", "moonlit", "firefly", "ember", "aurora", "daylight"];

function tokens(look: string) {
  const out: Record<string, string> = {};
  for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sels = sel!.split(",").map((s) => s.trim());
    if (!sels.some((s) => s === ":root" || s === `[data-look="${look}"]`)) continue;
    for (const [, k, v] of body!.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[k!] = v!.trim();
  }
  return out;
}

type RGBA = [number, number, number, number];

function color(tok: Record<string, string>, v: string, depth = 0): RGBA {
  const ref = /^var\(--([\w-]+)\)$/.exec(v);
  if (ref) {
    assert.ok(depth < 5 && tok[ref[1]!], `unresolved ${v}`);
    return color(tok, tok[ref[1]!]!, depth + 1);
  }
  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16)).concat(1) as RGBA;
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(v);
  if (rgb) return [+rgb[1]!, +rgb[2]!, +rgb[3]!, rgb[4] ? +rgb[4] : 1];
  throw new Error(`can't read colour ${v}`);
}

/** A translucent colour laid over an opaque one. */
const over = ([r, g, b, a]: RGBA, [R, G, B]: RGBA): RGBA => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a), 1];

function luminance([r, g, b]: RGBA) {
  const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a: RGBA, b: RGBA) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

for (const look of LOOKS) {
  test(`${look}: text, glow text and the focus ring meet AA`, () => {
    const tok = tokens(look);
    const c = (name: string) => color(tok, `var(--${name})`);
    const surfaces: [string, RGBA][] = [
      ["bg", c("bg")],
      ["surface", c("surface")],
      ["raised", c("raised")],
      ["glow-soft on surface", over(c("glow-soft"), c("surface"))],
    ];
    const fails: string[] = [];
    const need = (fg: string, min: number, on = surfaces) => {
      for (const [name, bg] of on) {
        const r = ratio(c(fg), bg);
        if (r < min) fails.push(`${fg} on ${name}: ${r.toFixed(2)}:1, needs ${min}:1`);
      }
    };
    need("ink", 4.5);
    need("dim", 4.5, surfaces.slice(0, 3));
    need("glow-text", 4.5);
    need("alarm", 4.5, surfaces.slice(0, 2));
    need("safe", 4.5, surfaces.slice(0, 2));
    need("focus", 3, surfaces.slice(0, 3));
    // Button text on the bright glow.
    need("glow-ink", 4.5, [["glow", c("glow")]]);
    assert.deepEqual(fails, []);
  });
}

test("Daylight's glow text is not the bright glow (that was 2.0:1 on white)", () => {
  const tok = tokens("daylight");
  assert.notEqual(color(tok, "var(--glow-text)").join(), color(tok, "var(--glow)").join());
  assert.ok(ratio(color(tok, "var(--glow)"), color(tok, "var(--surface)")) < 3, "the old pairing really did fail");
});
