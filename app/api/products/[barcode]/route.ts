import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ProductModel } from "@/lib/models/Product";

// PUT /api/products/[barcode] — update product
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ barcode: string }> }
) {
    try {
        await connectDB();
        const { barcode } = await params;
        const body = await request.json();

        const product = await ProductModel.findOneAndUpdate(
            { barcode },
            { ...body, updatedAt: Date.now() },
            { new: true, lean: true }
        );

        if (!product) {
            return NextResponse.json(
                { error: "Không tìm thấy sản phẩm" },
                { status: 404 }
            );
        }

        return NextResponse.json({ product });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/products/[barcode] — delete product
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ barcode: string }> }
) {
    try {
        await connectDB();
        const { barcode } = await params;

        const result = await ProductModel.findOneAndDelete({ barcode });
        if (!result) {
            return NextResponse.json(
                { error: "Không tìm thấy sản phẩm" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Đã xóa sản phẩm" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi server";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
