"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fastSearch } from "@/lib/search";
import type { Product } from "@/lib/db";

export function useSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fastSearch("").then((r) => {
            setResults(r);
            setIsReady(true);
        });
    }, []);

    const search = useCallback((searchQuery: string) => {
        setQuery(searchQuery);
        setIsLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            const searchResults = await fastSearch(searchQuery);
            setResults(searchResults);
            setIsLoading(false);
        }, 120);
    }, []);

    const searchImmediate = useCallback(async (searchQuery: string) => {
        setQuery(searchQuery);
        setIsLoading(true);
        const searchResults = await fastSearch(searchQuery);
        setResults(searchResults);
        setIsLoading(false);
        return searchResults;
    }, []);

    const refresh = useCallback(async () => {
        const searchResults = await fastSearch(query);
        setResults(searchResults);
    }, [query]);

    return { query, results, isLoading, isReady, search, searchImmediate, refresh };
}
