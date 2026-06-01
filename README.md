# astro-aeo-image

> An Astro image service that embeds your `<Image>` **alt text** (and optional description/keywords) as standards **XMP** directly into the optimized output files — so your `dist/_astro` assets are self-describing for **Google Images** and **AI answer engines** (ChatGPT, Perplexity, Google AI Overviews).

[![npm](https://img.shields.io/npm/v/astro-aeo-image.svg)](https://www.npmjs.com/package/astro-aeo-image)
![license](https://img.shields.io/badge/license-MIT-green)

Astro **already requires** an `alt` on every `<Image />` — but that text normally lives only in the HTML attribute. The moment the page is screenshotted, hot-linked, indexed by Google Images, or ingested by an AI crawler as a *file*, the description is gone. `astro-aeo-image` writes it **into the image bytes**, where it travels with the file.

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

```js
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  image: {
    service: {
      entrypoint: "astro-aeo-image",
      // optional:
      config: {
        useAltAsDescription: true, // also write alt → dc:description (default true)
      },
    },
  },
});
```

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

## Verifying it worked

```bash
npx astro build
exiftool dist/_astro/<your-image>.webp | grep -iE "description|alt"
# or:
node -e "import('aeo-image').then(async m=>{const {readFileSync}=await import('node:fs');console.log(m.readMetadata(new Uint8Array(readFileSync(process.argv[1]))))})" dist/_astro/<your-image>.webp
```

## Status & scope

- The metadata-embedding core is unit-tested against the published `aeo-image`.
- On **static builds**, Astro passes `<Image>` props (including `alt`) to the service's `transform`, which is where embedding happens. For **on-demand/SSR** image endpoints, the custom props are included in `propertiesToHash` so they survive into `transform`; if you rely on SSR image optimization, please smoke-test and [open an issue](https://github.com/vsima/astro-aeo-image/issues) with your Astro version if a prop doesn't come through.
- Wraps `astro/assets/services/sharp`. If you use a different image service, this won't layer on top of it.

## License

MIT
