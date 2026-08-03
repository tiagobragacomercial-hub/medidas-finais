export default async function ClientPortal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="content">
      <section className="portal-cover">
        <div className="eyebrow">Pasta digital protegida</div>
        <h1>Medidas Finais para Produção</h1>
        <p>
          Acesso somente leitura. O conteúdo será exibido após validação do
          token no servidor.
        </p>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <p className="subtitle">
          Referência de acesso: {token.slice(0, 4)}••••
        </p>
        <p>Esta rota nunca permite criar, alterar ou excluir informações.</p>
      </section>
    </main>
  );
}
