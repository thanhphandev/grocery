"use client";

import { motion } from "framer-motion";
import { Search, ScanBarcode, Clock, Star, Settings } from "lucide-react";

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onScanPress: () => void;
}

const tabs = [
    { id: "search", icon: Search, label: "Tìm kiếm" },
    { id: "history", icon: Clock, label: "Lịch sử" },
    { id: "scan", icon: ScanBarcode, label: "Quét mã" },
    { id: "favorites", icon: Star, label: "Yêu thích" },
    { id: "settings", icon: Settings, label: "Cài đặt" },
];

export function BottomNav({ activeTab, onTabChange, onScanPress }: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
            {/* Gradient blur backdrop */}
            <div className="absolute inset-0 glass dark:glass border-t border-border/50" />

            <div className="relative flex items-end justify-around px-2 pt-2 safe-bottom">
                {tabs.map((tab) => {
                    if (tab.id === "scan") {
                        return (
                            <div key={tab.id} className="flex flex-col items-center -mt-7 relative">
                                {/* Pulse ring behind scan button */}
                                <div className="absolute inset-0 -top-7 flex items-start justify-center">
                                    <div className="w-[72px] h-[72px] rounded-full bg-primary/30 animate-pulse-ring" />
                                </div>

                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={onScanPress}
                                    className="relative w-[68px] h-[68px] rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl glow-scan active:glow-primary transition-shadow"
                                >
                                    <ScanBarcode className="w-7 h-7" strokeWidth={2.5} />
                                </motion.button>
                                <span className="text-[10px] font-semibold text-primary mt-1.5 mb-2">
                                    {tab.label}
                                </span>
                            </div>
                        );
                    }

                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <motion.button
                            type="button"
                            key={tab.id}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-colors relative ${isActive
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-0.5 w-8 h-1 rounded-full bg-primary"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                                {tab.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </nav>
    );
}
