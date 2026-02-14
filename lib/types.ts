// ─── Shared types — Single source of truth ──────────────
// MongoDB is the ONLY data store. No local IndexedDB.

export interface Product {
    _id?: string;
    barcode?: string;
    name: string;
    searchSlug: string;
    prices: {
        retail: number;
        wholesale: number;
    };
    unit: string;
    location?: string;
    image?: string;
    updatedAt: number;
}
