# Supabase

Estrutura preparada para a futura versão online/nativa do Medidas Finais.

## Conteúdo

- Migração PostgreSQL versionada em `supabase/migrations/`.
- Organizações e papéis `owner`, `admin`, `editor` e `viewer`.
- Clientes, projetos, ambientes, fotos, marcações e plantas.
- Recibos idempotentes de sincronização.
- Publicações imutáveis com token e código protegidos por hash.
- Auditoria.
- Buckets privados `project-media` e `publication-files`.
- RLS em todas as tabelas operacionais; usuário anônimo não lê dados internos.

## Ativação

1. Vincular este diretório a um projeto Supabase autorizado.
2. Aplicar as migrações com a CLI do Supabase.
3. Configurar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Manter `SUPABASE_SERVICE_ROLE_KEY` somente no servidor; nunca no aplicativo.
5. Criar a primeira organização e associar o usuário proprietário.
6. Executar os testes de RLS, upload privado e sincronização antes de habilitar o adaptador.

Até essas etapas serem concluídas com credenciais válidas, o adaptador não substitui o backend atual e não coloca dados existentes em risco.
