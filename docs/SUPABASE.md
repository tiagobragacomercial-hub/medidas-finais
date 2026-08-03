# Supabase

Estrutura remota vinculada para a futura versão online/nativa do Medidas Finais.

## Projeto vinculado

- Project Ref: `cvokxgqbteiuawxewgox`
- URL: `https://cvokxgqbteiuawxewgox.supabase.co`
- Migração `20260803021500_medidas_finais_core.sql`: aplicada e registrada remotamente.
- Auth Health: aprovado (`HTTP 200`).
- Acesso anônimo às tabelas internas: bloqueado (`HTTP 401`).
- Buckets `project-media` e `publication-files`: criados e privados.
- Chave pública local: configurada em `.env.local`, que permanece ignorado pelo Git.
- Chaves administrativas: não foram gravadas no repositório.
- Usuária proprietária: criada, e-mail confirmado e login validado.
- Organização `Medidas Finais`: criada com uma associação `owner`.
- RLS autenticado: a proprietária visualiza somente a organização autorizada.

## Conteúdo

- Migração PostgreSQL versionada em `supabase/migrations/`.
- Organizações e papéis `owner`, `admin`, `editor` e `viewer`.
- Clientes, projetos, ambientes, fotos, marcações e plantas.
- Recibos idempotentes de sincronização.
- Publicações imutáveis com token e código protegidos por hash.
- Auditoria.
- Buckets privados `project-media` e `publication-files`.
- RLS em todas as tabelas operacionais; usuário anônimo não lê dados internos.

## Ativação do aplicativo

1. Implementar o transporte SQLite/Dexie → Supabase sem acesso direto das telas.
2. Executar testes autenticados de RLS para os demais papéis.
3. Executar upload, checksum, conflito, repetição e restauração em ambiente de teste.
4. Configurar as variáveis no ambiente de hospedagem sem enviar segredos ao cliente.

Até essas etapas serem concluídas, o Supabase está provisionado e protegido, mas ainda não substitui o backend D1/R2 da versão web publicada. Essa separação evita migração prematura e perda dos dados existentes.
