/**
 * astro-aeo-image — embed <Image> alt text as XMP into optimized output files.
 *
 * Default export is the Astro **integration** (recommended):
 *   import aeoImage from "astro-aeo-image";
 *   export default defineConfig({ integrations: [aeoImage()] });
 *
 * The image **service** is also available directly for advanced setups:
 *   import { defineConfig } from "astro/config";
 *   export default defineConfig({
 *     image: { service: { entrypoint: "astro-aeo-image/service" } },
 *   });
 */
export { default } from "./integration.ts";
export { default as imageService } from "./service.ts";
export type { AeoImageOptions, DescriptiveProps } from "./embed.ts";
export { embedMetadata, metadataFromProps } from "./embed.ts";
