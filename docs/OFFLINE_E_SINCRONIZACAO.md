# Offline e sincronização

As mutações são persistidas localmente antes de qualquer rede. A fila registra operação, entidade, versão, tentativas e erro. Reenvios são idempotentes; uploads usam checksum e retomada. Conflitos do mesmo campo exigem escolha explícita. Arquivos locais não sincronizados nunca são limpos automaticamente.
