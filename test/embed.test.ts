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

// ---- Google Licensable fields pass-through ----

test("maps attribution + licensing props (object licensor form)", () => {
  const m = metadataFromProps({
    alt: "Licensable barn",
    creator: "Jane Doe",
    credit: "Example Studio",
    copyrightNotice: "© 2026 Example Studio",
    licenseUrl: "https://example.com/license/1",
    licensor: { url: "https://example.com/buy/1", name: "Example Stock" },
  });
  assert.equal(m?.creator, "Jane Doe");
  assert.equal(m?.credit, "Example Studio");
  assert.equal(m?.copyrightNotice, "© 2026 Example Studio");
  assert.equal(m?.licenseUrl, "https://example.com/license/1");
  assert.deepEqual(m?.licensor, { url: "https://example.com/buy/1", name: "Example Stock" });
});

test("supports flat licensorUrl/licensorName props for ergonomic markup", () => {
  const m = metadataFromProps({
    alt: "x",
    licensorUrl: "https://example.com/buy/2",
    licensorName: "Flat Stock",
  });
  assert.deepEqual(m?.licensor, { url: "https://example.com/buy/2", name: "Flat Stock" });
});

test("PNG: Licensable fields embed and read back via aeo-image", () => {
  const out = embedMetadata(PNG, {
    alt: "barn",
    licenseUrl: "https://example.com/license/3",
    licensorUrl: "https://example.com/buy/3",
  });
  const r = readMetadata(out);
  assert.equal(r.licenseUrl, "https://example.com/license/3");
  assert.deepEqual(r.licensor, { url: "https://example.com/buy/3" });
});

// ---- IPTC 2025.1 AI provenance pass-through ----

test("maps AI provenance props (object ai form)", () => {
  const m = metadataFromProps({
    alt: "AI market scene",
    ai: {
      prompt: "neon street market, rain reflections",
      promptWriter: "Jane Doe",
      system: "DALL-E via Bing Image Creator",
      systemVersion: "3",
    },
  });
  assert.deepEqual(m?.ai, {
    prompt: "neon street market, rain reflections",
    promptWriter: "Jane Doe",
    system: "DALL-E via Bing Image Creator",
    systemVersion: "3",
  });
});

test("supports flat aiPrompt/aiSystem/etc props for ergonomic markup", () => {
  const m = metadataFromProps({
    alt: "x",
    aiPrompt: "a red barn, watercolor",
    aiSystem: "Google Gemini",
  });
  assert.deepEqual(m?.ai, { prompt: "a red barn, watercolor", system: "Google Gemini" });
});

test("digitalSourceType accepts a full IRI or a bare CV term", () => {
  const iri = "http://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic";
  assert.equal(metadataFromProps({ alt: "x", digitalSourceType: iri })?.digitalSourceType, iri);
  assert.equal(
    metadataFromProps({ alt: "x", digitalSourceType: "trainedAlgorithmicMedia" })
      ?.digitalSourceType,
    "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
  );
});

test("aiGenerated shorthand sets trainedAlgorithmicMedia", () => {
  assert.equal(
    metadataFromProps({ alt: "x", aiGenerated: true })?.digitalSourceType,
    "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
  );
  // Explicit digitalSourceType wins over the shorthand.
  assert.equal(
    metadataFromProps({ alt: "x", aiGenerated: true, digitalSourceType: "compositeSynthetic" })
      ?.digitalSourceType,
    "http://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic",
  );
});

test("WebP: AI provenance embeds and reads back via aeo-image", () => {
  const out = embedMetadata(WEBP, {
    alt: "AI scene",
    aiGenerated: true,
    aiPrompt: "neon market",
    aiSystem: "TestGen",
    aiSystemVersion: "2",
  });
  const r = readMetadata(out);
  assert.equal(
    r.digitalSourceType,
    "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
  );
  assert.deepEqual(r.ai, { prompt: "neon market", system: "TestGen", systemVersion: "2" });
});

test("no AI props → no ai/digitalSourceType in metadata", () => {
  const m = metadataFromProps({ alt: "plain" });
  assert.ok(m && !("ai" in m) && !("digitalSourceType" in m));
});
