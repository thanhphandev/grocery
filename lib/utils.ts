import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Remove Vietnamese diacritical marks for search normalization.
 * Shared across client and server — the ONLY copy.
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Build a search_slug from product name + optional barcode.
 */
export function buildSearchSlug(name: string, barcode?: string): string {
  const slug = removeVietnameseTones(name);
  return barcode ? `${slug} ${barcode}` : slug;
}

/**
 * Escape regex special characters in a string.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Format price to Vietnamese locale string (e.g. 25.000).
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price);
}
