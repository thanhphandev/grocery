// ─── Cloudinary URL Transformation Helpers ──────────────
// Generate optimized image URLs from Cloudinary to save bandwidth.

/**
 * Given a Cloudinary URL, inject transformation parameters.
 * Falls back to original URL if not a Cloudinary URL.
 *
 * @example
 *   cloudinaryUrl(url, { width: 80, quality: 'auto', format: 'webp' })
 *   // → https://res.cloudinary.com/.../c_fill,w_80,q_auto,f_webp/v.../image.jpg
 */
export function cloudinaryUrl(
  url: string | undefined,
  opts: {
    width?: number;
    height?: number;
    quality?: "auto" | "auto:low" | "auto:eco" | "auto:good" | number;
    format?: "webp" | "avif" | "auto";
    crop?: "fill" | "limit" | "fit" | "thumb";
  } = {},
): string | undefined {
  if (!url) return undefined;

  // Only transform Cloudinary URLs
  if (!url.includes("res.cloudinary.com")) return url;

  const parts: string[] = [];

  // Crop mode
  if (opts.crop || opts.width || opts.height) {
    parts.push(`c_${opts.crop || "fill"}`);
  }
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);

  // Quality
  parts.push(`q_${opts.quality || "auto"}`);

  // Format
  parts.push(`f_${opts.format || "auto"}`);

  // DPR for retina
  if (opts.width && opts.width <= 200) {
    parts.push("dpr_2.0");
  }

  const transform = parts.join(",");

  // Cloudinary URL pattern:
  // https://res.cloudinary.com/<cloud>/image/upload/<existing_transforms>/v<version>/<path>
  // We insert our transforms after "upload/"
  return url.replace(/\/upload\//, `/upload/${transform}/`);
}

/**
 * Pre-configured thumbnail URL (80×80, high compression).
 * For use in product cards and lists.
 */
export function thumbnailUrl(url: string | undefined): string | undefined {
  return cloudinaryUrl(url, {
    width: 80,
    height: 80,
    crop: "fill",
    quality: "auto:eco",
    format: "auto",
  });
}

/**
 * Pre-configured detail image URL (400px wide, good quality).
 * For use in product detail sheets.
 */
export function detailImageUrl(url: string | undefined): string | undefined {
  return cloudinaryUrl(url, {
    width: 400,
    crop: "limit",
    quality: "auto:good",
    format: "auto",
  });
}

/**
 * Tiny blur placeholder (16px wide, very low quality).
 * Used as blurDataURL for next/image shimmer effect.
 */
export function blurPlaceholderUrl(
  url: string | undefined,
): string | undefined {
  return cloudinaryUrl(url, {
    width: 16,
    crop: "fill",
    quality: 10,
    format: "webp",
  });
}
