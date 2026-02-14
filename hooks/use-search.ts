"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { fastSearch } from "@/lib/search";
import type { Product } from "@/lib/types";

export function useSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [, startTransition] = useTransition();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const queryRef = useRef("");
    const initialLoadRef = useRef(false);

    // Initial load triggered on first render
    const initSearch = useCallback(async () => {
        if (initialLoadRef.current) return;
        initialLoadRef.current = true;
        const r = await fastSearch("");
        setResults(r);
        setIsReady(true);
    }, []);

    // Auto-init on first use
    if (!initialLoadRef.current) {
        initSearch();
    }

    const search = useCallback((searchQuery: string) => {
        setQuery(searchQuery);
        queryRef.current = searchQuery;
        setIsLoading(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Faster debounce for barcode-like input
        const delay = /^\d+$/.test(searchQuery.trim()) ? 100 : 250;

        debounceRef.current = setTimeout(async () => {
            const searchResults = await fastSearch(searchQuery);
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
