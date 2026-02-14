"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Camera, FlashlightOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [hasCamera, setHasCamera] = useState(true);
    const [manualInput, setManualInput] = useState("");
    const [isPausing, setIsPausing] = useState(false);
    const lastCodeRef = useRef("");
    const inputRef = useRef<HTMLInputElement>(null);
    const detectorRef = useRef<BarcodeDetector | null>(null);
    const rafRef = useRef<number>(0);
    const isPausingRef = useRef(false);

    // Keep ref in sync with state for the scan loop
    useEffect(() => {
        isPausingRef.current = isPausing;
    }, [isPausing]);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch {
            setHasCamera(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) {
                track.stop();
            }
            streamRef.current = null;
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
        }
    }, []);

    // Stable scan loop using refs instead of state dependencies
    const scanFrame = useCallback(() => {
        const loop = async () => {
            if (!videoRef.current || !detectorRef.current) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            if (!isPausingRef.current) {
                try {
                    const barcodes = await detectorRef.current.detect(videoRef.current);
                    if (barcodes.length > 0) {
                        const code = barcodes[0].rawValue;
                        if (code && code !== lastCodeRef.current && !isPausingRef.current) {
                            lastCodeRef.current = code;
                            isPausingRef.current = true;
                            setIsPausing(true);
                            onScan(code);

                            // Continuous scan: pause 2s then resume
                            setTimeout(() => {
                                isPausingRef.current = false;
                                setIsPausing(false);
                                lastCodeRef.current = "";
                            }, 2000);
                        }
                    }
                } catch {
                    // BarcodeDetector error, continue
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
    }, [onScan]);

    useEffect(() => {
        if (isOpen) {
            // Check for BarcodeDetector support
            if ("BarcodeDetector" in window) {
                detectorRef.current = new BarcodeDetector({
                    formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"],
                });
            }
            startCamera().then(() => {
                scanFrame();
            });
        } else {
            stopCamera();
            setIsPausing(false);
            isPausingRef.current = false;
            lastCodeRef.current = "";
            setManualInput("");
        }

        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera, scanFrame]);

    const handleManualSubmit = () => {
        if (manualInput.trim().length >= 4) {
            onScan(manualInput.trim());
            setManualInput("");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[60] bg-black flex flex-col"
                >
                    {/* Camera view */}
                    <div className="relative flex-1 overflow-hidden">
                        {hasCamera ? (
                            <>
                                <video
                                    ref={videoRef}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    playsInline
                                    muted
                                    autoPlay
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Viewfinder overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-black/50" />

                                    {/* Scan area */}
                                    <div className="relative w-72 h-44 z-10">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg" />

                                        {/* Animated scan line */}
                                        <motion.div
                                            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                                            animate={{ top: ["5%", "95%", "5%"] }}
                                            transition={{
                                                duration: 2.5,
                                                repeat: Number.POSITIVE_INFINITY,
                                                ease: "easeInOut",
                                            }}
                                        />

                                        <div className="absolute inset-0 rounded-lg" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div className="absolute top-16 inset-x-0 flex justify-center z-20">
                                    <motion.div
                                        animate={isPausing ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ duration: 0.5 }}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold ${isPausing
                                                ? "bg-success/90 text-white"
                                                : "bg-white/15 text-white backdrop-blur-sm"
                                            }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {isPausing ? (
                                                <>
                                                    <Zap className="w-3.5 h-3.5" />
                                                    Đã quét thành công!
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="w-3.5 h-3.5" />
                                                    Hướng camera vào mã vạch
                                                </>
                                            )}
                                        </span>
                                    </motion.div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
                                <FlashlightOff className="w-12 h-12 text-white/40 mb-4" />
                                <p className="text-white/70 text-center text-sm">
                                    Không thể truy cập camera. Hãy nhập mã vạch thủ công bên dưới.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom controls */}
                    <div className="relative z-20 bg-black/90 backdrop-blur-lg border-t border-white/10 px-4 pt-4 safe-bottom">
                        <div className="flex gap-2 mb-4">
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                                placeholder="Nhập mã vạch thủ công..."
                                className="flex-1 h-11 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 px-4 text-sm font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                            />
                            <Button
                                onClick={handleManualSubmit}
                                disabled={manualInput.trim().length < 4}
                                className="h-11 px-5 rounded-xl font-semibold"
                            >
                                Tra cứu
                            </Button>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// BarcodeDetector type declaration
declare global {
    interface BarcodeDetector {
        detect(image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<{ rawValue: string; format: string }[]>;
    }
    // biome-ignore lint/no-var: global augmentation
    var BarcodeDetector: {
        new(options?: { formats: string[] }): BarcodeDetector;
        prototype: BarcodeDetector;
        getSupportedFormats(): Promise<string[]>;
    };
}
