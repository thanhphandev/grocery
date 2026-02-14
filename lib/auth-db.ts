import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI chưa được cấu hình. Thêm vào file .env.local");
}

// Global cache to reuse the client across hot-reloads in dev
declare global {
    // biome-ignore lint/no-var: global cache
    var _mongoClient: MongoClient | undefined;
}

const client: MongoClient =
    global._mongoClient ?? new MongoClient(MONGODB_URI);

if (process.env.NODE_ENV !== "production") {
    global._mongoClient = client;
}

export const db = client.db();
