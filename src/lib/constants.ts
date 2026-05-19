export const APP_NAME = "Findora";
export const APP_DESCRIPTION = "Campus Lost & Found Platform";

export const ITEM_CATEGORIES = [
  "electronics",
  "clothing",
  "accessories",
  "books",
  "keys",
  "bag",
  "stationery",
  "sports",
  "wallet",
  "id_card",
  "other",
] as const;

export const MAX_ITEM_IMAGES = 5;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const RATE_LIMIT_ITEMS_PER_HOUR = 3;
export const MESSAGE_MAX_LENGTH = 2000;

export const BOTTOM_NAV_HEIGHT = 64;
export const SIDEBAR_WIDTH = 240;
