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
- Cotas da planta: ferramenta manual de dois pontos com valor real digitado pelo usuário, unidade do projeto, edição, exclusão, persistência, sincronização e renderização no PDF. A confirmação é bloqueada enquanto existir cota sem valor.
- Defeito encontrado e corrigido pelos testes: índice `entityId` ausente na fila de sincronização; migração local v3 adicionada.
- Teste manual: pendente. O navegador integrado não estava disponível nesta sessão; nenhuma fase foi aprovada com base apenas nos testes de rota.
- Bloqueios: nenhuma credencial impede desenvolvimento; três imagens de referência citadas no pacote não foram encontradas.
- Decisões: IndexedDB/Dexie local, D1 para registros, R2 privado para mídias, adaptadores de fornecedor.
- Supabase: projeto `cvokxgqbteiuawxewgox` vinculado, migração aplicada, Auth validado, acesso anônimo bloqueado e buckets privados confirmados. Proprietária e organização criadas; login e RLS de `owner` aprovados. Cutover aguarda testes dos demais papéis e transporte offline-first completo.
- Versão móvel: contrato offline-first registrado em `docs/OFFLINE_FIRST_NATIVE.md`. APK/AAB ficam bloqueados até os testes de persistência, conflito, migração e restauração passarem.
- Arquitetura definitiva aprovada: SQLite + Supabase + Supabase Storage + backup criptografado no Google Drive; R2 será adotado posteriormente por migração verificada se o volume de arquivos justificar. Detalhes em `docs/ARQUITETURA_DEFINITIVA.md`.
- Identidade visual: arte oficial aplicada sem alteração em `public/app-icon.png` (web/PWA/aba) e `assets/icon.png` (futura compilação móvel).
- Pré-APK: definições confirmadas, recursos necessários e bloqueios de produto/loja registrados em `docs/PRE_APK.md`. Nenhum identificador permanente será inventado ou compilado sem confirmação.
- Próxima ação: publicar a versão, validar migrações e executar teste manual assim que um navegador integrado estiver disponível.
- Vercel: prévia de produção publicada em `https://medidas-finais-beryl.vercel.app`; variáveis públicas do Supabase cadastradas no ambiente de produção.
- Autenticação: fluxo antigo exclusivo do ambiente ChatGPT removido da entrada principal. Login real da proprietária via Supabase implementado, com sessão persistente e proteção da rota `/admin`.
- Verificação após correção do login: lint, TypeScript, 5 testes unitários, 3 testes de integração, build e 6 testes E2E aprovados.
- Auditoria de controles: navegação superior, Configurações, Abrir levantamento, seleção de projeto/ambiente/foto, seleção da planta, seleção da publicação e saída da conta agora possuem ações reais. Componente legado com botão inativo removido.
- Verificação após auditoria funcional: lint sem avisos, TypeScript, 6 testes unitários, 3 testes de integração, build e 6 testes E2E aprovados. Validação visual/manual em navegador continua pendente por indisponibilidade do navegador integrado.
- Aplicativo móvel iniciado em `mobile/` com Expo SDK 57 e TypeScript. SQLite WAL, migração numerada, identificador do dispositivo, clientes, projetos e fila idempotente são gravados localmente em transações.
- Móvel: autenticação Supabase usa armazenamento seguro; painel permite criar cliente/projeto offline, reabrir dados locais, visualizar pendências e sair da conta. Nenhuma tela móvel grava diretamente na nuvem.
- Validação móvel: TypeScript aprovado, Expo Doctor 20/20 e bundle Android de produção gerado com sucesso. APK instalável bloqueado externamente: SDK Android não existe neste computador, EAS não está autenticado e o identificador Android permanente ainda precisa de aprovação.
- Referência em vídeo de 03/08/2026 analisada integralmente (1min51s). Editor de fotos agora permite reposicionar manualmente ponto inicial, ponto final e etiqueta da medida; textos livres também podem ser arrastados para qualquer posição.
- Planta baixa agora possui ferramenta de texto livre, edição e arraste; pontos e etiqueta de cada cota manual podem ser movidos independentemente. Posições persistem localmente, entram no PDF/PNG e possuem colunas aditivas no Supabase pela migração `20260803154500_free_position_measurements_and_texts.sql`.
- Verificação após comportamento de cotas/textos: lint, tipos web/móvel, 7 testes unitários, 3 de integração, build e 6 E2E aprovados.
- Quatro vídeos de referência de planta analisados focando exclusivamente o gesto. Planta web alterada para múltiplos traços contínuos à mão livre por toque/mouse/caneta, com retificação opcional, preservação de plantas antigas e persistência no Supabase pela migração `20260803170000_floor_plan_freehand_strokes.sql`.
- Componentes de planta: porta pronta com folha e arco de abertura; janela pronta com representação própria. Ambos podem ser inseridos, arrastados, girados e excluídos sem usar imagens fixas dos vídeos.
- Verificação após desenho livre: lint, tipos web/móvel, 8 testes unitários, 3 de integração, build e 6 E2E aprovados.

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
