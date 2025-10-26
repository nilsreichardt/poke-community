'use client';

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

type SearchFormProps = {
  defaultQuery: string;
  sort: "new" | "top";
};

export function SearchForm({ defaultQuery, sort }: SearchFormProps) {
  const [query, setQuery] = useState(defaultQuery);
  const router = useRouter();
  const pathname = usePathname();
  const pendingQueryRef = useRef<string | null>(null);
  const latestExpectedQueryRef = useRef(defaultQuery.trim());

  const navigateToQuery = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      pendingQueryRef.current = trimmed;
      latestExpectedQueryRef.current = trimmed;

      const params = new URLSearchParams();
      params.set("sort", sort);
      if (trimmed) {
        params.set("q", trimmed);
      }

      const queryString = params.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(href);
    },
    [pathname, router, sort],
  );

  useEffect(() => {
    const normalizedDefault = defaultQuery.trim();
    const pending = pendingQueryRef.current;

    if (pending !== null && normalizedDefault !== pending) {
      // Retry the newest search if an older server response arrives late.
      navigateToQuery(latestExpectedQueryRef.current);
      return;
    }

    pendingQueryRef.current = null;
    latestExpectedQueryRef.current = normalizedDefault;
    setQuery(defaultQuery);
  }, [defaultQuery, navigateToQuery]);

  const [debouncedSearch, cancelDebouncedSearch] = useDebouncedCallback(navigateToQuery, 300);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setQuery(nextValue);
      debouncedSearch(nextValue);
    },
    [debouncedSearch],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      cancelDebouncedSearch();
      navigateToQuery(query);
    },
    [cancelDebouncedSearch, navigateToQuery, query],
  );

  return (
    <form className="flex w-full flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <Input
        name="q"
        placeholder="Search by title, summary, or tags"
        value={query}
        onChange={handleChange}
        className="flex-1"
      />
      <Button type="submit" variant="outline">
        <SearchIcon className="-ml-0.5 h-4 w-4" />
        Search
      </Button>
    </form>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): [(...args: Parameters<T>) => void, () => void] {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCallback = useRef(callback);

  useEffect(() => {
    latestCallback.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const debounced = useMemo<(...args: Parameters<T>) => void>(
    () =>
      (...args: Parameters<T>) => {
        cancel();
        timerRef.current = setTimeout(() => {
          latestCallback.current(...args);
        }, delay);
      },
    [cancel, delay],
  );

  useEffect(() => cancel, [cancel]);

  return [debounced, cancel];
}
