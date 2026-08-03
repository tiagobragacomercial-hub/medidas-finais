export default function Access() {
  return (
    <main className="content">
      <section className="card" style={{ maxWidth: 520, margin: "8vh auto" }}>
        <div className="eyebrow">Pasta digital</div>
        <h1>Acessar minha pasta</h1>
        <p className="subtitle">
          Digite o código fornecido pelo responsável pelas medidas.
        </p>
        <form className="field" action="/api/access" method="post">
          <label htmlFor="code">Código do cliente</label>
          <input id="code" name="code" required autoComplete="one-time-code" />
          <button className="btn primary" type="submit">
            Acessar
          </button>
        </form>
      </section>
    </main>
  );
}
