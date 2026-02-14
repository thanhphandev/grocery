"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHistory, clearHistory } from "@/lib/search";
import { formatPrice } from "@/lib/search";
import type { Product } from "@/lib/db";
import type { HistoryEntry } from "@/lib/db";

interface HistoryViewProps {
    onProductClick: (product: Product) => void;
}

export function HistoryView({ onProductClick }: HistoryViewProps) {
    const [entries, setEntries] = useState<(HistoryEntry & { product?: Product })[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getHistory();
        setEntries(data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleClear = async () => {
        await clearHistory();
        setEntries([]);
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return "Vừa xong";
        if (diffMin < 60) return `${diffMin} phút trước`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH} giờ trước`;
        return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted/50" />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Clock className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Chưa có lịch sử</h3>
                <p className="text-sm text-muted-foreground">Quét hoặc tìm kiếm sản phẩm để bắt đầu</p>
            </motion.div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground">
                    {entries.length} lượt tra cứu
                </h2>
                <Button variant="ghost" size="xs" onClick={handleClear} className="text-destructive gap-1">
                    <Trash2 className="w-3 h-3" />
                    Xóa tất cả
                </Button>
            </div>
            <div className="flex flex-col gap-2">
                <AnimatePresence>
                    {entries.map((entry, i) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card
                                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                                onClick={() => entry.product && onProductClick(entry.product)}
                            >
                                <CardContent className="p-3 flex items-center gap-3">
                                    {entry.product?.image ? (
                                        <img
                                            src={entry.product.image}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover bg-muted"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                            <PackageOpen className="w-4 h-4 text-muted-foreground/50" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate text-foreground">
                                            {entry.productName}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {entry.barcode}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-price tabular-nums">
                                            {formatPrice(entry.retailPrice)}đ
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatTime(entry.timestamp)}
                                        </p>
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
