"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Zap, Plus, RefreshCw, CloudOff } from "lucide-react";
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
import { getProductByBarcode, fullSync } from "@/lib/search";
import { playSuccessFeedback, playErrorFeedback } from "@/lib/feedback";
import type { Product } from "@/lib/db";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
  localStorage.setItem("theme", mode);
}

export default function Home() {
  const { query, results, isLoading, isReady, search, searchImmediate, refresh } =
    useSearch();
  const [activeTab, setActiveTab] = useState("search");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [hasMongoDb, setHasMongoDb] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");

  // Theme initialization
  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    const initial = stored || "light";
    setTheme(initial);
    applyTheme(initial);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (localStorage.getItem("theme") === "system") {
        document.documentElement.classList.toggle("dark", mediaQuery.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    applyTheme(mode);
  };

  // Network status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    fetch("/api/products?q=__ping__")
      .then((res) => setHasMongoDb(res.ok))
      .catch(() => setHasMongoDb(false));

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const result = await fullSync();
      setSyncStatus(`↑ ${result.pushed} đẩy · ↓ ${result.pulled} kéo`);
      await searchImmediate(query);
    } catch {
      setSyncStatus("Lỗi đồng bộ");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleScan = useCallback(
    async (barcode: string) => {
      const product = await getProductByBarcode(barcode);
      if (product) {
        playSuccessFeedback();
        setScannedBarcode(barcode);
        search(barcode);
        setActiveTab("search");

        if (!isScannerOpen) {
          setSelectedProduct(product);
          setIsDetailOpen(true);
        }

        setTimeout(() => setScannedBarcode(null), 3000);
      } else {
        playErrorFeedback();
        setUnknownBarcode(barcode);
        setIsQuickAddOpen(true);
      }
    },
    [search, isScannerOpen]
  );

  useBarcodeScanner({
    onScan: handleScan,
    enabled: !isScannerOpen && !isQuickAddOpen,
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const openScanner = () => setIsScannerOpen(true);

  const openAddProduct = () => {
    setUnknownBarcode("");
    setIsQuickAddOpen(true);
  };

  const handleScannerBarcode = async (barcode: string) => {
    const product = await getProductByBarcode(barcode);
    if (product) {
      playSuccessFeedback();
      setScannedBarcode(barcode);
      setIsScannerOpen(false);
      setSelectedProduct(product);
      setIsDetailOpen(true);
      search(barcode);
      setActiveTab("search");
      setTimeout(() => setScannedBarcode(null), 3000);
    } else {
      playErrorFeedback();
      setIsScannerOpen(false);
      setUnknownBarcode(barcode);
      setIsQuickAddOpen(true);
    }
  };

  const handleQuickAddSuccess = () => {
    setIsQuickAddOpen(false);
    refresh();
  };

  // Tab titles
  const tabTitles: Record<string, string> = {
    search: "Tra cứu giá siêu tốc",
    history: "Lịch sử tra cứu",
    favorites: "Sản phẩm yêu thích",
    settings: "Cài đặt",
  };

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
                {tabTitles[activeTab] || "Tra cứu giá siêu tốc"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasMongoDb && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSync}
                disabled={isSyncing || !isOnline}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              </Button>
            )}

            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-colors ${isOnline
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
                }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {/* Sync status */}
        <AnimatePresence>
          {syncStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs font-medium text-center text-primary bg-primary/5 rounded-lg py-1.5 mb-2 overflow-hidden"
            >
              {syncStatus}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search bar — only on search tab */}
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
        {/* MongoDB notice */}
        {!hasMongoDb && isReady && activeTab === "search" && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/8 border border-warning/15 text-xs text-warning-foreground"
          >
            <CloudOff className="w-3.5 h-3.5 text-warning shrink-0" />
            <span>
              Offline mode. Thêm <code className="font-mono bg-warning/10 px-1 rounded">MONGODB_URI</code> vào <code className="font-mono bg-warning/10 px-1 rounded">.env.local</code> để đồng bộ.
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* SEARCH TAB */}
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
                      key={product.id || product.barcode}
                      product={product}
                      index={index}
                      onClick={() => handleProductClick(product)}
                      isScanned={product.barcode === scannedBarcode}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  query={query}
                  onScan={openScanner}
                  onSearch={() => {
                    const input = document.querySelector<HTMLInputElement>('input[type="text"]');
                    input?.focus();
                  }}
                />
              )}
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <HistoryView onProductClick={handleProductClick} />
            </motion.div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === "favorites" && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <FavoritesView onProductClick={handleProductClick} />
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
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
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onScanPress={openScanner}
      />

      {/* Overlays */}
      <ProductDetailSheet
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScannerBarcode}
      />

      <QuickAddOverlay
        barcode={unknownBarcode}
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdded={handleQuickAddSuccess}
      />
    </div>
  );
}
