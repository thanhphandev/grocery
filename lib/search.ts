import { db, type Product, type HistoryEntry, type FavoriteEntry } from "./db";

function removeVietnameseTones(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

export function generateSearchSlug(name: string, barcode: string): string {
    return `${removeVietnameseTones(name)} ${barcode}`;
}

// ─── SEARCH (OPTIMIZED) ─────────────────────────────────

// In-memory search cache for instant results
let _cachedProducts: Product[] | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds

async function getProductsFromCache(): Promise<Product[]> {
    const now = Date.now();
    if (_cachedProducts && now - _cacheTimestamp < CACHE_TTL) {
        return _cachedProducts;
    }
    _cachedProducts = await db.products.toArray();
    _cacheTimestamp = now;
    return _cachedProducts;
}

export function invalidateCache(): void {
    _cachedProducts = null;
    _cacheTimestamp = 0;
}

export async function fastSearch(query: string): Promise<Product[]> {
    const trimmed = query.trim();

    // Empty query: show recent 30
    if (!trimmed) {
        return db.products.orderBy("updatedAt").reverse().limit(30).toArray();
    }

    // Pure barcode number: instant indexed lookup
    if (/^\d{4,}$/.test(trimmed)) {
        const exact = await db.products.where("barcode").equals(trimmed).first();
        if (exact) return [exact];

        // Partial barcode match
        const products = await getProductsFromCache();
        return products
            .filter((p) => p.barcode.includes(trimmed))
            .slice(0, 20);
    }

    // Text search: use cached products for speed
    const normalizedQuery = removeVietnameseTones(trimmed);
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    const products = await getProductsFromCache();

    // Score-based ranking
    const scored: { product: Product; score: number }[] = [];

    for (const p of products) {
        let score = 0;

        // Exact slug match
        if (p.searchSlug.includes(normalizedQuery)) {
            score += 10;
        }

        // Starts with bonus
        if (p.searchSlug.startsWith(normalizedQuery)) {
            score += 20;
        }

        // Multi-word: all words must match
        if (words.length > 1) {
            const allMatch = words.every((w) => p.searchSlug.includes(w));
            if (allMatch) score += 15;
            else if (score === 0) continue;
        }

        // Barcode contains
        if (p.barcode.includes(trimmed)) {
            score += 5;
        }

        if (score > 0) {
            scored.push({ product: p, score });
        }
    }

    // Sort by score descending, limit to 30
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 30).map((s) => s.product);
}

// ─── CRUD ────────────────────────────────────────────────

export async function addProduct(
    product: Omit<Product, "id" | "searchSlug" | "updatedAt">
): Promise<Product> {
    const newProduct: Omit<Product, "id"> = {
        ...product,
        searchSlug: generateSearchSlug(product.name, product.barcode),
        updatedAt: Date.now(),
    };
    const id = await db.products.add(newProduct);
    const saved = { ...newProduct, id: id as number };

    invalidateCache();
    syncProductToServer(saved).catch(() => { });
    return saved;
}

export async function updateProduct(
    barcode: string,
    updates: Partial<Omit<Product, "id" | "searchSlug">>
): Promise<void> {
    const existing = await db.products.where("barcode").equals(barcode).first();
    if (!existing?.id) return;

    const updatedData = {
        ...updates,
        updatedAt: Date.now(),
        ...(updates.name
            ? { searchSlug: generateSearchSlug(updates.name, barcode) }
            : {}),
    };
    await db.products.update(existing.id, updatedData);
    invalidateCache();
    syncProductToServer({ ...existing, ...updatedData }).catch(() => { });
}

export async function deleteProduct(barcode: string): Promise<void> {
    await db.products.where("barcode").equals(barcode).delete();
    invalidateCache();
    fetch(`/api/products/${barcode}`, { method: "DELETE" }).catch(() => { });
}

