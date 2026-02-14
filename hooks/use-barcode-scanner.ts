"use client";

import { useEffect, useCallback, useRef } from "react";

interface UseBarcodeScanner {
    onScan: (barcode: string) => void;
    enabled?: boolean;
}

/**
 * Listens for HID barcode scanner input (rapid keystrokes ending with Enter).
 * Scanners emulate keyboard input at very high speed (<50ms between characters).
 */
export function useBarcodeScanner({ onScan, enabled = true }: UseBarcodeScanner) {
    const bufferRef = useRef("");
    const lastKeystrokeRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!enabled) return;

            // Ignore if user is typing in an input field
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            const now = Date.now();
            const timeDiff = now - lastKeystrokeRef.current;

            // If Enter key and buffer has content, it's a completed scan
            if (e.key === "Enter" && bufferRef.current.length >= 4) {
                e.preventDefault();
                const barcode = bufferRef.current;
                bufferRef.current = "";
                onScan(barcode);
                return;
            }

            // If too much time between keystrokes, reset buffer
            if (timeDiff > 100) {
                bufferRef.current = "";
            }

            // Only accept printable characters
            if (e.key.length === 1) {
                bufferRef.current += e.key;
                lastKeystrokeRef.current = now;

                // Auto-clear buffer after 300ms of inactivity
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    bufferRef.current = "";
                }, 300);
            }
        },
        [enabled, onScan]
    );

    useEffect(() => {
        if (enabled) {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [enabled, handleKeyDown]);
}
