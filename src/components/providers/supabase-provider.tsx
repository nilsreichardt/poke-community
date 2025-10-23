"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type SupabaseContextValue = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined
);

type ProviderProps = {
  children: React.ReactNode;
  initialSession: Session | null;
};

export function SupabaseProvider({ children, initialSession }: ProviderProps) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
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
