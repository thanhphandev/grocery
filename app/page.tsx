"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownAZ,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Clock,
  Loader2,
  Plus,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { FavoritesView } from "@/components/FavoritesView";
import { HistoryView } from "@/components/HistoryView";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailSheet } from "@/components/ProductDetailSheet";
import { ProductSkeleton } from "@/components/ProductSkeleton";
import { QuickAddOverlay } from "@/components/QuickAddOverlay";
import { ScannerModal } from "@/components/ScannerModal";
import { SearchBar } from "@/components/SearchBar";
import { SettingsView } from "@/components/SettingsView";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { type SortOption, useSearch } from "@/hooks/use-search";
import { playErrorFeedback, playSuccessFeedback } from "@/lib/feedback";
import {
  deleteProduct,
  getProductByBarcode,
  getProductById,
} from "@/lib/search";
import type { Product } from "@/lib/types";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else if (mode === "light") root.classList.remove("dark");
  else
    root.classList.toggle(
      "dark",
      window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
  localStorage.setItem("theme", mode);
}

const TAB_TITLES: Record<string, string> = {
  search: "Tra cứu giá siêu tốc",
  history: "Lịch sử tra cứu",
  favorites: "Sản phẩm yêu thích",
  settings: "Cài đặt",
};

// Sort options config
const SORT_OPTIONS: { id: SortOption; label: string; icon: any }[] = [
  { id: "newest", label: "Mới nhất", icon: Clock },
  { id: "price_asc", label: "Giá tăng", icon: ArrowUpNarrowWide },
  { id: "price_desc", label: "Giá giảm", icon: ArrowDownNarrowWide },
  { id: "name_asc", label: "Tên A-Z", icon: ArrowDownAZ },
];

export default function Home() {
  const {
    query,
    results,
    isLoading,
    isValidating,
    isReady,
    hasMore,
    search,
    refresh,
    removeOptimistically,
    loadMore,
    sortBy,
    setSortBy,
  } = useSearch();

  const [activeTab, setActiveTab] = useState("search");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isOnline, setIsOnline] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Apply theme
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeMode) || "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Đã kết nối mạng", { duration: 2000 });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Mất kết nối mạng", { duration: 5000 });
    };

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !isValidating
        ) {
          setLoadingMore(true);
          loadMore().finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingMore, isValidating]);

  const handleThemeChange = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    applyTheme(mode);
  }, []);

  // ─── Unified barcode handler ────────────────────────────────
  const processBarcodeResult = useCallback(
    async (barcode: string, opts: { closeScanner?: boolean } = {}) => {
      try {
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
          toast.info("Sản phẩm chưa có, hãy thêm mới!");
        }
      } catch {
        toast.error("Lỗi khi tìm sản phẩm");
      }
    },
    [search],
  );

  // Scanner hooks
  useBarcodeScanner({
    onScan: useCallback((b) => processBarcodeResult(b), [processBarcodeResult]),
    enabled: !isScannerOpen && !isQuickAddOpen,
  });

  const handleCameraScan = useCallback(
    (b: string) => processBarcodeResult(b, { closeScanner: true }),
    [processBarcodeResult],
  );

  // Actions
  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  }, []);

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      removeOptimistically(productId);
      try {
        await deleteProduct(productId);
        refresh();
        toast.success("Đã xóa sản phẩm");
      } catch {
        refresh();
        toast.error("Không thể xóa");
      }
    },
    [refresh, removeOptimistically],
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


  // Render
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 px-4 pt-3 pb-2 bg-background border-b border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-foreground leading-none tracking-tight">
                Tạp Hóa Kênh 3
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {TAB_TITLES[activeTab] || TAB_TITLES.search}
              </p>
            </div>
          </div>

          {/* Connection status indicator */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20 animate-fade-in">
              <WifiOff className="w-3.5 h-3.5 text-destructive" />
              <span className="text-[10px] font-semibold text-destructive">
                Offline
              </span>
            </div>
          )}
        </div>

        {activeTab === "search" && (
          <>
            <SearchBar
              value={query}
              onChange={search}
              isLoading={isValidating}
              resultCount={undefined}
            />

            {/* Sort Chips & Count */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {/* Result count badge */}
              {query && results.length > 0 && (
                <div className="flex-shrink-0 px-2.5 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary">
                  {results.length} KQ
                </div>
              )}

              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </header>

      <main className="flex-1 px-4 pt-4 pb-28 overflow-y-auto">
        {activeTab === "search" && (
          <div className="animate-fade-in">
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

                {/* Infinite scroll sentinel */}
                {hasMore && (
                  <div ref={sentinelRef} className="flex justify-center py-4">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải thêm...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                query={query}
                onScan={openScanner}
                onAdd={openAddProduct}
                onSearch={() => {
                  document
                    .querySelector<HTMLInputElement>(
                      'input[inputmode="search"]',
                    )
                    ?.focus();
                }}
              />
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="animate-fade-in">
            <HistoryView onProductClick={handleProductClick} />
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="animate-fade-in">
            <FavoritesView onProductClick={handleProductClick} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-fade-in">
            <SettingsView theme={theme} onThemeChange={handleThemeChange} />
          </div>
        )}
      </main>

      {/* Floating button */}
      {activeTab === "search" && (
        <div className="fixed right-4 bottom-24 z-40 animate-fade-in">
          <Button
            onClick={openAddProduct}
            size="icon-lg"
            className="w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
          >
            <Plus className="w-7 h-7" />
          </Button>
        </div>
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onScanPress={openScanner}
      />

      <ProductDetailSheet
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdated={handleDetailUpdated}
        onDeleted={handleDetailDeleted}
      />

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleCameraScan}
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
