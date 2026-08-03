# Decisões técnicas

1. PWA React/TypeScript com Vinext para execução web responsiva.
2. IndexedDB via Dexie é a fonte operacional offline; D1 recebe dados sincronizados e R2 guarda arquivos privados.
3. Coordenadas vetoriais são normalizadas entre 0 e 1.
4. Operações de sincronização são idempotentes e a mídia local só pode ser limpa após confirmação remota.
5. Publicações são snapshots imutáveis separados de rascunhos.
6. Voz, e-mail, armazenamento, autenticação e URLs temporárias usam adaptadores substituíveis.
7. PDF é gerado de dados estruturados em A4 paisagem e passa por preflight.
