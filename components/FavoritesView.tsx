"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFavorites, toggleFavorite, formatPrice } from "@/lib/search";
import type { Product } from "@/lib/types";

interface FavoritesViewProps {
    onProductClick?: (product: Product) => void;
}

export function FavoritesView({ onProductClick }: FavoritesViewProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setLoading(true);
        const data = await getFavorites();
        setProducts(data);
        setLoading(false);
    };

    const handleRemove = async (e: React.MouseEvent, productId: string) => {
        e.stopPropagation();
        await toggleFavorite(productId);
        setProducts((prev) => prev.filter((p) => p._id !== productId));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
            >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Chưa có yêu thích</h3>
                <p className="text-sm text-muted-foreground">
                    Thêm sản phẩm yêu thích bằng biểu tượng ★
                </p>
            </motion.div>
        );
    }

    return (
        <div>
            <h2 className="font-semibold text-muted-foreground text-sm mb-4">
                {products.length} sản phẩm yêu thích
            </h2>

            <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                    {products.map((product, i) => {
                        const hasLocation = product.location && product.location.trim();
                        return (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Card
                                    className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-150 active:scale-[0.99]"
                                    onClick={() => onProductClick?.(product)}
                                >
                                    <CardContent className="p-3.5 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                                            <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-foreground truncate">
                                                {product.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {product.barcode && (
                                                    <span className="text-[11px] font-mono text-muted-foreground/70">
                                                        {product.barcode}
                                                    </span>
                                                )}
                                                {hasLocation && (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                                        {product.location}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-sm font-bold text-price tabular-nums block">
                                                {formatPrice(product.prices.retail)}đ
                                            </span>
                                        </div>
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.7 }}
                                            onClick={(e) => handleRemove(e, product._id!)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                        >
                                            <Star className="w-4 h-4" fill="currentColor" />
                                        </motion.button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
