"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Database, Trash2, HardDrive, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { fullSync } from "@/lib/search";

type ThemeMode = "light" | "dark" | "system";

interface SettingsViewProps {
    theme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
}

export function SettingsView({ theme, onThemeChange }: SettingsViewProps) {
    const [productCount, setProductCount] = useState(0);
    const [historyCount, setHistoryCount] = useState(0);
    const [favCount, setFavCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        db.products.count().then(setProductCount);
        db.history.count().then(setHistoryCount);
        db.favorites.count().then(setFavCount);
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
            const result = await fullSync();
            setSyncResult(`Đẩy ${result.pushed}, kéo ${result.pulled} sản phẩm`);
            db.products.count().then(setProductCount);
        } catch {
            setSyncResult("Lỗi đồng bộ. Kiểm tra kết nối.");
        }
        setIsSyncing(false);
        setTimeout(() => setSyncResult(null), 4000);
    };

    const handleClearAll = async () => {
        if (isClearing) {
            await db.products.clear();
            await db.history.clear();
            await db.favorites.clear();
            setProductCount(0);
            setHistoryCount(0);
            setFavCount(0);
            setIsClearing(false);
        } else {
            setIsClearing(true);
            setTimeout(() => setIsClearing(false), 3000);
        }
    };

    const themes: { id: ThemeMode; icon: typeof Sun; label: string }[] = [
        { id: "light", icon: Sun, label: "Sáng" },
        { id: "dark", icon: Moon, label: "Tối" },
        { id: "system", icon: Monitor, label: "Hệ thống" },
    ];

    return (
        <div className="space-y-5">
            {/* Theme */}
            <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Giao diện
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {themes.map((t) => {
                        const Icon = t.icon;
                        const isActive = theme === t.id;
                        return (
                            <motion.button
                                key={t.id}
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onThemeChange(t.id)}
                                className={`flex flex-col items-center gap-2 py-3.5 rounded-xl border-2 transition-all ${isActive
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border bg-card hover:border-primary/30"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                                    {t.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <Separator />

            {/* Storage */}
            <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Dữ liệu cục bộ
                </h3>
                <Card>
                    <CardContent className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <HardDrive className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Sản phẩm</span>
                            </div>
                            <span className="text-sm font-bold text-primary tabular-nums">{productCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Database className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Lịch sử tra cứu</span>
                            </div>
                            <span className="text-sm font-bold tabular-nums">{historyCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Database className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Yêu thích</span>
                            </div>
                            <span className="text-sm font-bold tabular-nums">{favCount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Actions */}
            <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Hành động
                </h3>
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2.5 h-11"
                        onClick={handleSync}
                        disabled={isSyncing}
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Đang đồng bộ..." : "Đồng bộ với server"}
                    </Button>

                    {syncResult && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-primary font-medium pl-1"
                        >
                            ✓ {syncResult}
                        </motion.p>
                    )}

                    <Button
                        variant={isClearing ? "destructive" : "outline"}
                        className="w-full justify-start gap-2.5 h-11"
                        onClick={handleClearAll}
                    >
                        <Trash2 className="w-4 h-4" />
                        {isClearing ? "Nhấn lần nữa để xác nhận xóa" : "Xóa toàn bộ dữ liệu"}
                    </Button>
                </div>
            </div>

            <Separator />

            {/* App info */}
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5" />
                <span>SPEED-PRICE v1.0 · Offline-first · Next.js + MongoDB</span>
            </div>
        </div>
    );
}
