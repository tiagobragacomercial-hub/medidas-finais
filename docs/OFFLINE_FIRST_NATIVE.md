# Contrato offline-first da versão móvel

Este documento é obrigatório para a futura versão Expo/SQLite. Nenhuma tela móvel poderá gravar diretamente no Supabase.

## Fluxo de escrita

1. A interface envia a alteração ao serviço local.
2. O serviço abre uma transação SQLite.
3. A mesma transação grava o registro e uma operação idempotente na fila.
4. A interface recebe `SALVO_LOCALMENTE`.
5. O sincronizador envia a operação quando existir conexão.
6. Somente um recibo válido do servidor permite marcar `SINCRONIZADO`.
7. Registro, arquivo e histórico locais permanecem disponíveis.

## Estados obrigatórios

- `SALVO_LOCALMENTE`
- `AGUARDANDO_SINCRONIZACAO`
- `SINCRONIZANDO`
- `SINCRONIZADO`
- `ERRO_DE_SINCRONIZACAO`
- `CONFLITO`

## Metadados mínimos

Todo registro sincronizável possui `id`, `project_id` quando aplicável, `created_at`, `updated_at`, `version`, `sync_status`, `device_id`, `deleted_at` e `last_sync_at`.

## Arquivos

Fotos, PDFs, assinaturas, áudios, plantas e documentos são copiados para a pasta permanente do aplicativo antes de entrarem na fila. A fila referencia o caminho permanente, tamanho, tipo e checksum. O arquivo local nunca é removido como consequência automática do upload.

## Conflitos

O servidor rejeita uma atualização cuja versão-base seja inferior à versão atual. Medidas e dados técnicos entram em `CONFLITO`; a interface mostra os dois valores e o histórico. Não existe resolução silenciosa por “última gravação”.

## Exclusão

Excluir define `deleted_at`, grava histórico e enfileira a alteração. A lixeira permite restauração durante o prazo configurado. Expurgo é uma tarefa separada e nunca ocorre antes da confirmação remota e do prazo de recuperação.

## Migrações e backup

- SQLite usa migrações numeradas e transacionais.
- Antes de migrações de risco, cria-se uma cópia verificável do banco.
- Produção nunca usa `DROP TABLE` ou exclusão ampla de dados como estratégia de atualização.
- A proteção possui três níveis: SQLite, Supabase e backup remoto separado.
- A tela Segurança oferecerá exportação completa com banco, arquivos, histórico e manifesto de versão.

## Testes bloqueantes antes do APK/AAB

- Criar e editar um projeto em modo avião.
- Fechar e reiniciar aplicativo e aparelho sem perder dados.
- Interromper a rede durante upload sem duplicar ou apagar a fila.
- Reconectar e confirmar recibos, versões e checksums.
- Produzir conflito entre dois dispositivos e resolvê-lo manualmente.
- Atualizar o aplicativo preservando o banco.
- Restaurar uma exclusão pela lixeira.
- Exportar e restaurar um backup completo.

APK, AAB, TestFlight e publicação em lojas ficam bloqueados enquanto qualquer teste acima falhar.
