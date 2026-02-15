import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ProductModel } from "@/lib/models/Product";
import { HistoryModel } from "@/lib/models/History";
import { FavoriteModel } from "@/lib/models/Favorite";
import { connectDB } from "@/lib/mongodb";

export async function DELETE(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Clear all collections
        await Promise.all([
            ProductModel.deleteMany({}),
            HistoryModel.deleteMany({}),
            FavoriteModel.deleteMany({}),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
