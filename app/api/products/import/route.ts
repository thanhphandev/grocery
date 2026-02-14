import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ProductModel } from "@/lib/models/Product";
import { connectDB } from "@/lib/mongodb";
import { buildSearchSlug } from "@/lib/utils";

// POST /api/products/import — Bulk import products from CSV
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const text = await request.text();
    // Remove BOM if present
    const cleaned = text.replace(/^\uFEFF/, "");
    const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "File CSV không có dữ liệu" },
        { status: 400 },
      );
    }

    // Skip header line
    const dataLines = lines.slice(1);
    const operations: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const cols = parseCSVLine(line);

      if (cols.length < 4) {
        errors.push(`Dòng ${i + 2}: Thiếu cột dữ liệu`);
        continue;
      }

      const [barcode, name, retailStr, wholesaleStr, unit, location, image] =
        cols;

      if (!name?.trim()) {
        errors.push(`Dòng ${i + 2}: Thiếu tên sản phẩm`);
        continue;
      }

      const retail = Number(retailStr);
      if (!retail || retail <= 0) {
        errors.push(`Dòng ${i + 2}: Giá lẻ không hợp lệ`);
        continue;
      }

      const wholesale = Number(wholesaleStr) || retail;
      const productData: Record<string, unknown> = {
        name: name.trim(),
        search_slug: buildSearchSlug(name.trim(), barcode?.trim()),
        prices: { retail, wholesale },
        unit: unit?.trim() || "Cái",
        updatedAt: Date.now(),
      };

      if (barcode?.trim()) productData.barcode = barcode.trim();
      if (location?.trim()) productData.location = location.trim();
      if (image?.trim()) productData.image = image.trim();

      if (barcode?.trim()) {
        // Upsert by barcode
        operations.push({
          updateOne: {
            filter: { barcode: barcode.trim() },
            update: { $set: productData },
            upsert: true,
          },
        });
      } else {
        // Insert new (no barcode to match on)
        operations.push({
          insertOne: { document: productData },
        });
      }
    }

    const result = { imported: 0, updated: 0 };
    if (operations.length > 0) {
      const bulkResult = await ProductModel.bulkWrite(operations, {
        ordered: false,
      });
      result.imported =
        (bulkResult.upsertedCount || 0) + (bulkResult.insertedCount || 0);
      result.updated = bulkResult.modifiedCount || 0;
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
      updated: result.updated,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      totalLines: dataLines.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Simple CSV line parser that handles quoted fields with commas.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());

  return result;
}
