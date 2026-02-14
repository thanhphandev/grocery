"use client";

import { Check, Copy, MapPin, Package, Trash2 } from "lucide-react";
import NextImage from "next/image";
import { memo, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { thumbnailUrl } from "@/lib/cloudinary";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index: number;
  onClick?: () => void;
  isScanned?: boolean;
  onDelete?: (productId: string) => void;
}

export const ProductCard = memo(
  function ProductCard({
    product,
    index,
    onClick,
    isScanned,
    onDelete,
  }: ProductCardProps) {
    const [copied, setCopied] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const copyBarcode = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!product.barcode) return;
        navigator.clipboard.writeText(product.barcode);
        setCopied(true);
        toast.success("Đã sao chép mã vạch");
        setTimeout(() => setCopied(false), 1500);
      },
      [product.barcode],
    );

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!product._id) return;
        if (showDelete) {
          onDelete?.(product._id);
        } else {
          setShowDelete(true);
          if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
          deleteTimerRef.current = setTimeout(() => setShowDelete(false), 3000);
        }
      },
      [showDelete, onDelete, product._id],
    );

    const hasLocation = product.location && product.location.trim();

    // Optimized thumbnail URL (80×80, compressed)
    const optimizedThumb = thumbnailUrl(product.image);

    return (
      <Card
        className={`group cursor-pointer overflow-hidden transition-shadow duration-150 hover:shadow-lg active:scale-[0.99] border-border/40 ${
          isScanned
            ? "ring-2 ring-primary shadow-lg glow-primary"
            : "hover:border-primary/30"
        }`}
        onClick={onClick}
        style={{
          animationDelay: `${Math.min(index * 30, 150)}ms`,
        }}
      >
        <CardContent className="p-0">
          <div className="flex">
            {/* Product image thumbnail — optimized via Cloudinary transform */}
            {optimizedThumb && (
              <div className="w-20 shrink-0 bg-muted relative">
                <NextImage
                  src={optimizedThumb}
                  alt=""
                  fill
                  loading={index < 4 ? "eager" : "lazy"}
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              </div>
            )}

            <div className="flex-1 p-4 min-w-0">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[15px] leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {product.barcode && (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[11px] px-2 py-0.5 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={copyBarcode}
                      >
                        {copied ? (
                          <Check className="w-3 h-3 mr-1 text-primary" />
                        ) : (
                          <Copy className="w-3 h-3 mr-1 opacity-50" />
                        )}
                        {product.barcode}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 text-[11px] gap-1 py-1"
                >
                  <Package className="w-3 h-3" />
                  {product.unit}
                </Badge>
              </div>

              {/* Price row */}
              <div className="flex items-end justify-between gap-4 mb-2.5">
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">
                    Giá bán lẻ
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[32px] font-black leading-none tracking-tight price-gradient">
                      {formatPrice(product.prices.retail)}
                    </span>
                    <span className="text-lg font-bold text-price/70">đ</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">
                    Giá sỉ
                  </span>
                  <div className="flex items-baseline gap-0.5 justify-end">
                    <span className="text-xl font-bold text-price-wholesale tabular-nums">
                      {formatPrice(product.prices.wholesale)}
                    </span>
                    <span className="text-sm font-semibold text-price-wholesale/70">
                      đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Location + Delete */}
              <div className="flex items-center justify-between">
                {hasLocation ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary/70" />
                    <span className="font-medium">{product.location}</span>
                  </div>
                ) : (
                  <div />
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                      showDelete
                        ? "bg-destructive text-white scale-105"
                        : "text-muted-foreground/40 hover:text-destructive/60"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    {showDelete && "Xóa?"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
  (prev, next) =>
    prev.product._id === next.product._id &&
    prev.product.updatedAt === next.product.updatedAt &&
    prev.isScanned === next.isScanned &&
    prev.index === next.index,
);
