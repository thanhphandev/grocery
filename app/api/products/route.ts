import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProductModel } from "@/lib/models/Product";
import { removeVietnameseTones, escapeRegex, buildSearchSlug } from "@/lib/utils";

// GET /api/products — search / list products
export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q") || "";
        const exact = searchParams.get("exact");
        const sortParam = searchParams.get("sort") || "newest";
        const trimmed = q.trim();

        let sort: Record<string, 1 | -1> = { updatedAt: -1 };
        switch (sortParam) {
            case "price_asc": sort = { "prices.retail": 1 }; break;
            case "price_desc": sort = { "prices.retail": -1 }; break;
            case "name_asc": sort = { name: 1 }; break;
            default: sort = { updatedAt: -1 }; break;
        }

        // Empty query → return recent 30 products
        if (!trimmed) {
            const total = await ProductModel.countDocuments();
            const products = await ProductModel.find()
                .sort(sort)
                .limit(30)
                .lean();
            return NextResponse.json({ products, total });
        }

        // Exact barcode lookup
        if (exact && /^\d{4,}$/.test(trimmed)) {
            const product = await ProductModel.findOne({ barcode: trimmed }).lean();
            return NextResponse.json({
                products: product ? [product] : [],
                total: product ? 1 : 0,
            });
        }

        // Smart search: barcode + text
        const normalizedQ = removeVietnameseTones(trimmed);
        const words = normalizedQ.split(/\s+/).filter(Boolean);

        const regexPattern = words.length > 1
            ? words.map((w) => `(?=.*${escapeRegex(w)})`).join("") + ".*"
            : escapeRegex(normalizedQ);

        const query = {
            $or: [
                { barcode: trimmed },
                { barcode: { $regex: escapeRegex(trimmed) } },
                { search_slug: { $regex: regexPattern, $options: "i" } },
            ],
        };

        const [total, products] = await Promise.all([
            ProductModel.countDocuments(query),
            ProductModel.find(query)
                .sort(sort)
                .limit(30)
                .lean(),
        ]);

        return NextResponse.json({ products, total });
    } catch (error) {
        return apiError(error);
    }
}

// POST /api/products — create new product (barcode optional)
export async function POST(request: Request) {
    try {
        await connectDB();
        const { barcode, name, prices, unit, location, image } = await request.json();

        if (!name || !prices?.retail) {
            return NextResponse.json(
                { error: "Thiếu thông tin: name và prices.retail là bắt buộc" },
                { status: 400 }
            );
        }

        const productData: Record<string, unknown> = {
            name,
            search_slug: buildSearchSlug(name, barcode),
            prices: {
                retail: Number(prices.retail),
                wholesale: Number(prices.wholesale) || Number(prices.retail),
            },
            unit: unit || "Cái",
            updatedAt: Date.now(),
        };

        if (barcode) productData.barcode = barcode;
        if (location?.trim()) productData.location = location.trim();
        if (image) productData.image = image;

        // Upsert by barcode if provided, otherwise create new doc
        const product = barcode
            ? await ProductModel.findOneAndUpdate({ barcode }, productData, {
                upsert: true,
                new: true,
                lean: true,
            })
            : (await ProductModel.create(productData)).toObject();

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        return apiError(error);
    }
}

// ─── Shared error helper ─────────────────────────────────

function apiError(error: unknown, status = 500) {
    const message = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ error: message }, { status });
}
