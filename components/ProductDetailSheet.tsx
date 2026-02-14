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
} from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/db";
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
    const [isSaving, setIsSaving] = useState(false);

    // Delete
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const units = [
        "Cái", "Lon", "Gói", "Chai", "Hộp", "Túi",
        "Kg", "Lốc", "Bao", "Tuýp", "Thùng", "Lít",
    ];

    useEffect(() => {
        if (product && isOpen) {
            isFavorite(product.barcode).then(setFav);
            addHistory(product);
            // Reset edit state when opening
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
            setEditLocation(product.location);
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

    const copyBarcode = () => {
        navigator.clipboard.writeText(product.barcode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleToggleFav = async () => {
        setFavAnimating(true);
        const result = await toggleFavorite(product.barcode);
        setFav(result);
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
        if (!editName.trim() || !editRetail.trim()) return;
        setIsSaving(true);
        try {
            await updateProduct(product.barcode, {
                name: editName.trim(),
                prices: {
                    retail: Number(editRetail),
                    wholesale: Number(editWholesale) || Number(editRetail),
                },
                unit: editUnit,
                location: editLocation.trim() || "Chưa xác định",
            });
            setIsEditing(false);
            onUpdated?.();
        } catch {
            // silent
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }
        setIsDeleting(true);
        try {
            await deleteProduct(product.barcode);
            onClose();
            onDeleted?.();
        } catch {
            // silent
        }
        setIsDeleting(false);
        setDeleteConfirm(false);
    };

    const savingAmount = product.prices.retail - product.prices.wholesale;
    const savingPercent = Math.round(
        (savingAmount / product.prices.retail) * 100
    );

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
                                    if (isEditing) {
                                        setIsEditing(false);
                                    } else {
                                        onClose();
                                    }
                                }}
                                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 pb-8 pt-1 overflow-y-auto max-h-[calc(90vh-40px)]">
                            {/* Product image */}
                            {product.image && (
                                <div className="mb-4 rounded-2xl overflow-hidden bg-muted">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                            )}

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

                                        {/* Name */}
                                        <div>
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                Tên sản phẩm
                                            </label>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-11 rounded-xl"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Prices */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                    Giá lẻ (đ)
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
                                                {units.map((u) => (
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
                                                Vị trí kệ
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
                                                disabled={!editName.trim() || !editRetail.trim() || isSaving}
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

                                        {/* Barcode (read-only) */}
                                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                                            <Barcode className="w-3.5 h-3.5" />
                                            <span className="font-mono">{product.barcode}</span>
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
                                        <h2 className="text-xl font-bold text-foreground pr-24 mb-3 leading-tight">
                                            {product.name}
                                        </h2>

                                        <div className="flex items-center gap-2 mb-5">
                                            <Badge variant="outline" className="gap-1 py-1">
                                                <Package className="w-3 h-3" />
                                                {product.unit}
                                            </Badge>
                                            <Badge variant="secondary" className="gap-1 py-1">
                                                <MapPin className="w-3 h-3 text-primary" />
                                                {product.location}
                                            </Badge>
                                        </div>

                                        {/* Price section */}
                                        <div className="rounded-2xl bg-muted/40 p-5 mb-5">
                                            <div className="flex items-end justify-between mb-4">
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

                                            <Separator className="mb-4 bg-border/50" />

                                            <div className="flex items-end justify-between">
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
                                                    <Badge className="bg-success/10 text-success border-success/20 font-semibold">
                                                        Tiết kiệm {savingPercent}% (−{formatPrice(savingAmount)}đ)
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Barcode */}
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
