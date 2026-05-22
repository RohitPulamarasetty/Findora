/**
 * Magic-byte sniffing for image uploads.
 *
 * The multipart `Content-Type` header is attacker-controlled. Without
 * verifying the file's actual signature, an attacker can upload a
 * non-image (HTML, SVG with embedded script, EXE) under
 * `Content-Type: image/jpeg`. This module sniffs the first ~12 bytes
 * and returns the true MIME — or null if it isn't an allowed image
 * format.
 *
 * Allowed formats (must match storage policy in 0009_storage_policies_fix):
 *   - JPEG  ff d8 ff
 *   - PNG   89 50 4e 47 0d 0a 1a 0a
 *   - WebP  52 49 46 46 ?? ?? ?? ?? 57 45 42 50  (RIFF....WEBP)
 *
 * SVG is intentionally excluded — it can carry script.
 */

export type DetectedImageMime = "image/jpeg" | "image/png" | "image/webp";

/** Sniff the file header. Returns the true MIME or null. */
export function detectImageMime(bytes: Uint8Array): DetectedImageMime | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF"....."WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
