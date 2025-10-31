'use client';

import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  const navigateToQuery = useCallback(
    (value: string) => {
      const trimmed = value.trim();

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

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      const nextTrimmed = nextValue.trim();
      const previousTrimmed = query.trim();

      setQuery(nextValue);

      if (nextTrimmed === "" && previousTrimmed !== "") {
        navigateToQuery("");
      }
    },
    [navigateToQuery, query],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      navigateToQuery(query.trim());
    },
    [navigateToQuery, query],
  );

  return (
    <form className="flex w-full flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <Input
        name="q"
        placeholder="Search by title, description, prompt or tags"
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
