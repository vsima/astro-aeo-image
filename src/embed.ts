import {
  writeMetadata,
  detectFormat,
  DIGITAL_SOURCE_TYPE,
  type ImageMetadata,
} from "aeo-image";

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
  /** Optional: author/creator. → dc:creator */
  creator?: unknown;
  /** Optional: credit line. → photoshop:Credit */
  credit?: unknown;
  /** Optional: rights statement. → dc:rights */
  rights?: unknown;
  /** Optional: copyright notice. → photoshop:Copyright */
  copyrightNotice?: unknown;
  /** Optional: license/usage-terms URL (Google Licensable). → xmpRights:WebStatement */
  licenseUrl?: unknown;
  /** Optional: where to acquire a license — object form. → IPTC PLUS plus:Licensor */
  licensor?: { url?: unknown; name?: unknown } | unknown;
  /** Optional: flat alternative to `licensor` for ergonomic markup. */
  licensorUrl?: unknown;
  /** Optional: flat alternative to `licensor.name`. */
  licensorName?: unknown;
  /**
   * Optional: IPTC Digital Source Type. Accepts a full IRI or a bare CV term
   * (e.g. "trainedAlgorithmicMedia"). → Iptc4xmpExt:DigitalSourceType
   */
  digitalSourceType?: unknown;
  /**
   * Optional shorthand: `<Image aiGenerated ... />` sets digitalSourceType to
   * trainedAlgorithmicMedia (unless digitalSourceType is given explicitly).
   */
  aiGenerated?: unknown;
  /** Optional: AI-generation provenance (IPTC 2025.1) — object form. */
  ai?:
    | { prompt?: unknown; promptWriter?: unknown; system?: unknown; systemVersion?: unknown }
    | unknown;
  /** Optional: flat alternative to `ai.prompt`. → Iptc4xmpExt:AIPromptInformation */
  aiPrompt?: unknown;
  /** Optional: flat alternative to `ai.promptWriter`. → Iptc4xmpExt:AIPromptWriterName */
  aiPromptWriter?: unknown;
  /** Optional: flat alternative to `ai.system`. → Iptc4xmpExt:AISystemUsed */
  aiSystem?: unknown;
  /** Optional: flat alternative to `ai.systemVersion`. → Iptc4xmpExt:AISystemVersionUsed */
  aiSystemVersion?: unknown;
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

  // Attribution + rights.
  const creator = str(props.creator);
  if (creator) meta.creator = creator;
  const credit = str(props.credit);
  if (credit) meta.credit = credit;
  const rights = str(props.rights);
  if (rights) meta.rights = rights;
  const copyrightNotice = str(props.copyrightNotice);
  if (copyrightNotice) meta.copyrightNotice = copyrightNotice;

  // Google Licensable fields.
  const licenseUrl = str(props.licenseUrl);
  if (licenseUrl) meta.licenseUrl = licenseUrl;

  // licensor: accept object {url,name} or flat licensorUrl/licensorName props.
  const licensorObj = (props.licensor ?? {}) as { url?: unknown; name?: unknown };
  const licensorUrl = str(props.licensorUrl) ?? str(licensorObj.url);
  if (licensorUrl) {
    const licensorName = str(props.licensorName) ?? str(licensorObj.name);
    meta.licensor = licensorName ? { url: licensorUrl, name: licensorName } : { url: licensorUrl };
  }

  // AI-generation provenance (IPTC 2025.1): object `ai` or flat ai* props.
  const aiObj = (props.ai ?? {}) as {
    prompt?: unknown;
    promptWriter?: unknown;
    system?: unknown;
    systemVersion?: unknown;
  };
  const ai: NonNullable<ImageMetadata["ai"]> = {};
  const aiPrompt = str(props.aiPrompt) ?? str(aiObj.prompt);
  if (aiPrompt) ai.prompt = aiPrompt;
  const aiPromptWriter = str(props.aiPromptWriter) ?? str(aiObj.promptWriter);
  if (aiPromptWriter) ai.promptWriter = aiPromptWriter;
  const aiSystem = str(props.aiSystem) ?? str(aiObj.system);
  if (aiSystem) ai.system = aiSystem;
  const aiSystemVersion = str(props.aiSystemVersion) ?? str(aiObj.systemVersion);
  if (aiSystemVersion) ai.systemVersion = aiSystemVersion;
  if (Object.keys(ai).length > 0) meta.ai = ai;

  // digitalSourceType: full IRI, or a bare IPTC CV term we expand. The
  // `aiGenerated` shorthand implies trainedAlgorithmicMedia.
  const dst = str(props.digitalSourceType);
  if (dst) {
    meta.digitalSourceType = dst.includes("://")
      ? dst
      : `http://cv.iptc.org/newscodes/digitalsourcetype/${dst}`;
  } else if (props.aiGenerated === true || str(props.aiGenerated) === "true") {
    meta.digitalSourceType = DIGITAL_SOURCE_TYPE.trainedAlgorithmicMedia;
  }

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
