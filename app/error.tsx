"use client";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="content">
      <section className="card">
        <div className="eyebrow">Recuperação segura</div>
        <h1>Não foi possível concluir esta ação</h1>
        <p className="subtitle">
          Seus dados já salvos continuam no dispositivo. Tente novamente; se o
          problema persistir, exporte o backup antes de limpar qualquer dado.
        </p>
        <button className="btn primary" onClick={reset}>
          Tentar novamente
        </button>
        <details>
          <summary>Detalhes técnicos</summary>
          <pre>{error.message}</pre>
        </details>
      </section>
    </main>
  );
}
