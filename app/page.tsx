"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { ProductSkeleton } from "@/components/ProductSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ProductDetailSheet } from "@/components/ProductDetailSheet";
import { QuickAddOverlay } from "@/components/QuickAddOverlay";
import { ScannerModal } from "@/components/ScannerModal";
import { HistoryView } from "@/components/HistoryView";
import { FavoritesView } from "@/components/FavoritesView";
import { SettingsView } from "@/components/SettingsView";
import { useSearch } from "@/hooks/use-search";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { getProductByBarcode, deleteProduct, getProductById } from "@/lib/search";
import { playSuccessFeedback, playErrorFeedback } from "@/lib/feedback";
import type { Product } from "@/lib/types";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else if (mode === "light") root.classList.remove("dark");
  else root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
  localStorage.setItem("theme", mode);
}

const TAB_TITLES: Record<string, string> = {
  search: "Tra cứu giá siêu tốc",
  history: "Lịch sử tra cứu",
  favorites: "Sản phẩm yêu thích",
  settings: "Cài đặt",
};

export default function Home() {
  const { query, results, isLoading, isReady, search, refresh } = useSearch();
  const [activeTab, setActiveTab] = useState("search");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");

  // Apply theme once on mount — safe from SSR hydration mismatch
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeMode) || "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const handleThemeChange = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    applyTheme(mode);
  }, []);

  // ─── Unified barcode handler (DRY) ──────────────────────
  const processBarcodeResult = useCallback(
    async (barcode: string, opts: { closeScanner?: boolean } = {}) => {
      const product = await getProductByBarcode(barcode);

      if (product) {
        playSuccessFeedback();
        setScannedBarcode(barcode);
        search(barcode);
        setActiveTab("search");

        if (opts.closeScanner) setIsScannerOpen(false);
        setSelectedProduct(product);
        setIsDetailOpen(true);

        setTimeout(() => setScannedBarcode(null), 3000);
      } else {
        playErrorFeedback();
        if (opts.closeScanner) setIsScannerOpen(false);
        setUnknownBarcode(barcode);
        setIsQuickAddOpen(true);
      }
    },
    [search]
  );

  // HID scanner handler (background keyboard events)
  const handleHidScan = useCallback(
    (barcode: string) => processBarcodeResult(barcode),
    [processBarcodeResult]
  );

  // Camera scanner handler
  const handleCameraScan = useCallback(
    (barcode: string) => processBarcodeResult(barcode, { closeScanner: true }),
    [processBarcodeResult]
  );

  useBarcodeScanner({
    onScan: handleHidScan,
    enabled: !isScannerOpen && !isQuickAddOpen,
  });

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  }, []);

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      await deleteProduct(productId);
      refresh();
    },
    [refresh]
  );

  const openScanner = useCallback(() => setIsScannerOpen(true), []);
  const openAddProduct = useCallback(() => {
    setUnknownBarcode("");
    setIsQuickAddOpen(true);
  }, []);

  const handleQuickAddSuccess = useCallback(() => {
    setIsQuickAddOpen(false);
    refresh();
  }, [refresh]);

  const handleDetailUpdated = useCallback(() => {
    refresh();
    if (selectedProduct?._id) {
      getProductById(selectedProduct._id).then((p) => {
        if (p) setSelectedProduct(p);
      });
    }
  }, [refresh, selectedProduct?._id]);

  const handleDetailDeleted = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedProduct(null);
    refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 pt-3 pb-2 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-foreground leading-none tracking-tight">
                SPEED-PRICE
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {TAB_TITLES[activeTab] || TAB_TITLES.search}
              </p>
            </div>
          </div>
        </div>

        {activeTab === "search" && (
          <SearchBar
            value={query}
            onChange={search}
            isLoading={isLoading}
            resultCount={query ? results.length : undefined}
          />
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pt-4 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {!isReady ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <ProductSkeleton key={`sk-${i}`} index={i} />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {results.map((product, index) => (
                    <ProductCard
                      key={product._id || index}
                      product={product}
                      index={index}
                      onClick={() => handleProductClick(product)}
                      isScanned={product.barcode === scannedBarcode}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  query={query}
                  onScan={openScanner}
                  onAdd={openAddProduct}
                  onSearch={() => {
                    document.querySelector<HTMLInputElement>('input[inputmode="search"]')?.focus();
                  }}
                />
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              <HistoryView onProductClick={handleProductClick} />
            </motion.div>
          )}

          {activeTab === "favorites" && (
            <motion.div key="favorites" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              <FavoritesView onProductClick={handleProductClick} />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              <SettingsView theme={theme} onThemeChange={handleThemeChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Add button */}
      {activeTab === "search" && (
        <motion.div
          className="fixed right-4 bottom-24 z-40"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        >
          <Button
            onClick={openAddProduct}
            size="icon-lg"
            className="w-12 h-12 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onScanPress={openScanner} />

      {/* Overlays */}
      <ProductDetailSheet
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdated={handleDetailUpdated}
        onDeleted={handleDetailDeleted}
      />

      <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleCameraScan} />

      <QuickAddOverlay
        barcode={unknownBarcode}
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdded={handleQuickAddSuccess}
      />
    </div>
  );
}
