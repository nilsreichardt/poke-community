"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type SupabaseContextValue = {
  supabase: SupabaseClient<Database>;
  user: User | null;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined,
);

type ProviderProps = {
  children: React.ReactNode;
  initialUser: User | null;
};

export function SupabaseProvider({ children, initialUser }: ProviderProps) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    let isActive = true;

    const syncFromSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (!isActive) {
        return;
      }
      if (error) {
        setUser(null);
        return;
      }
      setUser(session?.user ?? null);
    };

    void syncFromSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, user }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
}
