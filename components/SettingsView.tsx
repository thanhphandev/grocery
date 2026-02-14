"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Database, Zap, PieChart } from "lucide-react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";

type ThemeMode = "light" | "dark" | "system";

interface SettingsViewProps {
    theme: ThemeMode;
    onThemeChange: (mode: ThemeMode) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SettingsView({ theme, onThemeChange }: SettingsViewProps) {
    // Fetch total count (empty query returns count of all products potentially, or at least optimized query)
    // Actually our API returns total count of *matching* query.
    // So distinct query for stats might be better, but empty query works for now.
    const { data } = useSWR("/api/products?q=", fetcher);
    const productCount = data?.total;

    const themes: { mode: ThemeMode; icon: any; label: string }[] = [
        { mode: "light", icon: Sun, label: "Sáng" },
        { mode: "dark", icon: Moon, label: "Tối" },
        { mode: "system", icon: Monitor, label: "Hệ thống" },
    ];

    return (
        <div className="space-y-4 pb-20">
            {/* Theme switcher */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-primary" />
                        Giao diện
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {themes.map((t) => {
                            const Icon = t.icon;
                            return (
                                <motion.button
                                    type="button"
                                    key={t.mode}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onThemeChange(t.mode)}
                                    className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl transition-all border ${theme === t.mode
                                        ? "bg-primary/5 border-primary text-primary shadow-sm"
                                        : "bg-card border-border hover:bg-muted/50 text-muted-foreground"
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${theme === t.mode ? "fill-current" : ""}`} />
                                    <span className="text-xs font-medium">{t.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Database info */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        Dữ liệu hệ thống
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <PieChart className="w-4 h-4 text-blue-500" />
                                </div>
                                <span className="text-sm font-medium">Tổng sản phẩm</span>
                            </div>
                            <span className="text-lg font-bold tabular-nums">
                                {productCount !== undefined ? productCount : "—"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-green-500" />
                                </div>
                                <span className="text-sm font-medium">Trạng thái</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Online</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* About */}
            <div className="px-4 py-6 text-center">
                <p className="text-xs font-medium text-foreground/80 mb-1">
                    SPEED-PRICE GROCERY
                </p>
                <p className="text-[10px] text-muted-foreground">
                    Version 2.0.0 • Powered by MongoDB Atlas
                </p>
            </div>
        </div>
    );
}
