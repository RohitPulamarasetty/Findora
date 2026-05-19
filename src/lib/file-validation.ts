import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "./constants";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB`,
    };
  }

  return { valid: true };
}
