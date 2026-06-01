# astro-aeo-image

> An Astro image service that embeds your `<Image>` **alt text** (and optional description/keywords/license) as standards **XMP/IPTC** directly into the optimized output files — so your `dist/_astro` assets are **self-describing**: [Google Images reads embedded IPTC metadata and recommends embedding it](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata), and the description travels with the file for accessibility, attribution, and the AI-search era.

[![npm](https://img.shields.io/npm/v/astro-aeo-image.svg)](https://www.npmjs.com/package/astro-aeo-image)
![license](https://img.shields.io/badge/license-MIT-green)

Astro **already requires** an `alt` on every `<Image />` — but that text normally lives only in the HTML attribute. The moment the optimized file is downloaded, hot-linked, or indexed *as a file*, the page context is gone. `astro-aeo-image` writes the description (and attribution/license) **into the image bytes**, where it travels with the file.

> **What's documented:** [Google Images reads embedded IPTC metadata](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata) (creator/credit/copyright/license) and **recommends embedding it**. For image *ranking*, Google uses the [HTML `alt`](https://developers.google.com/search/docs/appearance/google-images) — so embedding **complements** it (durability, accessibility, attribution), it doesn't replace it or claim a ranking boost. AI engines consuming embedded metadata is forward-looking, not yet a spec.

## How it's different from `image.service.config.keepMetadata`

This is an **authoring** layer, not a **preservation** one — and that distinction is the whole point:

| | sharp's `keepMetadata` / `keepExif` | **astro-aeo-image** |
| --- | --- | --- |
| Carries through metadata already in the *source* file | ✅ | — |
| **Authors new descriptive metadata** from your app data (the `alt` you already wrote, captions, keywords) | ❌ | ✅ |
| Writes `Iptc4xmpCore:AltTextAccessibility` + `dc:description` for AEO/accessibility | ❌ | ✅ |

sharp can preserve a camera's existing EXIF; it can't compose a fresh XMP packet from the `alt` prop in your `.astro` file. That's the gap this fills.

## How it works

It's a thin wrapper around **Astro's own default sharp service**. Everything sharp does is unchanged — same resizing, formats, quality, caching. After sharp encodes each variant, this service splices descriptive XMP into the output buffer via [`aeo-image`](https://www.npmjs.com/package/aeo-image): **byte-preserving, no re-encode** — the compressed pixels are identical; only a metadata block is added.

## Install

```bash
npm install astro-aeo-image
```

`aeo-image` comes along as its only dependency (zero-dependency itself). `astro` is a peer dependency (you already have it).

## Configure

Add the integration — one line:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import aeoImage from "astro-aeo-image";

export default defineConfig({
  integrations: [
    aeoImage(), // or aeoImage({ useAltAsDescription: false })
  ],
});
```

<details>
<summary>Advanced: use the image service directly (without the integration)</summary>

```js
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  image: {
    service: {
      entrypoint: "astro-aeo-image/service",
      config: { useAltAsDescription: true },
    },
  },
});
```

The integration is just a thin wrapper that sets this for you and forwards options.
</details>

That's it. Every `<Image />` you already have now ships its `alt` inside the file:

```astro
---
import { Image } from "astro:assets";
import barn from "../assets/barn.jpg";
---
<Image src={barn} alt="A weathered red barn under a violet dusk sky in rural Vermont" width={1200} height={800} />
```

The generated `dist/_astro/barn.*.webp` now contains:
- `Iptc4xmpCore:AltTextAccessibility` = the alt text
- `dc:description` = the alt text (unless `useAltAsDescription: false`)

## Optional richer metadata

Pass extra props on `<Image>` for fuller AEO signals (distinct SEO description, keywords, title):

```astro
<Image
  src={barn}
  alt="A weathered red barn at dusk"
  description="A restored 1890s dairy barn in Vermont, now a working agrivoltaics site"
  keywords={["barn", "vermont", "agrivoltaics", "rural"]}
  title="Vermont Agrivoltaics Barn"
  width={1200} height={800}
/>
```

| Prop | XMP field |
| --- | --- |
| `alt` (required by Astro) | `Iptc4xmpCore:AltTextAccessibility` (+ `dc:description`) |
| `description` | `dc:description` |
| `keywords` (array or comma string) | `dc:subject` |
| `title` | `dc:title` |
| `creator` | `dc:creator` |
| `credit` | `photoshop:Credit` |
| `rights` | `dc:rights` |
| `copyrightNotice` | `photoshop:Copyright` |
| `licenseUrl` | `xmpRights:WebStatement` — *Google Licensable* |
| `licensor` `{url, name?}` (or flat `licensorUrl`/`licensorName`) | IPTC PLUS `plus:Licensor` — *Google "Get this image" link* |

### Make images Licensable in Google

The last fields implement what [Google Images reads for the **Licensable** badge](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata):

```astro
<Image
  src={barn}
  alt="A weathered red barn at dusk"
  creator="Jane Doe"
  copyrightNotice="© 2026 Example Studio"
  licenseUrl="https://example.com/license/barn"
  licensorUrl="https://example.com/buy/barn"
  width={1200} height={800}
/>
```

For TypeScript autocomplete on the custom props, augment Astro's image props in `src/env.d.ts`:

```ts
declare namespace Astro {
  interface CustomImageProps {
    description?: string;
    keywords?: string[] | string;
    title?: string;
  }
}
```

## Supported formats

Whatever you output from Astro: **WebP, AVIF, JPEG, PNG** (via `aeo-image`). SVG/GIF and any format `aeo-image` doesn't handle are passed through untouched — the service degrades gracefully and **never fails a build over metadata**.

## Standards

Metadata is written as **Adobe XMP** (not legacy IPTC-IIM), conforming to the [IPTC Photo Metadata Standard 2025.1](https://iptc.org/standards/photo-metadata/iptc-standard/) (descriptive + accessibility + rights/licensing subset) plus Dublin Core, Adobe, and PLUS namespaces — see [`aeo-image`'s conformance notes](https://github.com/vsima/aeo-image#standards--conformance). The 2025.1 AI-generation provenance properties are not yet implemented.

## Verifying it worked

Given `<Image alt="A weathered red barn under a violet dusk sky in rural Vermont" />`, the built file gains embedded metadata:

```console
$ exiftool dist/_astro/barn.abc123.webp | grep -iE "description|alt"
# ── before (default Astro service) ──
#   (no metadata)

# ── after (astro-aeo-image) ──
Description                     : A weathered red barn under a violet dusk sky in rural Vermont
Alt Text Accessibility          : A weathered red barn under a violet dusk sky in rural Vermont
```

Or check it programmatically:

```bash
node -e "import('aeo-image').then(async m=>{const {readFileSync}=await import('node:fs');console.log(m.readMetadata(new Uint8Array(readFileSync(process.argv[1]))))})" dist/_astro/<your-image>.webp
# → { description: '…', altText: '…' }
```

The pixels are untouched — only a metadata block is added.

## Status & scope

- The metadata-embedding core is unit-tested against the published `aeo-image`.
- On **static builds**, Astro passes `<Image>` props (including `alt`) to the service's `transform`, which is where embedding happens. For **on-demand/SSR** image endpoints, the custom props are included in `propertiesToHash` so they survive into `transform`; if you rely on SSR image optimization, please smoke-test and [open an issue](https://github.com/vsima/astro-aeo-image/issues) with your Astro version if a prop doesn't come through.
- Wraps `astro/assets/services/sharp`. If you use a different image service, this won't layer on top of it.

## License

MIT
