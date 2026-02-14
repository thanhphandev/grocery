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
} from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/db";
import { formatPrice, isFavorite, toggleFavorite, addHistory } from "@/lib/search";

interface ProductDetailSheetProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ProductDetailSheet({
    product,
    isOpen,
    onClose,
}: ProductDetailSheetProps) {
    const [copied, setCopied] = useState(false);
    const [fav, setFav] = useState(false);
    const [favAnimating, setFavAnimating] = useState(false);

    useEffect(() => {
        if (product && isOpen) {
            isFavorite(product.barcode).then(setFav);
            addHistory(product);
        }
    }, [product, isOpen]);

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
                        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] rounded-t-3xl bg-card border-t border-border/50 shadow-2xl overflow-hidden"
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
                        </div>

                        {/* Close + Favorite top right */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
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
                                    <Star
                                        className="w-5 h-5"
                                        fill={fav ? "currentColor" : "none"}
                                    />
                                </motion.div>
                            </motion.button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 pb-8 pt-1 overflow-y-auto max-h-[calc(88vh-40px)]">
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

                            <h2 className="text-xl font-bold text-foreground pr-16 mb-3 leading-tight">
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

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={share}
                                    className="flex-1 h-11 rounded-xl gap-2 font-semibold"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Chia sẻ
                                </Button>
                                <Button
                                    onClick={copyBarcode}
                                    className="flex-1 h-11 rounded-xl gap-2 font-semibold"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    Sao chép mã
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
