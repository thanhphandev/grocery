"use client";

import { motion } from "framer-motion";
import { ScanBarcode, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    query?: string;
    onScan?: () => void;
    onSearch?: () => void;
}

export function EmptyState({ query, onScan, onSearch }: EmptyStateProps) {
    if (query) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 px-6 text-center"
            >
                <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-5">
                    <Search className="w-9 h-9 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1.5">
                    Không tìm thấy
                </h3>
                <p className="text-sm text-muted-foreground max-w-[240px] mb-5">
                    Không có sản phẩm nào khớp với &ldquo;{query}&rdquo;
                </p>
                <div className="flex gap-3">
                    {onScan && (
                        <Button variant="outline" size="sm" onClick={onScan} className="gap-2">
                            <ScanBarcode className="w-4 h-4" />
                            Quét mã vạch
                        </Button>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-6 text-center"
        >
            {/* Animated scan illustration */}
            <motion.div
                className="relative mb-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center relative overflow-hidden">
                    <ScanBarcode className="w-12 h-12 text-primary" />
                    <motion.div
                        className="absolute inset-x-0 h-0.5 bg-primary/60"
                        animate={{ top: ["10%", "90%", "10%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
                <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Sparkles className="w-5 h-5 text-warning" />
                </motion.div>
            </motion.div>

            <h3 className="text-xl font-bold text-foreground mb-2">
                SPEED-PRICE
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-6 leading-relaxed">
                Tra cứu giá sản phẩm siêu tốc. Quét mã vạch hoặc tìm kiếm theo tên.
            </p>
            <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
                {onScan && (
                    <Button onClick={onScan} className="gap-2 h-11 rounded-xl font-semibold">
                        <ScanBarcode className="w-4.5 h-4.5" />
                        Bắt đầu quét
                    </Button>
                )}
                {onSearch && (
                    <Button
                        variant="outline"
                        onClick={onSearch}
                        className="gap-2 h-11 rounded-xl font-semibold"
                    >
                        <Search className="w-4.5 h-4.5" />
                        Tìm kiếm
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
