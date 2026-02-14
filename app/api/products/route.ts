import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProductModel } from "@/lib/models/Product";

// Remove Vietnamese diacritics
function removeVietnameseTones(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

// GET /api/products — list all or search
export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q");
        const since = searchParams.get("since"); // timestamp for sync

        let query = {};

        if (since) {
            query = { updatedAt: { $gt: Number(since) } };
        } else if (q) {
            const normalizedQ = removeVietnameseTones(q);
            query = {
                $or: [
                    { barcode: q },
                    { search_slug: { $regex: normalizedQ, $options: "i" } },
                ],
            };
        }

        const products = await ProductModel.find(query)
            .sort({ updatedAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json({ products, count: products.length });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST /api/products — create new product
export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();

        const { barcode, name, prices, unit, location, image } = body;

        if (!barcode || !name || !prices?.retail) {
            return NextResponse.json(
                { error: "Thiếu thông tin: barcode, name, prices.retail là bắt buộc" },
                { status: 400 }
            );
        }

        const searchSlug = `${removeVietnameseTones(name)} ${barcode}`;

        const updateData: Record<string, unknown> = {
            barcode,
            name,
            search_slug: searchSlug,
            prices: {
                retail: Number(prices.retail),
                wholesale: Number(prices.wholesale) || Number(prices.retail),
            },
            unit: unit || "Cái",
            location: location || "Chưa xác định",
            updatedAt: Date.now(),
        };

        if (image) {
            updateData.image = image;
        }

        const product = await ProductModel.findOneAndUpdate(
            { barcode },
            updateData,
            { upsert: true, new: true, lean: true }
        );

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
