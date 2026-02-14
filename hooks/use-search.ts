"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { fastSearch } from "@/lib/search";
import type { Product } from "@/lib/db";

export function useSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [, startTransition] = useTransition();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const queryRef = useRef("");

    useEffect(() => {
        fastSearch("").then((r) => {
            setResults(r);
            setIsReady(true);
        });
    }, []);

    const search = useCallback((searchQuery: string) => {
        setQuery(searchQuery);
        queryRef.current = searchQuery;
        setIsLoading(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Instant search for barcode-like input (pure numbers)
        const delay = /^\d+$/.test(searchQuery.trim()) ? 80 : 200;

        debounceRef.current = setTimeout(async () => {
            const searchResults = await fastSearch(searchQuery);
            // Only update if query hasn't changed during async search
            if (queryRef.current === searchQuery) {
                startTransition(() => {
                    setResults(searchResults);
                    setIsLoading(false);
                });
            }
        }, delay);
    }, []);

    const searchImmediate = useCallback(async (searchQuery: string) => {
        setQuery(searchQuery);
        queryRef.current = searchQuery;
        setIsLoading(true);
        const searchResults = await fastSearch(searchQuery);
        startTransition(() => {
            setResults(searchResults);
            setIsLoading(false);
        });
        return searchResults;
    }, []);

    const refresh = useCallback(async () => {
        const searchResults = await fastSearch(queryRef.current);
        startTransition(() => {
            setResults(searchResults);
        });
    }, []);

    return { query, results, isLoading, isReady, search, searchImmediate, refresh };
}
