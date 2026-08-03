# Progresso

- Fase atual: Fase 8 — Refinamento e produção.
- Implementado: Fundação, MVP local e motor inicial de marcações completas.
- Verificação pendente: Fases 0–2 precisam completar teste manual antes de serem novamente marcadas como concluídas.
- Em andamento: Fase 3 funcionalmente implementada; validação manual visual ainda pendente por indisponibilidade do navegador integrado.
- Fase 4: processador automático da fila implementado com repetição ao reconectar, aceite remoto idempotente em D1, fotos em R2 e preservação integral da cópia IndexedDB.
- Fases 5–7: PDF A4 paisagem estruturado, publicação imutável com QR/código, portal somente leitura com download protegido e voz com transcrição/confirmacão implementados.
- Pendente: teste manual visual final e itens avançados ainda não cobertos da Fase 2.
- Testes automáticos atuais: lint aprovado; TypeScript aprovado; 5 testes unitários aprovados; 2 testes de integração IndexedDB aprovados; build aprovado; 5 testes E2E de rotas aprovados.
- Planta baixa: persistência local com migração Dexie v4, retificação opcional, seleção e movimentação de vértices/elementos, exclusão, sentido de abertura de porta e câmera vinculada a foto do ambiente. Nenhuma medida é inferida.
- Defeito encontrado e corrigido pelos testes: índice `entityId` ausente na fila de sincronização; migração local v3 adicionada.
- Teste manual: pendente. O navegador integrado não estava disponível nesta sessão; nenhuma fase foi aprovada com base apenas nos testes de rota.
- Bloqueios: nenhuma credencial impede desenvolvimento; três imagens de referência citadas no pacote não foram encontradas.
- Decisões: IndexedDB/Dexie local, D1 para registros, R2 privado para mídias, adaptadores de fornecedor.
- Supabase: pasta, migração PostgreSQL, buckets privados, RLS e adaptador configurável preparados. Aplicação remota aguarda autorização/login em um projeto Supabase.
- Versão móvel: contrato offline-first registrado em `docs/OFFLINE_FIRST_NATIVE.md`. APK/AAB ficam bloqueados até os testes de persistência, conflito, migração e restauração passarem.
- Próxima ação: publicar a versão, validar migrações e executar teste manual assim que um navegador integrado estiver disponível.

## Testes de aceitação bloqueantes

- [ ] Criar cliente, projeto e ambiente sem internet.
- [ ] Fechar e reabrir sem perder dados.
- [ ] Importar foto e criar medidas editáveis.
- [x] Sincronizar automaticamente quando a internet voltar (integração automatizada; validação remota após deploy pendente).
- [ ] Gerar PDF sem cortes ou sobreposições.
- [ ] Abrir o projeto pelo QR Code e pelo código.
- [ ] Cliente visualiza e baixa conteúdo autorizado.
- [x] API bloqueia edição e exclusão pelo cliente.
- [ ] Fluxos validados em celular, tablet e computador.

## Referência visual de 131 telas

- PDF integral lido e amostras de dashboard, editor, planta, PDF e portal revisadas visualmente.
- Matriz de cobertura registrada em `docs/TELAS_E_ESTADOS.md`.
- A conclusão das fases passa a exigir também a cobertura dos estados e adaptações desktop/celular correspondentes.
