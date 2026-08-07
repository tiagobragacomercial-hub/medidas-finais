"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
  getOwnerLoginEmail,
  getSupabase,
  supabaseConfigured,
} from "../database/remote/supabase";

export function OwnerLogin() {
  const router = useRouter();
  const ownerEmail = getOwnerLoginEmail();
  const [email, setEmail] = useState(ownerEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    setRemember(
      window.localStorage.getItem("medidas-finais-manter-conectado") !==
        "false",
    );
    if (!supabaseConfigured()) return;
    void getSupabase()
      .auth.getSession()
      .then(({ data }) => {
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
    window.localStorage.setItem(
      "medidas-finais-manter-conectado",
      String(remember),
    );
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setMessage(
        "E-mail ou senha incorretos. Confira os dados e tente novamente.",
      );
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
          <label htmlFor="owner-email">E-mail de acesso</label>
          <input
            id="owner-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="owner-password">Senha</label>
          <div className="password-field">
            <input
              id="owner-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <label className="remember-login">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Manter conectado neste aparelho</span>
          </label>
          {message ? <p role="alert">{message}</p> : null}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
