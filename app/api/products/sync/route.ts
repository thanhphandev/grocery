import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProductModel } from "@/lib/models/Product";

// POST /api/products/sync — sync local data up to MongoDB
export async function POST(request: Request) {
    try {
        await connectDB();
        const { products } = await request.json();

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json(
                { error: "Cần truyền mảng products" },
                { status: 400 }
            );
        }

        interface SyncProduct {
            barcode: string;
            name: string;
            searchSlug?: string;
            search_slug?: string;
            prices: { retail: number; wholesale: number };
            unit: string;
            location: string;
            image?: string;
            updatedAt?: number;
        }

        const operations = products.map((p: SyncProduct) => ({
            updateOne: {
                filter: { barcode: p.barcode },
                update: {
                    $set: {
                        barcode: p.barcode,
                        name: p.name,
                        search_slug: String(p.searchSlug || p.search_slug || ""),
                        prices: p.prices,
                        unit: p.unit,
                        location: p.location,
                        ...(p.image ? { image: p.image } : {}),
                        updatedAt: p.updatedAt || Date.now(),
                    },
                },
                upsert: true,
            },
        }));

        // biome-ignore lint/suspicious/noExplicitAny: Mongoose bulkWrite generic mismatch
        const result = await ProductModel.bulkWrite(operations as any);

        return NextResponse.json({
            synced: result.upsertedCount + result.modifiedCount,
            message: `Đã đồng bộ ${result.upsertedCount + result.modifiedCount} sản phẩm`,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// GET /api/products/sync?since=timestamp — pull changes from MongoDB
export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const since = searchParams.get("since") || "0";

        const products = await ProductModel.find({
            updatedAt: { $gt: Number(since) },
        })
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({
            products,
            count: products.length,
            serverTime: Date.now(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
