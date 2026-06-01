import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readMetadata } from "aeo-image";
import { embedMetadata, metadataFromProps } from "../src/embed.ts";

const fixture = (name: string) =>
  new Uint8Array(
    readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))),
  );

const PNG = fixture("sample.png");
const WEBP = fixture("sample.webp");

// ---- metadataFromProps (pure mapping) ----

test("maps alt → altText and (by default) description", () => {
  assert.deepEqual(metadataFromProps({ alt: "A red barn at dusk" }), {
    altText: "A red barn at dusk",
    description: "A red barn at dusk",
  });
});

test("separate description prop overrides alt-as-description", () => {
  const m = metadataFromProps({
    alt: "Barn",
    description: "A weathered red barn under a violet dusk sky in rural Vermont",
  });
  assert.equal(m?.altText, "Barn");
  assert.equal(m?.description, "A weathered red barn under a violet dusk sky in rural Vermont");
});

test("useAltAsDescription:false keeps alt out of description", () => {
  const m = metadataFromProps({ alt: "Barn" }, { useAltAsDescription: false });
  assert.deepEqual(m, { altText: "Barn" });
});

test("keywords accepts array or comma-separated string", () => {
  assert.deepEqual(metadataFromProps({ alt: "x", keywords: ["a", "b"] })?.keywords, ["a", "b"]);
  assert.deepEqual(metadataFromProps({ alt: "x", keywords: "a, b ,c" })?.keywords, ["a", "b", "c"]);
});

test("returns null when there's nothing descriptive", () => {
  assert.equal(metadataFromProps({}), null);
  assert.equal(metadataFromProps({ alt: "   " }), null);
});

// ---- embedMetadata (real aeo-image round-trip) ----

test("PNG: embeds alt as readable XMP, byte-preserving path", () => {
  const out = embedMetadata(PNG, { alt: "A red barn at dusk", keywords: ["barn", "vermont"] });
  const read = readMetadata(out);
  assert.equal(read.altText, "A red barn at dusk");
  assert.equal(read.description, "A red barn at dusk");
  assert.deepEqual(read.keywords, ["barn", "vermont"]);
  assert.ok(out.length > PNG.length, "metadata was added");
});

test("WebP: embeds description distinct from alt", () => {
  const out = embedMetadata(WEBP, {
    alt: "Frisbee dog",
    description: "A golden retriever mid-jump catching a frisbee on a beach",
    title: "Beach Dog",
  });
  const read = readMetadata(out);
  assert.equal(read.altText, "Frisbee dog");
  assert.equal(read.description, "A golden retriever mid-jump catching a frisbee on a beach");
  assert.equal(read.title, "Beach Dog");
});

test("no descriptive props → buffer returned unchanged", () => {
  const out = embedMetadata(PNG, {});
  assert.equal(out, PNG, "same reference, untouched");
});

test("unknown format (not an image we handle) → returned unchanged", () => {
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const out = embedMetadata(svg, { alt: "vector" });
  assert.equal(out, svg);
});

test("re-embedding replaces, doesn't duplicate", () => {
  const once = embedMetadata(PNG, { alt: "first" });
  const twice = embedMetadata(once, { alt: "second" });
  assert.equal(readMetadata(twice).altText, "second");
});
