import { NextResponse } from "next/server";
import { ProductModel } from "@/lib/models/Product";
import { connectDB } from "@/lib/mongodb";

// GET /api/products/export — Export all products as CSV
export async function GET() {
  try {
    await connectDB();

    const products = await ProductModel.find()
      .sort({ name: 1 })
      .select("barcode name prices.retail prices.wholesale unit location image")
      .lean();

    // CSV header
    const header =
      "Mã vạch,Tên sản phẩm,Giá lẻ,Giá sỉ,Đơn vị,Vị trí kệ,Ảnh URL";

    const rows = products.map((p) => {
      const barcode = p.barcode || "";
      const name = `"${(p.name || "").replace(/"/g, '""')}"`;
      const retail = p.prices?.retail || 0;
      const wholesale = p.prices?.wholesale || 0;
      const unit = p.unit || "";
      const location = p.location || "";
      const image = p.image || "";
      return `${barcode},${name},${retail},${wholesale},${unit},${location},${image}`;
    });

    const csv = [header, ...rows].join("\n");

    // BOM for Excel UTF-8 support
    const bom = "\uFEFF";

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="san-pham-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
