# Arquitetura definitiva

## Decisão

A arquitetura oficial da versão móvel será:

`SQLite local → fila persistente → Supabase → backup independente no Google Drive`

O Supabase Storage armazenará inicialmente fotografias, PDFs e documentos. Cloudflare R2 será introduzido por migração controlada quando volume, custo ou desempenho justificarem.

## Fonte primária no aparelho

SQLite é a fonte usada por todas as telas móveis e guarda clientes, projetos, ambientes, medidas, observações, checklists, perguntas, assinaturas, histórico, fila de sincronização e caminhos permanentes dos arquivos.

Nenhuma ação da interface depende de resposta do Supabase para ser salva. Registro e operação de fila são gravados na mesma transação local.

## Cópia online

Supabase fornece PostgreSQL, autenticação, permissões, histórico, identificação de arquivos, sincronização entre dispositivos e dados publicados para o portal do cliente.

O Supabase não substitui o SQLite. A confirmação online apenas altera o estado da operação local para `SINCRONIZADO`.

## Fotografias e documentos

1. O arquivo é copiado para o diretório permanente do aplicativo.
2. Existência, tamanho e checksum são verificados.
3. O caminho e os metadados são gravados no SQLite.
4. O upload entra na fila persistente.
5. A cópia local é mantida após o aceite do servidor.

O bucket inicial é privado no Supabase Storage. Links de acesso são temporários e emitidos apenas após validação de permissão.

## Evolução para R2

A migração para R2 preservará os identificadores dos arquivos. PostgreSQL continuará guardando metadados, versão, checksum e o provedor de armazenamento. Durante a migração, leitura poderá consultar ambos os provedores; um arquivo só será marcado como migrado após verificação de checksum no R2. A origem não será removida automaticamente.

## Backup independente no Google Drive

O backup periódico terá manifesto versionado e, quando aplicável, esta estrutura:

```text
backup-AAAA-MM-DD.zip
├── banco.sqlite
├── banco-supabase.sql
├── fotos/
├── documentos/
└── informacoes-do-backup.json
```

O manifesto registra versão do aplicativo e dos bancos, data, dispositivo, organização, quantidade de registros/arquivos e checksums. O backup será criptografado antes do envio e testado periodicamente por restauração. Credenciais do Drive não serão incluídas no aplicativo, repositório ou arquivo de backup.

## Regras que não podem ser alteradas

- As telas móveis leem e gravam SQLite.
- A nuvem é uma segunda cópia, nunca condição para salvar.
- A fila não é apagada antes do recibo válido do servidor.
- Conflitos técnicos não são resolvidos silenciosamente.
- Exclusões são lógicas e recuperáveis.
- Migrações não recriam o banco nem apagam dados.
- Google Drive é backup independente, não banco operacional.
- R2 é evolução de armazenamento, não substituto do Supabase PostgreSQL.
