# Arquitetura e garantias de dados

O aplicativo escreve primeiro no IndexedDB. Cada mutação de domínio e a respectiva operação de sincronização devem ocorrer na mesma transação. Operações possuem identificador idempotente e nunca são removidas antes da confirmação remota.

O servidor usa D1 para registros e metadados, R2 privado para arquivos e autorização por organização em todas as consultas. Publicações são snapshots imutáveis; o portal nunca lê rascunhos.

## Migrações locais

Migrações são aditivas, reiniciáveis e versionadas. Antes de uma migração estrutural, o aplicativo verifica espaço, exporta metadados de recuperação e registra o estágio. Mídias pendentes nunca são apagadas. Após a migração, contagens, chaves estrangeiras lógicas e checksums são conferidos.
