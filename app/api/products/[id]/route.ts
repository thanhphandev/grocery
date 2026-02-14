import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProductModel } from "@/lib/models/Product";
import { buildSearchSlug } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/products/[id]
export async function GET(_request: Request, { params }: RouteContext) {
    try {
        await connectDB();
        const { id } = await params;
        const product = await ProductModel.findById(id).lean();

        if (!product) {
            return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
        }
        return NextResponse.json({ product });
    } catch (error) {
        return apiError(error);
    }
}

// PUT /api/products/[id]
export async function PUT(request: Request, { params }: RouteContext) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const updateData: Record<string, unknown> = {
            ...body,
            updatedAt: Date.now(),
        };

        // Rebuild search_slug when name changes
        if (body.name) {
            updateData.search_slug = buildSearchSlug(body.name, body.barcode);
        }

        // Unset location if explicitly cleared
        if (body.location !== undefined && !body.location?.trim()) {
            updateData.$unset = { location: 1 };
            delete updateData.location;
        } else if (body.location) {
            updateData.location = body.location.trim();
        }

        const product = await ProductModel.findByIdAndUpdate(id, updateData, {
            new: true,
            lean: true,
        });

        if (!product) {
            return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
        }
        return NextResponse.json({ product });
    } catch (error) {
        return apiError(error);
    }
}

// DELETE /api/products/[id]
export async function DELETE(_request: Request, { params }: RouteContext) {
    try {
        await connectDB();
        const { id } = await params;
        const result = await ProductModel.findByIdAndDelete(id);

        if (!result) {
            return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
        }
        return NextResponse.json({ message: "Đã xóa sản phẩm" });
    } catch (error) {
        return apiError(error);
    }
}

function apiError(error: unknown, status = 500) {
    const message = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ error: message }, { status });
}