export async function getProductByBarcode(
    barcode: string
): Promise<Product | undefined> {
    const local = await db.products.where("barcode").equals(barcode).first();
    if (local) return local;

    try {
        const res = await fetch(`/api/products?q=${barcode}`);
        if (res.ok) {
            const data = await res.json();
            if (data.products?.length > 0) {
                const p = data.products[0];
                const product: Omit<Product, "id"> = {
                    barcode: p.barcode,
                    name: p.name,
                    searchSlug: p.search_slug || generateSearchSlug(p.name, p.barcode),
                    prices: p.prices,
                    unit: p.unit,
                    location: p.location,
                    image: p.image,
                    updatedAt: p.updatedAt,
                };
                await db.products.add(product);
                invalidateCache();
                return db.products.where("barcode").equals(barcode).first();
            }
        }
    } catch {
        // offline
    }
    return undefined;
}

// ─── HISTORY ─────────────────────────────────────────────

export async function addHistory(product: Product): Promise<void> {
    await db.history.add({
        barcode: product.barcode,
        productName: product.name,
        retailPrice: product.prices.retail,
        timestamp: Date.now(),
    });

    // Keep only last 100 entries
    const count = await db.history.count();
    if (count > 100) {
        const oldest = await db.history.orderBy("timestamp").limit(count - 100).toArray();
        const ids = oldest.map((h) => h.id).filter((id): id is number => id !== undefined);
        await db.history.bulkDelete(ids);
    }
}

export async function getHistory(): Promise<(HistoryEntry & { product?: Product })[]> {
    const entries = await db.history.orderBy("timestamp").reverse().limit(50).toArray();
    const results: (HistoryEntry & { product?: Product })[] = [];
    for (const entry of entries) {
        const product = await db.products.where("barcode").equals(entry.barcode).first();
        results.push({ ...entry, product });
    }
    return results;
}

export async function clearHistory(): Promise<void> {
    await db.history.clear();
}

// ─── FAVORITES ───────────────────────────────────────────

export async function toggleFavorite(barcode: string): Promise<boolean> {
    const existing = await db.favorites.where("barcode").equals(barcode).first();
    if (existing?.id) {
        await db.favorites.delete(existing.id);
        return false;
    }
    await db.favorites.add({ barcode, addedAt: Date.now() });
    return true;
}

export async function isFavorite(barcode: string): Promise<boolean> {
    const entry = await db.favorites.where("barcode").equals(barcode).first();
    return !!entry;
}

export async function getFavorites(): Promise<Product[]> {
    const entries = await db.favorites.orderBy("addedAt").reverse().toArray();
    const products: Product[] = [];
    for (const entry of entries) {
        const product = await db.products.where("barcode").equals(entry.barcode).first();
        if (product) products.push(product);
    }
    return products;
}

// ─── SYNC ────────────────────────────────────────────────

async function syncProductToServer(product: Product): Promise<void> {
    await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            barcode: product.barcode,
            name: product.name,
            prices: product.prices,
            unit: product.unit,
            location: product.location,
            image: product.image,
        }),
    });
}

export async function fullSync(): Promise<{ pushed: number; pulled: number }> {
    let pushed = 0;
    let pulled = 0;

    try {
        const localProducts = await db.products.toArray();
        if (localProducts.length > 0) {
            const res = await fetch("/api/products/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: localProducts }),
            });
            if (res.ok) {
                const data = await res.json();
                pushed = data.synced || 0;
            }
        }

        const pullRes = await fetch("/api/products/sync?since=0");
        if (pullRes.ok) {
            const data = await pullRes.json();
            if (data.products?.length > 0) {
                for (const p of data.products) {
                    const existing = await db.products.where("barcode").equals(p.barcode).first();
                    const product: Omit<Product, "id"> = {
                        barcode: p.barcode,
                        name: p.name,
                        searchSlug: p.search_slug || generateSearchSlug(p.name, p.barcode),
                        prices: p.prices,
                        unit: p.unit,
                        location: p.location,
                        image: p.image,
                        updatedAt: p.updatedAt,
                    };
                    if (existing?.id) {
                        if (p.updatedAt > (existing.updatedAt || 0)) {
                            await db.products.update(existing.id, product);
                            pulled++;
                        }
                    } else {
                        await db.products.add(product);
                        pulled++;
                    }
                }
                invalidateCache();
            }
        }
    } catch {
        // offline
    }

    return { pushed, pulled };
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("vi-VN").format(price);
}
