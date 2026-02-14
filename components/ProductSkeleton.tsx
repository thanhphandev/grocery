"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProductSkeleton({ index = 0 }: { index?: number }) {
    return (
        <div
            className="animate-pulse"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <Card className="overflow-hidden border-border/30">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                    <div className="flex items-end justify-between mb-2.5">
                        <div>
                            <Skeleton className="h-3 w-14 mb-1.5" />
                            <Skeleton className="h-9 w-32" />
                        </div>
                        <div className="text-right">
                            <Skeleton className="h-3 w-10 mb-1.5 ml-auto" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-20" />
                </CardContent>
            </Card>
        </div>
    );
}
