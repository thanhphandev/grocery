"use client";

import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearHistory, formatPrice, type HistoryEntry } from "@/lib/search";
import type { Product } from "@/lib/types";

interface HistoryViewProps {
    onProductClick?: (product: Product) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function HistoryView({ onProductClick }: HistoryViewProps) {
    const { data, mutate, isLoading } = useSWR<{ entries: HistoryEntry[] }>("/api/history", fetcher);
    const entries = data?.entries || [];

    const handleClear = async () => {
        try {
            await clearHistory();
            mutate({ entries: [] }, false); // Optimistic update
            toast.success("Đã xóa lịch sử");
        } catch {
            mutate(); // Revert on error
            toast.error("Lỗi khi xóa lịch sử");
        }
    };

    const handleClick = (entry: HistoryEntry) => {
        if (entry.product && onProductClick) {
            onProductClick(entry.product as Product);
        }
    };

    const formatTime = (ts: number) => {
        const now = Date.now();
        const diff = now - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Vừa xong";
        if (mins < 60) return `${mins} phút trước`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        return `${days} ngày trước`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
            >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Chưa có lịch sử</h3>
                <p className="text-sm text-muted-foreground">
                    Tra cứu sản phẩm để xem lịch sử tại đây
                </p>
            </motion.div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-muted-foreground text-sm">
                    {entries.length} lượt tra cứu
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-destructive hover:text-destructive gap-1.5 text-xs"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa tất cả
                </Button>
            </div>

            <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                    {entries.map((entry, i) => (
                        <motion.div
                            key={entry._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card
                                className="cursor-pointer hover:bg-muted/40 transition-colors duration-200"
                                onClick={() => handleClick(entry)}
                            >
                                <CardContent className="p-3.5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-foreground truncate">
                                            {entry.productName}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {entry.barcode && (
                                                <span className="text-[11px] font-mono text-muted-foreground/70">
                                                    {entry.barcode}
                                                </span>
                                            )}
                                            <span className="text-[11px] text-muted-foreground">
                                                {formatTime(entry.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-price tabular-nums shrink-0">
                                        {formatPrice(entry.retailPrice)}đ
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
