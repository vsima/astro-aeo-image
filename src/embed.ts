import { writeMetadata, detectFormat, type ImageMetadata } from "aeo-image";

/**
 * The pure, framework-agnostic core: given an encoded image buffer and the
 * descriptive props Astro already holds, embed them as XMP — byte-preserving,
 * no re-encode. Kept separate from the Astro wiring so it can be unit-tested
 * without an Astro build.
 *
 * Design note — *authoring*, not *preserving*: sharp's `keepMetadata` can carry
 * through metadata that already exists in a source file, but it can't compose a
 * new descriptive packet from application data. Astro's `<Image>` REQUIRES an
 * `alt`, yet that text normally lives only in the HTML attribute. This writes it
 * into the file itself, where Google Images and AI answer engines can read it.
 */

export interface AeoImageOptions {
  /** Map the component's `alt` to dc:description as well as alt text. Default true. */
  useAltAsDescription?: boolean;
  /** Embed even when no descriptive text is available (writes an empty packet). Default false. */
  embedWhenEmpty?: boolean;
}

/** Astro passes the user's `<Image>` props here; we read the descriptive ones. */
export interface DescriptiveProps {
  alt?: unknown;
  /** Optional custom prop: an SEO/AEO description distinct from accessibility alt. */
  description?: unknown;
  /** Optional custom prop: keyword list (array or comma-separated string). */
  keywords?: unknown;
  /** Optional custom prop: title. */
  title?: unknown;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function keywordList(v: unknown): string[] | undefined {
  if (Array.isArray(v)) {
    const out = v.map(String).map((s) => s.trim()).filter(Boolean);
    return out.length ? out : undefined;
  }
  const s = str(v);
  if (!s) return undefined;
  const out = s.split(",").map((p) => p.trim()).filter(Boolean);
  return out.length ? out : undefined;
}

/** Build the semantic metadata object from Astro props. Returns null if nothing to write. */
export function metadataFromProps(
  props: DescriptiveProps,
  opts: AeoImageOptions = {},
): ImageMetadata | null {
  const { useAltAsDescription = true } = opts;
  const alt = str(props.alt);
  const description = str(props.description) ?? (useAltAsDescription ? alt : undefined);

  const meta: ImageMetadata = {};
  if (alt) meta.altText = alt;
  if (description) meta.description = description;
  const title = str(props.title);
  if (title) meta.title = title;
  const keywords = keywordList(props.keywords);
  if (keywords) meta.keywords = keywords;

  return Object.keys(meta).length > 0 ? meta : null;
}

/**
 * Embed descriptive XMP into an encoded image buffer.
 * Returns the original buffer untouched when there's nothing to write or the
 * format isn't supported by aeo-image (so the service degrades gracefully).
 */
export function embedMetadata(
  data: Uint8Array,
  props: DescriptiveProps,
  opts: AeoImageOptions = {},
): Uint8Array {
  const meta = metadataFromProps(props, opts);
  if (!meta && !opts.embedWhenEmpty) return data;
  if (detectFormat(data) === "unknown") return data; // e.g. SVG/GIF — leave as-is
  try {
    return writeMetadata(data, meta ?? {});
  } catch {
    // Never break a build over metadata; fall back to the original bytes.
    return data;
  }
}
