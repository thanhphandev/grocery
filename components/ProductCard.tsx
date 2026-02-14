"use client";

import { motion } from "framer-motion";
import { MapPin, Package, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/db";
import { formatPrice } from "@/lib/search";

interface ProductCardProps {
    product: Product;
    index: number;
    onClick?: () => void;
    isScanned?: boolean;
}

export function ProductCard({ product, index, onClick, isScanned }: ProductCardProps) {
    const [copied, setCopied] = useState(false);

    const copyBarcode = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(product.barcode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{
                duration: 0.35,
                delay: index * 0.06,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            layout
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
                                <Badge variant="outline" className="shrink-0 text-[11px] gap-1 py-1">
                                    <Package className="w-3 h-3" />
                                    {product.unit}
                                </Badge>
                            </div>

                            {/* Price row - HUGE display */}
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

                            {/* Location */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 text-primary/70" />
                                <span className="font-medium">{product.location}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
