import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { HistoryModel } from "@/lib/models/History";
import { ProductModel } from "@/lib/models/Product";

// GET /api/history — get recent history with product data
export async function GET() {
    try {
        await connectDB();
        const entries = await HistoryModel.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        // Batch load products for all history entries
        const productIds = [...new Set(entries.map((e) => e.productId))];
        const products = await ProductModel.find({
            _id: { $in: productIds },
        }).lean();

        const productMap = new Map(
            products.map((p) => [String(p._id), p])
        );

        const enriched = entries.map((entry) => ({
            ...entry,
            _id: String(entry._id),
            product: productMap.get(entry.productId) || undefined,
        }));

        return NextResponse.json({ entries: enriched });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST /api/history — add a history entry
export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();

        await HistoryModel.create({
            productId: body.productId,
            barcode: body.barcode || undefined,
            productName: body.productName,
            retailPrice: body.retailPrice,
            timestamp: Date.now(),
        });

        // Keep only last 100 entries
        const count = await HistoryModel.countDocuments();
        if (count > 100) {
            const oldest = await HistoryModel.find()
                .sort({ timestamp: 1 })
                .limit(count - 100)
                .select("_id")
                .lean();
            const ids = oldest.map((h) => h._id);
            await HistoryModel.deleteMany({ _id: { $in: ids } });
        }

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/history — clear all history
export async function DELETE() {
    try {
        await connectDB();
        await HistoryModel.deleteMany({});
        return NextResponse.json({ message: "Đã xóa lịch sử" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
