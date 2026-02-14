"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin,
    Package,
    Copy,
    Check,
    X,
    Share2,
    Barcode,
    Star,
    Pencil,
    Trash2,
    Save,
    Loader2,
    Camera,
    Image as ImageIcon,
} from "lucide-react";
import NextImage from "next/image";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/types";
import {
    formatPrice,
    isFavorite,
    toggleFavorite,
    addHistory,
    updateProduct,
    deleteProduct,
} from "@/lib/search";

interface ProductDetailSheetProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
    onDeleted?: () => void;
}

const UNITS = [
    "Cái", "Lon", "Gói", "Chai", "Hộp", "Túi",
    "Kg", "Lốc", "Bao", "Tuýp", "Thùng", "Lít",
];

export function ProductDetailSheet({
    product,
    isOpen,
    onClose,
    onUpdated,
    onDeleted,
}: ProductDetailSheetProps) {
    const [copied, setCopied] = useState(false);
    const [fav, setFav] = useState(false);
    const [favAnimating, setFavAnimating] = useState(false);

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editRetail, setEditRetail] = useState("");
    const [editWholesale, setEditWholesale] = useState("");
    const [editUnit, setEditUnit] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editBarcode, setEditBarcode] = useState("");
    const [editImage, setEditImage] = useState<string | undefined>(undefined);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // File inputs
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (product && isOpen) {
            if (product._id) isFavorite(product._id).then(setFav);
            addHistory(product);
            setIsEditing(false);
            setDeleteConfirm(false);
        }
    }, [product, isOpen]);

    // Populate edit fields when entering edit mode
    useEffect(() => {
        if (isEditing && product) {
            setEditName(product.name);
            setEditRetail(String(product.prices.retail));
            setEditWholesale(String(product.prices.wholesale));
            setEditUnit(product.unit);
            setEditLocation(product.location || "");
            setEditBarcode(product.barcode || "");
            setEditImage(product.image);
            setImagePreview(product.image || null);
            setIsUploading(false);
        }
    }, [isEditing, product]);

    // Auto-cancel delete confirm after 3s
    useEffect(() => {
        if (deleteConfirm) {
            const t = setTimeout(() => setDeleteConfirm(false), 3000);
            return () => clearTimeout(t);
        }
    }, [deleteConfirm]);

    if (!product) return null;

    // ─── Image upload handler ────────────────────────────────

    const handleImageFile = async (file: File) => {
        setIsUploading(true);

        // Show instant preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                const data = await res.json();
                setEditImage(data.url);
            } else {
                toast.error("Lỗi tải ảnh lên");
            }
        } catch {
            toast.error("Lỗi kết nối khi tải ảnh");
        }
        setIsUploading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageFile(file);
        e.target.value = ""; // reset so same file can be re-selected
    };

    const removeImage = () => {
        setEditImage(undefined);
        setImagePreview(null);
    };

    // ─── Actions ─────────────────────────────────────────────

    const copyBarcode = () => {
        if (!product.barcode) return;
        navigator.clipboard.writeText(product.barcode);
        setCopied(true);
        toast.success("Đã sao chép mã vạch");
        setTimeout(() => setCopied(false), 1500);
    };

    const handleToggleFav = async () => {
        if (!product._id) return;
        setFavAnimating(true);
        // Optimistic update
        setFav(!fav);

        try {
            const result = await toggleFavorite(product._id);
            setFav(result); // Sync with server result
            if (result) toast.success("Đã thêm vào yêu thích");
            else toast.info("Đã bỏ yêu thích");
        } catch {
            setFav(!fav); // Revert
            toast.error("Lỗi kết nối");
        }
        setTimeout(() => setFavAnimating(false), 300);
    };

    const share = async () => {
        if (navigator.share) {
            await navigator.share({
                title: product.name,
                text: `${product.name}\nGiá lẻ: ${formatPrice(product.prices.retail)}đ\nGiá sỉ: ${formatPrice(product.prices.wholesale)}đ`,
            });
        }
    };

    const handleSave = async () => {
        if (!editName.trim() || !editRetail.trim() || !product._id) return;
        setIsSaving(true);
        try {
            await updateProduct(product._id, {
                name: editName.trim(),
                barcode: editBarcode.trim() || undefined,
                prices: {
                    retail: Number(editRetail),
                    wholesale: Number(editWholesale) || Number(editRetail),
                },
                unit: editUnit,
                location: editLocation.trim() || undefined,
                image: editImage,
            });
            setIsEditing(false);
            onUpdated?.();
            toast.success("Đã cập nhật sản phẩm");
        } catch {
            toast.error("Không thể cập nhật. Vui lòng thử lại.");
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (!product._id) return;
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }
        setIsDeleting(true);
        try {
            await deleteProduct(product._id);
            onClose();
            onDeleted?.();
            toast.success("Đã xóa sản phẩm");
        } catch {
            toast.error("Không thể xóa sản phẩm");
        }
        setIsDeleting(false);
        setDeleteConfirm(false);
    };

    const savingAmount = product.prices.retail - product.prices.wholesale;
    const savingPercent = product.prices.retail > 0
        ? Math.round((savingAmount / product.prices.retail) * 100)
        : 0;
    const hasLocation = product.location && product.location.trim();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-3xl bg-card border-t border-border/50 shadow-2xl overflow-hidden"
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
                        </div>

                        {/* Top right actions */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.8 }}
                                onClick={handleToggleFav}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${fav ? "text-yellow-500" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <motion.div
                                    animate={favAnimating ? { scale: [1, 1.4, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Star className="w-5 h-5" fill={fav ? "currentColor" : "none"} />
                                </motion.div>
                            </motion.button>

                            {!isEditing && (
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => setIsEditing(true)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </motion.button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    if (isEditing) setIsEditing(false);
                                    else onClose();
                                }}
                                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 pb-8 pt-1 overflow-y-auto max-h-[calc(90vh-40px)]">


                            <AnimatePresence mode="wait">
                                {isEditing ? (
                                    /* ═══════════════ EDIT MODE ═══════════════ */
                                    <motion.div
                                        key="edit"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Pencil className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-bold text-primary">Chỉnh sửa sản phẩm</span>
                                        </div>

                                        {/* ── Image upload ── */}
                                        <div>
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                                                <Camera className="w-3 h-3 inline mr-1 -mt-0.5" />
                                                Ảnh sản phẩm
                                            </label>

                                            {imagePreview ? (
                                                <div className="relative rounded-xl overflow-hidden bg-muted group">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-36 object-cover"
                                                    />
                                                    {isUploading && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2 flex gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                                            title="Đổi ảnh"
                                                        >
                                                            <Camera className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={removeImage}
                                                            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                                            title="Xóa ảnh"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    {editImage && !isUploading && (
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

                                        {/* Name */}
                                        <div>
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                Tên sản phẩm *
                                            </label>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-11 rounded-xl"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Barcode (editable) */}
                                        <div>
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                <Barcode className="w-3 h-3 inline mr-1 -mt-0.5" />
                                                Mã vạch (tùy chọn)
                                            </label>
                                            <Input
                                                value={editBarcode}
                                                onChange={(e) => setEditBarcode(e.target.value)}
                                                className="h-11 rounded-xl font-mono"
                                                placeholder="Để trống nếu không có"
                                                inputMode="numeric"
                                            />
                                        </div>

                                        {/* Prices */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                    Giá lẻ (đ) *
                                                </label>
                                                <Input
                                                    value={editRetail}
                                                    onChange={(e) => setEditRetail(e.target.value.replace(/\D/g, ""))}
                                                    inputMode="numeric"
                                                    className="h-11 rounded-xl font-mono text-price font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                    Giá sỉ (đ)
                                                </label>
                                                <Input
                                                    value={editWholesale}
                                                    onChange={(e) => setEditWholesale(e.target.value.replace(/\D/g, ""))}
                                                    inputMode="numeric"
                                                    className="h-11 rounded-xl font-mono"
                                                />
                                            </div>
                                        </div>

                                        {/* Unit chips */}
                                        <div>
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                                                Đơn vị tính
                                            </label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {UNITS.map((u) => (
                                                    <motion.button
                                                        type="button"
                                                        key={u}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setEditUnit(u)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${editUnit === u
                                                            ? "bg-primary text-primary-foreground shadow-sm"
                                                            : "bg-muted text-muted-foreground hover:bg-accent"
                                                            }`}
                                                    >
                                                        {u}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                Vị trí kệ (tùy chọn)
                                            </label>
                                            <Input
                                                value={editLocation}
                                                onChange={(e) => setEditLocation(e.target.value)}
                                                className="h-11 rounded-xl"
                                                placeholder="VD: Kệ A1-04"
                                            />
                                        </div>

                                        {/* Save + Delete buttons */}
                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                onClick={handleSave}
                                                disabled={!editName.trim() || !editRetail.trim() || isSaving || isUploading}
                                                className="flex-1 h-11 rounded-xl gap-2 font-semibold"
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                            </Button>

                                            <Button
                                                variant={deleteConfirm ? "destructive" : "outline"}
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="h-11 rounded-xl gap-2 font-semibold px-4"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                {deleteConfirm ? "Chắc chắn?" : "Xóa"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* ═══════════════ VIEW MODE ═══════════════ */
                                    <motion.div
                                        key="view"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {/* Compact Header: Image + Title */}
                                        <div className="flex gap-4 mb-5">
                                            {product.image && (
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm relative"
                                                >
                                                    <NextImage
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="96px"
                                                    />
                                                </motion.div>
                                            )}

                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h2 className="text-xl font-bold text-foreground leading-tight line-clamp-2 mb-2">
                                                    {product.name}
                                                </h2>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="gap-1 px-2 py-0.5 h-6 text-xs font-medium">
                                                        <Package className="w-3 h-3 text-muted-foreground" />
                                                        {product.unit}
                                                    </Badge>
                                                    {hasLocation && (
                                                        <Badge variant="secondary" className="gap-1 px-2 py-0.5 h-6 text-xs font-medium">
                                                            <MapPin className="w-3 h-3 text-primary" />
                                                            {product.location}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price section */}
                                        <div className="rounded-2xl bg-muted/40 p-5 mb-5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                                            <div className="flex items-end justify-between mb-4 relative z-10">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70 block mb-1">
                                                        Giá bán lẻ
                                                    </span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[40px] font-black leading-none tracking-tight price-gradient">
                                                            {formatPrice(product.prices.retail)}
                                                        </span>
                                                        <span className="text-xl font-bold text-price/60">đ</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="mb-4 bg-border/50 relative z-10" />

                                            <div className="flex items-end justify-between relative z-10">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/70 block mb-1">
                                                        Giá sỉ
                                                    </span>
                                                    <div className="flex items-baseline gap-0.5">
                                                        <span className="text-2xl font-bold text-price-wholesale tabular-nums">
                                                            {formatPrice(product.prices.wholesale)}
                                                        </span>
                                                        <span className="text-base font-semibold text-price-wholesale/60">đ</span>
                                                    </div>
                                                </div>
                                                {savingAmount > 0 && (
                                                    <Badge className="bg-success/10 text-success border-success/20 font-semibold shadow-none">
                                                        Tiết kiệm {savingPercent}%
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Barcode — only show if exists */}
                                        {product.barcode && (
                                            <div className="rounded-2xl bg-muted/40 p-4 mb-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <Barcode className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">
                                                                Mã vạch
                                                            </p>
                                                            <p className="font-mono text-sm font-semibold text-foreground">
                                                                {product.barcode}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={copyBarcode}
                                                        className="rounded-xl"
                                                    >
                                                        {copied ? (
                                                            <Check className="w-4 h-4 text-primary" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions row */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsEditing(true)}
                                                className="flex-1 h-11 rounded-xl gap-2 font-semibold"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Sửa
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={share}
                                                className="flex-1 h-11 rounded-xl gap-2 font-semibold"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                Chia sẻ
                                            </Button>
                                            <Button
                                                variant={deleteConfirm ? "destructive" : "outline"}
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="h-11 rounded-xl gap-2 font-semibold px-4"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                {deleteConfirm ? "Chắc chắn?" : "Xóa"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
