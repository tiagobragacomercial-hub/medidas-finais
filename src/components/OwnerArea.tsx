"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, supabaseConfigured } from "../database/remote/supabase";
import { MedidasApp } from "./MedidasApp";

export function OwnerArea() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured()) {
      router.replace("/login");
      return;
    }
    const supabase = getSupabase();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthorized(true);
      else router.replace("/login");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setAuthorized(true);
      else router.replace("/login");
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  if (!authorized) {
    return (
      <main className="content">
        <section className="card" style={{ maxWidth: 480, margin: "8vh auto" }}>
          <p>Verificando acesso…</p>
        </section>
      </main>
    );
  }
  return <MedidasApp />;
}
