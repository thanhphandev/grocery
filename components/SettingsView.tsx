"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

type ThemeMode = "light" | "dark" | "system";

interface SettingsViewProps {
    theme: ThemeMode;
    onThemeChange: (mode: ThemeMode) => void;
}

export function SettingsView({ theme, onThemeChange }: SettingsViewProps) {
    const [productCount, setProductCount] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/products?q=")
            .then((r) => r.json())
            .then((d) => setProductCount(d.count || 0))
            .catch(() => setProductCount(null));
    }, []);

    const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
        { mode: "light", icon: Sun, label: "Sáng" },
        { mode: "dark", icon: Moon, label: "Tối" },
        { mode: "system", icon: Monitor, label: "Hệ thống" },
    ];

    return (
        <div className="space-y-4">
            {/* Theme switcher */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Sun className="w-4 h-4 text-primary" />
                        Giao diện
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {themes.map(({ mode, icon: Icon, label }) => (
                            <motion.button
                                type="button"
                                key={mode}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onThemeChange(mode)}
                                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all ${theme === mode
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-muted hover:bg-accent text-muted-foreground"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-medium">{label}</span>
                            </motion.button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Database info */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        Cơ sở dữ liệu MongoDB
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Sản phẩm</span>
                            <span className="font-semibold text-foreground tabular-nums">
                                {productCount !== null ? productCount : "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Trạng thái</span>
                            <span className="flex items-center gap-1.5 font-medium text-success">
                                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                Online
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* About */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Về SPEED-PRICE
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Tra cứu giá sản phẩm siêu tốc. Quét mã vạch hoặc tìm kiếm theo tên.
                        Dữ liệu được lưu trữ trên MongoDB Atlas Cloud.
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-2">
                        v2.0.0 — MongoDB Edition
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
