"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    isLoading?: boolean;
    resultCount?: number;
}

export function SearchBar({ value, onChange, isLoading, resultCount }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    useEffect(() => {
        // Small delay to avoid keyboard pop on mobile on first load
        const t = setTimeout(() => {
            // Don't auto-focus on mobile
        }, 500);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="relative w-full">
            <div className="relative group">
                {/* Search icon */}
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input field */}
                <Input
                    ref={inputRef}
                    type="text"
                    inputMode="search"
                    placeholder="Tên sản phẩm hoặc mã vạch..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-11 pr-10 h-12 rounded-2xl text-base bg-card/80 dark:bg-card/60 backdrop-blur-sm border-border/50 shadow-sm focus:shadow-md focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                />

                {/* Clear button */}
                <AnimatePresence>
                    {value && (
                        <motion.button
                            type="button"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            whileTap={{ scale: 0.8 }}
                            onClick={() => {
                                onChange("");
                                inputRef.current?.focus();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Result count badge */}
            <AnimatePresence>
                {typeof resultCount === "number" && value && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute -bottom-6 left-1 text-xs text-muted-foreground"
                    >
                        Tìm thấy <span className="font-semibold text-foreground">{resultCount}</span> sản phẩm
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
