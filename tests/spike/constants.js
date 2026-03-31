// File Created - YAN WEIDONG A0258151H

export const BASE_URL = __ENV.BASE_URL || "http://localhost:6060/api/v1";

// Acceptable response range multiplier to be considered "recovered" (x times baseline latency)
export const RECOVERY_TOLERANCE = 1.5;
// Number of consecutive stable requests required for recovery
export const STABILITY_THRESHOLD = 5;

// Phase timing boundaries (in seconds)
export const BASELINE_START = 10;
export const BASELINE_END = 70;
export const SPIKE_END = 140;

// Based on sample-db-schema/test.products.spike-test.json
export const PRODUCT_SLUGS = [
  "gaming-laptop-pro",
  "wireless-mouse",
  "mechanical-keyboard",
  "4k-monitor",
  "noise-cancelling-headphones",
  "bluetooth-speaker",
  "tablet-pro",
  "smartphone-ultra",
  "usb-c-hub",
  "hdmi-cable-2m",
  "python-programming-guide",
  "javascript-mastery",
  "data-science-handbook",
  "cloud-computing-essentials",
  "algorithm-design-manual",
  "cotton-t-shirt-blue",
  "denim-jeans-classic",
  "hoodie-premium-black",
  "running-shoes",
  "backpack-large",
  "web-development-complete",
  "webcam-hd",
  "external-ssd-1tb",
  "wireless-charger",
  "microeconomics-textbook",
  "physics-fundamentals",
  "business-strategy-book",
  "graphic-design-novel",
  "mystery-novel-collection",
  "polo-shirt-white",
  "winter-jacket",
  "sports-shorts",
  "formal-shirt-grey",
  "sneakers-sport",
  "smart-watch",
  "desk-lamp-led",
  "router-wifi-6",
  "power-bank-20000mah",
  "machine-learning-basics",
  "cardigan-sweater",
  "camera-dslr",
  "drone-with-camera",
  "cookbook-healthy-meals",
  "smartwatch-band",
  "gaming-headset-rgb",
  "yoga-mat-premium",
  "water-bottle-steel",
  "laptop-stand-aluminum",
  "finance-management-book",
  "tablet-case",
  "screen-protector",
];

export const SEARCH_KEYWORDS = [
  "laptop",
  "phone",
  "headphones",
  "tablet",
  "book",
  "shirt",
  "mouse",
  "keyboard",
];

// Based on sample-db-schema/test.categories.json
export const CATEGORY_SLUGS = [
  "electronics",
  "book",
  "clothing",
];