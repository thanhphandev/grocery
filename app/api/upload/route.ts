import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// POST /api/upload — upload to Cloudinary
export async function POST(request: Request) {
    try {
        // 1. Check Env
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error(
                "Thiếu cấu hình Cloudinary (CLOUDINARY_CLOUD_NAME, ...). Vui lòng thêm vào .env"
            );
        }

        // 2. Configure
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });

        // 3. Parse File
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Không có file" }, { status: 400 });
        }

        // Validate type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Chỉ chấp nhận file ảnh" },
                { status: 400 }
            );
        }

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File quá lớn (tối đa 5MB)" },
                { status: 400 }
            );
        }

        // 4. Upload to Cloudinary via Stream
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "grocery-app" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            // Convert buffer to stream and pipe
            Readable.from(buffer).pipe(uploadStream);
        });

        return NextResponse.json(
            { url: result.secure_url, filename: result.public_id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        const message = error instanceof Error ? error.message : "Lỗi upload";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
