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

    const optimizedThumb = thumbnailUrl(product.image);
    const hasLocation = product.location && product.location.trim() !== "";

    return (
      <Card
        className={`group cursor-pointer overflow-hidden transition-colors duration-200 border-border ${isScanned
          ? "bg-primary/5 ring-1 ring-primary border-primary"
          : "hover:border-primary/50 hover:bg-muted/30"
          }`}
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="flex">
            {/* Product image thumbnail — optimized via Cloudinary transform */}
            {optimizedThumb && (
              <div className="w-20 shrink-0 bg-muted relative border-r border-border/50">
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

            <div className="flex-1 p-3.5 min-w-0">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[15px] leading-tight text-foreground line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {product.barcode && (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px] px-1.5 py-0.5 h-5 cursor-pointer hover:bg-muted-foreground/10 transition-colors border-transparent bg-muted"
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
                  className="shrink-0 text-[10px] h-6 px-2 font-normal text-muted-foreground bg-background"
                >
                  <Package className="w-3 h-3 mr-1" />
                  {product.unit}
                </Badge>
              </div>

              {/* Price row */}
              <div className="flex items-end justify-between gap-4 mb-2">
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/80 block mb-0.5">
                    Giá bán lẻ
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[1.35rem] font-bold leading-none tracking-tight text-price">
                      {formatPrice(product.prices.retail)}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">đ</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/80 block mb-0.5">
                    Giá sỉ
                  </span>
                  <div className="flex items-baseline gap-0.5 justify-end">
                    <span className="text-base font-bold text-price-wholesale tabular-nums">
                      {formatPrice(product.prices.wholesale)}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Location + Delete */}
              <div className="flex items-center justify-between pt-1 border-t border-dashed border-border/60">
                {hasLocation ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-medium">{product.location}</span>
                  </div>
                ) : (
                  <div />
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${showDelete
                      ? "bg-destructive text-destructive-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {showDelete ? "Xác nhận xóa" : "Xóa"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);