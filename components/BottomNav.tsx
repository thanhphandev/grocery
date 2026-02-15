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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
            <div className="relative flex items-end justify-around px-2 pt-2 safe-bottom">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    if (tab.id === "scan") {
                        return (
                            <div key={tab.id} className="relative flex flex-col items-center -mt-8">
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onScanPress}
                                    className="relative w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-background transition-transform"
                                >
                                    <ScanBarcode className="w-8 h-8" strokeWidth={2} />
                                </motion.button>
                                <span className="text-[10px] font-semibold text-primary mt-1 mb-2">
                                    {tab.label}
                                </span>
                            </div>
                        );
                    }

                    const Icon = tab.icon;

                    return (
                        <button
                            type="button"
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors relative min-w-[64px] ${isActive
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-0.5 w-8 h-1 rounded-full bg-primary"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
