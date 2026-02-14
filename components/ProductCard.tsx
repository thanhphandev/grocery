"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { MapPin, Package, Copy, Check, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/db";
import { formatPrice } from "@/lib/search";

interface ProductCardProps {
    product: Product;
    index: number;
    onClick?: () => void;
    isScanned?: boolean;
    onDelete?: (barcode: string) => void;
}

export function ProductCard({ product, index, onClick, isScanned, onDelete }: ProductCardProps) {
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const dragX = useMotionValue(0);
    const deleteOpacity = useTransform(dragX, [-120, -60], [1, 0]);
    const deleteScale = useTransform(dragX, [-120, -60], [1, 0.5]);
    const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const copyBarcode = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(product.barcode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -100) {
            setShowDeleteConfirm(true);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setShowDeleteConfirm(false), 3000);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showDeleteConfirm) {
            onDelete?.(product.barcode);
            setShowDeleteConfirm(false);
        } else {
            setShowDeleteConfirm(true);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setShowDeleteConfirm(false), 3000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
            transition={{
                duration: 0.35,
                delay: index * 0.06,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            layout
            className="relative"
        >
            {/* Delete zone behind the card */}
            <motion.div
                className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 rounded-xl"
                style={{ opacity: deleteOpacity, scale: deleteScale }}
            >
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                </div>
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x: dragX }}
                className="relative z-10"
            >
                <Card
                    className={`group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-[0.98] border-border/40 ${isScanned
                        ? "ring-2 ring-primary shadow-lg glow-primary"
                        : "hover:border-primary/30"
                        }`}
                    onClick={onClick}
                >
                    <CardContent className="p-0">
                        <div className="flex">
                            {/* Product image thumbnail */}
                            {product.image && (
                                <div className="w-20 shrink-0 bg-muted">
                                    <img
                                        src={product.image}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="flex-1 p-4">
                                {/* Top row: Name + Badge */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-[15px] leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Badge
                                                variant="secondary"
                                                className="font-mono text-[11px] px-2 py-0.5 cursor-pointer hover:bg-primary/10 transition-colors"
                                                onClick={copyBarcode}
                                            >
                                                {copied ? (
                                                    <Check className="w-3 h-3 mr-1 text-primary" />
                                                ) : (
                                                    <Copy className="w-3 h-3 mr-1 opacity-50" />
                                                )}
                                                {product.barcode}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Badge variant="outline" className="text-[11px] gap-1 py-1">
                                            <Package className="w-3 h-3" />
                                            {product.unit}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Price row */}
                                <div className="flex items-end justify-between gap-4 mb-2.5">
                                    <div className="flex-1">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">
                                            Giá bán lẻ
                                        </span>
                                        <motion.div
                                            className="flex items-baseline gap-0.5"
                                            initial={isScanned ? { scale: 0.8 } : false}
                                            animate={isScanned ? { scale: 1 } : undefined}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <span className="text-[32px] font-black leading-none tracking-tight price-gradient">
                                                {formatPrice(product.prices.retail)}
                                            </span>
                                            <span className="text-lg font-bold text-price/70">đ</span>
                                        </motion.div>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">
                                            Giá sỉ
                                        </span>
                                        <div className="flex items-baseline gap-0.5 justify-end">
                                            <span className="text-xl font-bold text-price-wholesale tabular-nums">
                                                {formatPrice(product.prices.wholesale)}
                                            </span>
                                            <span className="text-sm font-semibold text-price-wholesale/70">đ</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location + Delete button row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5 text-primary/70" />
                                        <span className="font-medium">{product.location}</span>
                                    </div>

                                    {/* Quick delete */}
                                    <AnimatePresence>
                                        {showDeleteConfirm && (
                                            <motion.button
                                                type="button"
                                                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                                animate={{ opacity: 1, scale: 1, width: "auto" }}
                                                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                                onClick={handleDelete}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-semibold"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Xóa?
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}

