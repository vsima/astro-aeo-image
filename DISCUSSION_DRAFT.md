# Astro Discussion draft

**Where to post:** https://github.com/withastro/astro/discussions — category **"Show & Tell"** (community integration), NOT a core feature request/PR.

**Title:** `astro-aeo-image — embed <Image> alt text into the output files as XMP (for Google Images & AI search)`

---

Hi all 👋

I built a small **community image service** and wanted to share it + get feedback on the approach.

### The itch

Astro requires an `alt` on every `<Image />` — which is great. But that description only lives in the rendered HTML attribute. The moment the optimized file in `dist/_astro/` is encountered *as a file* — indexed by Google Images, hot-linked, or ingested by an AI crawler (ChatGPT / Perplexity / AI Overviews) — the description isn't there. The image is anonymous bytes.

### What it does

[`astro-aeo-image`](https://github.com/vsima/astro-aeo-image) is a drop-in image service that **wraps Astro's default sharp service** and, after sharp encodes each variant, embeds the `alt` (plus optional `description` / `keywords` / `title`) as standards **XMP** into the output buffer — `Iptc4xmpCore:AltTextAccessibility` + `dc:description` + `dc:subject`.

```js
// astro.config.mjs
image: { service: { entrypoint: "astro-aeo-image" } }
```

No other changes — every existing `<Image>` now ships its alt text inside the file. sharp does all the encoding exactly as before; the metadata is spliced in **byte-preserving (no re-encode)**, so the compressed pixels are identical.

### Why not just `keepMetadata`?

This is the part I'd love a sanity-check on. sharp's `keepMetadata`/`keepExif` **preserves** metadata that already exists in a source file — but it can't **author** a new descriptive packet from application data. The `alt` you typed in your `.astro` file isn't in the source image's EXIF; it's in your component. So this is an *authoring* layer, complementary to (not competing with) sharp's preservation flags.

The metadata writer underneath is [`aeo-image`](https://github.com/vsima/aeo-image) — zero-dependency, pure-TS, writes XMP to WebP/AVIF/JPEG/PNG without re-encoding. (Full disclosure: I maintain both packages — sharing because I think the "alt text should live in the file too" idea is genuinely useful for Astro sites, and I'd like feedback / to know if others want this.)

### Questions for the community / maintainers

1. Does this seem like a reasonable use of the **Image Service API**, or is there a cleaner seam I'm missing?
2. For **static builds**, `<Image>` props (incl. `alt`) reach the service's `transform()` — confirmed. For **on-demand/SSR** image endpoints I'm including the props in `propertiesToHash` so they survive into `transform()`; if anyone runs SSR image optimization and can sanity-check that path, I'd appreciate it.
3. Would a short docs recipe ("make your optimized images self-describing for image search") be welcome somewhere, independent of the package?

Repo + README (with the format support, custom-prop API, and verification steps): https://github.com/vsima/astro-aeo-image

Thanks — and thanks for the Image Service API; wrapping the sharp service was genuinely pleasant. 🙏

---

## Posting notes (for you, not part of the post)

- **Category matters:** post under **Show & Tell**, not "Ideas"/feature-request. It's a community integration you're sharing, not a request to change core — that framing is welcomed, not seen as spam.
- **Disclosure is in the post** ("I maintain both packages") — keep it; it's what separates a genuine contribution from drive-by promotion.
- **Prereq before posting:** push `astro-aeo-image` to GitHub and (ideally) publish it to npm so the links resolve and people can actually `npm install` it. A Show & Tell for a package nobody can install lands flat.
- **Optional stronger entry:** add a tiny example Astro project (or a Stackblitz) showing before/after `exiftool` output on a built image — concrete proof converts skeptics.
- **Lead with the recipe option** if a maintainer pushes back on "another image service": offer the no-package version (post-build script over `dist/_astro/` using `aeo-image` directly) so the *idea* lands even if the package doesn't.
