import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
const theme = source("app/globals.css");
const colors = Object.fromEntries(
  [...theme.matchAll(/--([a-z-]+):\s*(#[\da-f]{6});/g)].map((match) => [
    match[1],
    match[2],
  ]),
);

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((part) => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(colors[first]), luminance(colors[second])];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

test("black-and-gold text tokens meet normal-text contrast on every shared surface", () => {
  for (const surface of ["background", "surface", "surface-raised"]) {
    for (const ink of [
      "foreground",
      "muted",
      "gold",
      "gold-bright",
      "danger",
    ]) {
      assert.ok(contrast(ink, surface) >= 4.5, `${ink} on ${surface}`);
    }
    assert.ok(contrast("control-line", surface) >= 3, `controls on ${surface}`);
  }
  assert.ok(contrast("on-gold", "gold") >= 7);
});

test("status messages retain distinct readable colors in the dark theme", () => {
  for (const state of ["success", "danger", "info"]) {
    assert.ok(contrast(state, state + "-surface") >= 4.5, state);
  }
  assert.ok(contrast("gold-bright", "warning-surface") >= 4.5);
  assert.notEqual(colors.danger, colors.gold);
  assert.notEqual(colors.success, colors.gold);
});

test("cursive is scoped to the wordmark, with dark controls and visible keyboard focus", () => {
  assert.match(theme, /color-scheme:\s*dark/);
  const body = theme.match(/body\s*\{([^}]+)\}/)[1];
  const wordmark = theme.match(/\.brand-wordmark\s*\{([^}]+)\}/)[1];
  assert.match(body, /--font-geist-sans/);
  assert.doesNotMatch(body, /--font-brand-script|cursive/);
  assert.match(wordmark, /--font-brand-script/);
  assert.match(source("app/layout.tsx"), /Great_Vibes/);
  assert.match(
    source("app/product-tools.css"),
    /:focus-visible\s*\{\s*outline: 3px solid var\(--gold-bright\)/,
  );
  for (const path of [
    "app/globals.css",
    "app/product-tools.css",
    "components/ProductHome.tsx",
  ]) {
    assert.doesNotMatch(source(path), /#(?:173c2d|dfff72|f5f1e8)/i, path);
  }
});

test("shared brand uses a local transparent square asset and accessible text", () => {
  const brand = source("components/Brand.tsx");
  const assetPath = brand.match(/src="(\/brand\/[^\"]+\.png)"/)[1];
  const asset = readFileSync(new URL("../public" + assetPath, import.meta.url));
  assert.equal(asset.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(asset.toString("ascii", 12, 16), "IHDR");
  assert.equal(asset.readUInt32BE(16), 1254);
  assert.equal(asset.readUInt32BE(20), 1254);
  assert.equal(asset[25], 6, "PNG must retain its RGBA channel");
  assert.match(brand, /Emperor penguin above a geometric gold vortex/);
  assert.match(brand, /<span>Commitment<\/span>/);
  assert.match(brand, /<span>Pools<\/span>/);
  for (const path of [
    "components/ProductHome.tsx",
    "components/WalletAuthScreen.tsx",
  ]) {
    assert.match(source(path), /<BrandLockup\s*\/>/, path);
  }
});

test("the chosen logo places the product name above the unchanged emblem", () => {
  const brand = source("components/Brand.tsx").split(
    "export function BrandLockup",
  )[1];
  const wordmarkPosition = brand.indexOf('className="brand-wordmark"');
  const emblemPosition = brand.indexOf("<BrandEmblem");
  assert.ok(wordmarkPosition >= 0 && wordmarkPosition < emblemPosition);
  const layout = theme.match(/\.brand-lockup\s*\{([^}]+)\}/)[1];
  assert.match(layout, /flex-direction:\s*column/);
  assert.match(layout, /align-items:\s*center/);
  assert.match(
    source("components/ProductHome.tsx"),
    /<BrandLockup featured\s*\/>/,
  );
  assert.doesNotMatch(brand, /brand-tagline/);
});
