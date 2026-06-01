import type { LocalImageService } from "astro";
// Astro's built-in sharp service. We wrap it rather than reimplement encoding.
import sharpService from "astro/assets/services/sharp";
import { embedMetadata, type AeoImageOptions, type DescriptiveProps } from "./embed.ts";

/**
 * The Astro **image service** — a drop-in replacement for the default sharp
 * service that ALSO embeds `<Image>` alt text (and optional description/
 * keywords/title) as XMP into each optimized output file.
 *
 * Most users should use the integration instead (`integrations: [aeoImage()]`),
 * which wires this up automatically. This module is the entrypoint that the
 * integration points `image.service.entrypoint` at, and is also usable directly
 * for advanced setups:
 *
 *   image: { service: { entrypoint: "astro-aeo-image/service" } }
 *
 * Everything sharp does is unchanged (sizes, formats, quality). After sharp
 * encodes each variant, we splice descriptive XMP into the bytes — no
 * re-encode, no pixel change.
 */

const base = sharpService as LocalImageService;

const service: LocalImageService = {
  ...base,

  // Ensure descriptive props survive into transform() on the on-demand/SSR
  // path (static builds already pass full options through).
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
