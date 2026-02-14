"use client";

import useSWR from "swr";
import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/lib/types";

export type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

interface SearchResult {
    products: Product[];
    total: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSearch() {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const queryParams = new URLSearchParams({
        q: debouncedTerm.trim(),
        sort: sortBy,
    });
    const key = `/api/products?${queryParams.toString()}`;

    const { data, error, isLoading, isValidating, mutate } = useSWR<SearchResult>(
        key,
        fetcher,
        {
            keepPreviousData: true,
            revalidateOnFocus: false,
            dedupingInterval: 2000,
        }
    );

    const search = useCallback((query: string) => {
        setSearchTerm(query);
    }, []);

    const refresh = useCallback(() => {
        return mutate();
    }, [mutate]);

    const removeOptimistically = useCallback((id: string) => {
        mutate((current) => {
            if (!current) return current;
            return {
                ...current,
                products: current.products.filter((p) => p._id !== id),
                total: Math.max(0, current.total - 1),
            };
        }, false);
    }, [mutate]);

    return {
        query: searchTerm,
        results: data?.products || [],
        count: data?.total || 0,
        isLoading,
        isValidating,
        isError: !!error,
        isReady: !isLoading,
        sortBy,
        setSortBy,
        search,
        refresh,
        removeOptimistically,
    };
}
