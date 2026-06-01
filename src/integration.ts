import type { AstroIntegration } from "astro";
import type { AeoImageOptions } from "./embed.ts";

/**
 * The Astro **integration** — the one-line way to use astro-aeo-image.
 *
 *   import { defineConfig } from "astro/config";
 *   import aeoImage from "astro-aeo-image";
 *
 *   export default defineConfig({
 *     integrations: [aeoImage()],            // embeds <Image> alt as XMP
 *   });
 *
 * It points Astro's image service at our sharp-wrapping service and forwards
 * any options. Everything sharp does is unchanged; after each variant is
 * encoded, the descriptive metadata is spliced in (byte-preserving).
 */
export default function aeoImage(options: AeoImageOptions = {}): AstroIntegration {
  return {
    name: "astro-aeo-image",
    hooks: {
      "astro:config:setup": ({ updateConfig, config, logger }) => {
        const existing = config.image?.service?.entrypoint;
        if (existing && existing !== "astro/assets/services/sharp") {
          logger.warn(
            `A custom image service (${existing}) is already configured. ` +
              `astro-aeo-image wraps the default sharp service and will override it. ` +
              `If you need both, configure the service entrypoint manually instead.`,
          );
        }
        updateConfig({
          image: {
            service: {
              entrypoint: "astro-aeo-image/service",
              config: options,
            },
          },
        });
        logger.info("Embedding <Image> alt text as XMP into optimized output.");
      },
    },
  };
}
