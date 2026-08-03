import Link from "next/link";
export default function NotFound() {
  return (
    <main className="content">
      <section className="card empty">
        <h1>Página não encontrada</h1>
        <p>O endereço pode ter expirado ou sido revogado.</p>
        <Link className="btn primary" href="/">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
