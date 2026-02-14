// ─── Client API layer: MongoDB via Next.js API routes ────
// Every operation is online-only. No local storage.

import type { Product } from "./types";
import { formatPrice } from "./utils";

// Re-export for convenience (components import from here)
export { formatPrice };

// ─── SEARCH ──────────────────────────────────────────────

export async function fastSearch(query: string): Promise<Product[]> {
    try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.products || []).map(mapServerProduct);
    } catch {
        return [];
    }
}

// ─── PRODUCT CRUD ────────────────────────────────────────

export async function addProduct(
    product: Omit<Product, "_id" | "searchSlug" | "updatedAt">
): Promise<Product> {
    const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            barcode: product.barcode || undefined,
            name: product.name,
            prices: product.prices,
            unit: product.unit,
            location: product.location || undefined,
            image: product.image,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Lỗi server" }));
        throw new Error(err.error || "Không thể thêm sản phẩm");
    }

    const data = await res.json();
    return mapServerProduct(data.product);
}

export async function updateProduct(
    productId: string,
    updates: Partial<Omit<Product, "_id" | "searchSlug">>
): Promise<void> {
    const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Lỗi server" }));
        throw new Error(err.error || "Không thể cập nhật sản phẩm");
    }
}

export async function deleteProduct(productId: string): Promise<void> {
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Lỗi server" }));
        throw new Error(err.error || "Không thể xóa sản phẩm");
    }
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
    try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(barcode)}&exact=1`);
        if (!res.ok) return undefined;
        const data = await res.json();
        return data.products?.length > 0 ? mapServerProduct(data.products[0]) : undefined;
    } catch {
        return undefined;
    }
}

export async function getProductById(id: string): Promise<Product | undefined> {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) return undefined;
        const data = await res.json();
        return mapServerProduct(data.product);
    } catch {
        return undefined;
    }
}

// ─── HISTORY ─────────────────────────────────────────────

export function addHistory(product: Product): void {
    // Fire-and-forget: don't block UI
    fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            productId: product._id,
            barcode: product.barcode,
            productName: product.name,
            retailPrice: product.prices.retail,
        }),
    }).catch(() => { /* ignore */ });
}

export interface HistoryEntry {
    _id: string;
    productId: string;
    barcode?: string;
    productName: string;
    retailPrice: number;
    timestamp: number;
    product?: Product;
}

export async function getHistory(): Promise<HistoryEntry[]> {
    try {
        const res = await fetch("/api/history");
        if (!res.ok) return [];
        const data = await res.json();
        return data.entries || [];
    } catch {
        return [];
    }
}

export async function clearHistory(): Promise<void> {
    await fetch("/api/history", { method: "DELETE" }).catch(() => { /* ignore */ });
}

// ─── FAVORITES ───────────────────────────────────────────

export async function toggleFavorite(productId: string): Promise<boolean> {
    try {
        const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        return data.isFavorite;
    } catch {
        return false;
    }
}

export async function isFavorite(productId: string): Promise<boolean> {
    try {
        const res = await fetch(`/api/favorites?productId=${productId}`);
        if (!res.ok) return false;
        const data = await res.json();
        return data.isFavorite;
    } catch {
        return false;
    }
}

export async function getFavorites(): Promise<Product[]> {
    try {
        const res = await fetch("/api/favorites?list=1");
        if (!res.ok) return [];
        const data = await res.json();
        return (data.products || []).map(mapServerProduct);
    } catch {
        return [];
    }
}

// ─── INTERNAL ────────────────────────────────────────────

/** Map MongoDB document shape → client Product type */
// biome-ignore lint/suspicious/noExplicitAny: server data is untyped
function mapServerProduct(p: any): Product {
    return {
        _id: String(p._id),
        barcode: p.barcode || undefined,
        name: p.name,
        searchSlug: p.search_slug || p.searchSlug || "",
        prices: p.prices || { retail: 0, wholesale: 0 },
        unit: p.unit || "Cái",
        location: p.location || undefined,
        image: p.image || undefined,
        updatedAt: p.updatedAt || Date.now(),
    };
}
