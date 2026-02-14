import Dexie, { type EntityTable } from "dexie";

export interface Product {
    id?: number;
    barcode: string;
    name: string;
    searchSlug: string;
    prices: {
        retail: number;
        wholesale: number;
    };
    unit: string;
    location: string;
    image?: string;
    updatedAt: number;
}

export interface HistoryEntry {
    id?: number;
    barcode: string;
    productName: string;
    retailPrice: number;
    timestamp: number;
}

export interface FavoriteEntry {
    id?: number;
    barcode: string;
    addedAt: number;
}

const db = new Dexie("SpeedPriceDB") as Dexie & {
    products: EntityTable<Product, "id">;
    history: EntityTable<HistoryEntry, "id">;
    favorites: EntityTable<FavoriteEntry, "id">;
};

db.version(2).stores({
    products: "++id, &barcode, searchSlug, updatedAt",
    history: "++id, barcode, timestamp",
    favorites: "++id, &barcode, addedAt",
});

export { db };
