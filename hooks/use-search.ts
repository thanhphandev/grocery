"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import type { Product } from "@/lib/types";

export type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  hasMore: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Adaptive debounce: 100ms for barcode (numeric), 200ms for text search
  useEffect(() => {
    const isNumeric = /^\d+$/.test(searchTerm.trim());
    const delay = isNumeric ? 100 : 200;
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryParams = new URLSearchParams({
    q: debouncedTerm.trim(),
    sort: sortBy,
    limit: "30",
  });
  const key = `/api/products?${queryParams.toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<SearchResult>(
    key,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 3000,
      // Stale-while-revalidate: show stale data while refetching
      revalidateIfStale: true,
      errorRetryCount: 2,
    },
  );

  const search = useCallback((query: string) => {
    setSearchTerm(query);
  }, []);

  const refresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  const removeOptimistically = useCallback(
    (id: string) => {
      mutate((current) => {
        if (!current) return current;
        return {
          ...current,
          products: current.products.filter((p) => p._id !== id),
          total: Math.max(0, current.total - 1),
        };
      }, false);
    },
    [mutate],
  );

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!data?.hasMore) return;
    const nextPage = (data?.page || 1) + 1;
    const nextParams = new URLSearchParams({
      q: debouncedTerm.trim(),
      sort: sortBy,
      limit: "30",
      page: String(nextPage),
    });
    try {
      const res = await fetch(`/api/products?${nextParams.toString()}`);
      if (!res.ok) return;
      const nextData: SearchResult = await res.json();
      mutate((current) => {
        if (!current) return nextData;
        return {
          ...nextData,
          products: [...current.products, ...nextData.products],
        };
      }, false);
    } catch {
      // ignore
    }
  }, [data?.hasMore, data?.page, debouncedTerm, sortBy, mutate]);

  return {
    query: searchTerm,
    results: data?.products || [],
    count: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isValidating,
    isError: !!error,
    isReady: !isLoading,
    sortBy,
    setSortBy,
    search,
    refresh,
    removeOptimistically,
    loadMore,
  };
}
