import type { LocalImageService } from "astro";
// Astro's built-in sharp service. We wrap it rather than reimplement encoding.
import sharpService from "astro/assets/services/sharp";
import { embedMetadata, type AeoImageOptions, type DescriptiveProps } from "./embed.ts";

/**
 * astro-aeo-image — a drop-in replacement for Astro's default image service
 * that ALSO embeds the `<Image>` alt text (and optional description/keywords)
 * as standards XMP into each optimized output file.
 *
 * Configure in astro.config.mjs:
 *
 *   import { defineConfig } from "astro/config";
 *   export default defineConfig({
 *     image: { service: { entrypoint: "astro-aeo-image" } },
 *   });
 *
 * Everything sharp does is unchanged (sizes, formats, quality). After sharp
 * encodes each variant, we splice descriptive XMP into the bytes — no
 * re-encode, no pixel change. The compressed image is byte-identical; only a
 * metadata block is added.
 *
 * Note on prop propagation: during a static build Astro calls `transform` with
 * the user's options, which include `alt`. We also expose optional custom props
 * (`description`, `keywords`, `title`) — see README for the `propertiesToHash`
 * note for on-demand/SSR usage.
 */

const base = sharpService as LocalImageService;

const service: LocalImageService = {
  ...base,

  // Ensure our descriptive props survive into transform() on the on-demand/SSR
  // path (the static build path already passes full options through).
  propertiesToHash: [
    ...(base.propertiesToHash ?? ["src", "width", "height", "format", "quality"]),
    "alt",
    "description",
    "keywords",
    "title",
  ],

  async transform(inputBuffer, options, imageConfig) {
    const { data, format } = await base.transform(inputBuffer, options, imageConfig);
    const opts = (imageConfig as { service?: { config?: AeoImageOptions } })?.service?.config ?? {};
    const tagged = embedMetadata(data, options as DescriptiveProps, opts);
    return { data: tagged, format };
  },
};

export default service;

export type { AeoImageOptions } from "./embed.ts";
export { embedMetadata, metadataFromProps } from "./embed.ts";
