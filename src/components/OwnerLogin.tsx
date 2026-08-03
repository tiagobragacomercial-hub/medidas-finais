"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, supabaseConfigured } from "../database/remote/supabase";

export function OwnerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured()) return;
    void getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin");
    });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabaseConfigured()) {
      setMessage("A autenticação ainda não está configurada neste ambiente.");
      return;
    }

    setLoading(true);
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setMessage("E-mail ou senha incorretos. Confira os dados e tente novamente.");
      return;
    }
    router.replace("/admin");
  }

  return (
    <main className="content">
      <section className="card" style={{ maxWidth: 480, margin: "8vh auto" }}>
        <div className="eyebrow">Acesso protegido</div>
        <h1>Entrar no Medidas Finais</h1>
        <p className="subtitle">Use a conta autorizada da proprietária.</p>
        <form className="field" onSubmit={submit}>
          <label htmlFor="owner-email">E-mail</label>
          <input
            id="owner-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="owner-password">Senha</label>
          <input
            id="owner-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {message ? <p role="alert">{message}</p> : null}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
