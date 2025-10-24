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
  undefined
);

type ProviderProps = {
  children: React.ReactNode;
  initialUser: User | null;
};

export function SupabaseProvider({ children, initialUser }: ProviderProps) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    let isActive = true;

    const syncUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isActive) {
        return;
      }
      if (error) {
        setUser(null);
        return;
      }
      setUser(data.user ?? null);
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncUser();
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
