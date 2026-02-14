import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ProductModel } from "@/lib/models/Product";
import { connectDB } from "@/lib/mongodb";
import {
    buildSearchSlug,
    escapeRegex,
    removeVietnameseTones,
} from "@/lib/utils";

// Projection: only return fields the client needs (reduces payload)
const SEARCH_PROJECTION = {
    barcode: 1,
    name: 1,
    prices: 1,
    unit: 1,
    location: 1,
    image: 1,
    updatedAt: 1,
};

// GET /api/products — search / list products with pagination
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q") || "";
        const exact = searchParams.get("exact");
        const sortParam = searchParams.get("sort") || "newest";
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(
            50,
            Math.max(1, Number(searchParams.get("limit")) || 30),
        );
        const skip = (page - 1) * limit;
        const trimmed = q.trim();

        let sort: Record<string, 1 | -1> = { updatedAt: -1 };
        switch (sortParam) {
            case "price_asc":
                sort = { "prices.retail": 1 };
                break;
            case "price_desc":
                sort = { "prices.retail": -1 };
                break;
            case "name_asc":
                sort = { name: 1 };
                break;
            default:
                sort = { updatedAt: -1 };
                break;
        }

        // Empty query → return recent products with pagination
        if (!trimmed) {
            const [total, products] = await Promise.all([
                ProductModel.countDocuments(),
                ProductModel.find()
                    .select(SEARCH_PROJECTION)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
            ]);
            return apiResponse({ products, total, page, limit });
        }

        // Exact barcode lookup (fast path — uses indexed field)
        if (exact && /^\d{4,}$/.test(trimmed)) {
            const product = await ProductModel.findOne({ barcode: trimmed })
                .select(SEARCH_PROJECTION)
                .lean();
            return apiResponse({
                products: product ? [product] : [],
                total: product ? 1 : 0,
                page: 1,
                limit: 1,
            });
        }

        // ─── Smart search: barcode + text ───────────────────────
        // Pure numeric → prioritize barcode field (indexed, ultra fast)
        const isNumeric = /^\d+$/.test(trimmed);

        if (isNumeric) {
            // Try exact barcode first (fastest path)
            const exactMatch = await ProductModel.findOne({ barcode: trimmed })
                .select(SEARCH_PROJECTION)
                .lean();
            if (exactMatch) {
                return apiResponse({
                    products: [exactMatch],
                    total: 1,
                    page: 1,
                    limit: 1,
                });
            }

            // Partial barcode match
            const query = { barcode: { $regex: `^${escapeRegex(trimmed)}` } };
            const [total, products] = await Promise.all([
                ProductModel.countDocuments(query),
                ProductModel.find(query)
                    .select(SEARCH_PROJECTION)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
            ]);
            if (products.length > 0) {
                return apiResponse({ products, total, page, limit });
            }
        }

        // Text search: normalize Vietnamese and build pattern
        const normalizedQ = removeVietnameseTones(trimmed);
        const words = normalizedQ.split(/\s+/).filter(Boolean);

        // Build efficient regex: each word must appear (lookahead AND)
        const regexPattern =
            words.length > 1
                ? words.map((w) => `(?=.*${escapeRegex(w)})`).join("") + ".*"
                : escapeRegex(normalizedQ);

        const query = {
            $or: [
                ...(isNumeric ? [{ barcode: { $regex: escapeRegex(trimmed) } }] : []),
                { search_slug: { $regex: regexPattern, $options: "i" } },
            ],
        };

        const [total, products] = await Promise.all([
            ProductModel.countDocuments(query),
            ProductModel.find(query)
                .select(SEARCH_PROJECTION)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        return apiResponse({ products, total, page, limit });
    } catch (error) {
        return apiError(error);
    }
}

// POST /api/products — create new product (barcode optional)
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { barcode, name, prices, unit, location, image } =
            await request.json();

        if (!name || !prices?.retail) {
            return NextResponse.json(
                { error: "Thiếu thông tin: name và prices.retail là bắt buộc" },
                { status: 400 },
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

// ─── Helpers ─────────────────────────────────────────────

function apiResponse(data: {
    products: any[];
    total: number;
    page: number;
    limit: number;
}) {
    const hasMore = data.page * data.limit < data.total;
    const response = NextResponse.json({
        products: data.products,
        total: data.total,
        page: data.page,
        hasMore,
    });

    // Cache search results briefly (client can still revalidate)
    response.headers.set(
        "Cache-Control",
        "private, max-age=5, stale-while-revalidate=30",
    );
    return response;
}

function apiError(error: unknown, status = 500) {
    const message = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ error: message }, { status });
}
