"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, AlertTriangle, Barcode, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addProduct } from "@/lib/search";

interface QuickAddOverlayProps {
    barcode: string;
    isOpen: boolean;
    onClose: () => void;
    onAdded: () => void;
}

export function QuickAddOverlay({
    barcode,
    isOpen,
    onClose,
    onAdded,
}: QuickAddOverlayProps) {
    const [name, setName] = useState("");
    const [retailPrice, setRetailPrice] = useState("");
    const [wholesalePrice, setWholesalePrice] = useState("");
    const [unit, setUnit] = useState("Cái");
    const [location, setLocation] = useState("");
    const [barcodeInput, setBarcodeInput] = useState(barcode);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const units = [
        "Cái", "Lon", "Gói", "Chai", "Hộp", "Túi",
        "Kg", "Lốc", "Bao", "Tuýp", "Thùng", "Lít",
    ];

    if (barcode && barcode !== barcodeInput && !saving) {
        setBarcodeInput(barcode);
    }

    const resetForm = () => {
        setName("");
        setRetailPrice("");
        setWholesalePrice("");
        setUnit("Cái");
        setLocation("");
        setBarcodeInput("");
        setImageUrl(null);
        setImagePreview(null);
        setSaved(false);
    };

    const handleImageCapture = async (file: File) => {
        setUploading(true);

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setImageUrl(data.url);
            } else {
                toast.error("Lỗi tải ảnh");
            }
        } catch {
            toast.error("Lỗi kết nối");
        }
        setUploading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageCapture(file);
    };

    const removeImage = () => {
        setImageUrl(null);
        setImagePreview(null);
    };

    const handleSave = async () => {
        // Only name and retail price are required — barcode is OPTIONAL
        if (!name || !retailPrice) return;

        setSaving(true);
        try {
            await addProduct({
                barcode: barcodeInput.trim() || undefined,
                name,
                prices: {
                    retail: Number(retailPrice),
                    wholesale: Number(wholesalePrice) || Number(retailPrice),
                },
                unit,
                location: location.trim() || undefined,
                image: imageUrl || undefined,
            });
            setSaved(true);
            setTimeout(() => {
                resetForm();
                onAdded();
                toast.success("Đã thêm sản phẩm mới");
            }, 800);
        } catch (e: any) {
            setSaving(false);
            toast.error(e.message || "Không thể thêm sản phẩm");
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Determine if this is a "new barcode detected" or manual add
    const isFromScanner = !!barcode;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60"
                        onClick={handleClose}
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 280 }}
                        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-card border-t border-border/50 shadow-2xl max-h-[92vh] overflow-y-auto"
                    >
                        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-card z-10">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors z-20"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="px-5 pb-8 pt-2 relative">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFromScanner ? "bg-warning/10" : "bg-primary/10"}`}>
                                    {isFromScanner ? (
                                        <AlertTriangle className="w-5 h-5 text-warning" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-base">
                                        {isFromScanner ? "Mã mới phát hiện" : "Thêm sản phẩm mới"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {isFromScanner ? "Sản phẩm chưa có trong hệ thống" : "Nhập thông tin sản phẩm"}
                                    </p>
                                </div>
                            </div>



                            {/* Form */}
                            <div className="space-y-3.5">
                                {/* Image capture */}
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                                        <Camera className="w-3 h-3 inline mr-1 -mt-0.5" />
                                        Ảnh sản phẩm (tùy chọn)
                                    </label>

                                    {imagePreview ? (
                                        <div className="relative rounded-xl overflow-hidden bg-muted group">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-36 object-cover"
                                            />
                                            {uploading && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            {imageUrl && !uploading && (
                                                <div className="absolute bottom-2 left-2">
                                                    <Badge className="bg-success/90 text-white text-[10px]">
                                                        ✓ Đã tải lên
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <motion.button
                                                type="button"
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => cameraInputRef.current?.click()}
                                                className="flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                                            >
                                                <Camera className="w-5 h-5 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">Chụp ảnh</span>
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                                            >
                                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">Chọn ảnh</span>
                                            </motion.button>
                                        </div>
                                    )}

                                    {/* Hidden file inputs */}
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Barcode — OPTIONAL */}
                                <div>
                                    <label htmlFor="barcode-input" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                        <Barcode className="w-3 h-3 inline mr-1 -mt-0.5" />
                                        Mã vạch (tùy chọn)
                                    </label>
                                    {isFromScanner ? (
                                        <Badge variant="secondary" className="font-mono text-sm py-1.5 px-3">
                                            {barcode}
                                        </Badge>
                                    ) : (
                                        <Input
                                            id="barcode-input"
                                            value={barcodeInput}
                                            onChange={(e) => setBarcodeInput(e.target.value)}
                                            placeholder="Để trống nếu không có mã vạch"
                                            inputMode="numeric"
                                            className="h-11 rounded-xl font-mono"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="product-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                        Tên sản phẩm *
                                    </label>
                                    <Input
                                        id="product-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="VD: Sữa Vinamilk 1L không đường"
                                        className="h-11 rounded-xl"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="retail-price" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                            Giá lẻ (đ) *
                                        </label>
                                        <Input
                                            id="retail-price"
                                            value={retailPrice}
                                            onChange={(e) => setRetailPrice(e.target.value.replace(/\D/g, ""))}
                                            placeholder="25000"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            className="h-11 rounded-xl font-mono text-price font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="wholesale-price" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                            Giá sỉ (đ)
                                        </label>
                                        <Input
                                            id="wholesale-price"
                                            value={wholesalePrice}
                                            onChange={(e) => setWholesalePrice(e.target.value.replace(/\D/g, ""))}
                                            placeholder="23000"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            className="h-11 rounded-xl font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Units */}
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                                        Đơn vị tính
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {units.map((u) => (
                                            <motion.button
                                                type="button"
                                                key={u}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setUnit(u)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${unit === u
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                    }`}
                                            >
                                                {u}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="product-location" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                        Vị trí kệ (tùy chọn)
                                    </label>
                                    <Input
                                        id="product-location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="VD: Kệ A1-04"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <Button
                                    onClick={handleSave}
                                    disabled={!name || !retailPrice || saving || uploading}
                                    className="w-full h-12 rounded-xl font-semibold text-base gap-2 mt-1"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Plus className="w-5 h-5" />
                                    )}
                                    {saving ? "Đang lưu..." : "Thêm sản phẩm"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
