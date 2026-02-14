"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, HeartOff, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFavorites, toggleFavorite, formatPrice } from "@/lib/search";
import type { Product } from "@/lib/db";

interface FavoritesViewProps {
    onProductClick: (product: Product) => void;
}

export function FavoritesView({ onProductClick }: FavoritesViewProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getFavorites();
        setProducts(data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleRemove = async (barcode: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await toggleFavorite(barcode);
        setProducts((prev) => prev.filter((p) => p.barcode !== barcode));
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted/50" />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Star className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Chưa có yêu thích</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                    Nhấn ★ trên sản phẩm để thêm vào danh sách yêu thích
                </p>
            </motion.div>
        );
    }

    return (
        <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                {products.length} sản phẩm yêu thích
            </h2>
            <div className="flex flex-col gap-2.5">
                <AnimatePresence>
                    {products.map((product, i) => (
                        <motion.div
                            key={product.barcode}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, height: 0 }}
                            transition={{ delay: i * 0.04 }}
                            layout
                        >
                            <Card
                                className="cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                                onClick={() => onProductClick(product)}
                            >
                                <CardContent className="p-3.5 flex items-center gap-3">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt=""
                                            className="w-12 h-12 rounded-xl object-cover bg-muted"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                            <Package className="w-5 h-5 text-muted-foreground/40" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate text-foreground">
                                            {product.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className="text-[10px] py-0 font-mono">
                                                {product.unit}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">{product.location}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right">
                                            <p className="text-base font-bold text-price tabular-nums">
                                                {formatPrice(product.prices.retail)}đ
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleRemove(product.barcode, e)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                                        >
                                            <HeartOff className="w-4 h-4" />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
