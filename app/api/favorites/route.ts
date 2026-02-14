import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FavoriteModel } from "@/lib/models/Favorite";
import { ProductModel } from "@/lib/models/Product";

// GET /api/favorites — check if favorite or list all favorites
export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const list = searchParams.get("list");

        // Check single favorite
        if (productId) {
            const fav = await FavoriteModel.findOne({ productId }).lean();
            return NextResponse.json({ isFavorite: !!fav });
        }

        // List all favorites with product data
        if (list) {
            const favorites = await FavoriteModel.find()
                .sort({ addedAt: -1 })
                .lean();

            const productIds = favorites.map((f) => f.productId);
            const products = await ProductModel.find({
                _id: { $in: productIds },
            }).lean();

            // Maintain favorites order
            const productMap = new Map(
                products.map((p) => [String(p._id), p])
            );
            const ordered = productIds
                .map((id) => productMap.get(id))
                .filter(Boolean);

            return NextResponse.json({ products: ordered });
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST /api/favorites — toggle favorite
export async function POST(request: Request) {
    try {
        await connectDB();
        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json(
                { error: "productId là bắt buộc" },
                { status: 400 }
            );
        }

        const existing = await FavoriteModel.findOne({ productId });
        if (existing) {
            await FavoriteModel.deleteOne({ _id: existing._id });
            return NextResponse.json({ isFavorite: false });
        }

        await FavoriteModel.create({ productId, addedAt: Date.now() });
        return NextResponse.json({ isFavorite: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
