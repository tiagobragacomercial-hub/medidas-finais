# Medidas Finais para Produção

PWA offline-first para registrar levantamentos técnicos com fotos e marcações vetoriais. A imagem original e as anotações são armazenadas separadamente e nenhuma medida é inferida pela fotografia.

## Executar

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Para validar: `npm run lint`, `npx tsc --noEmit`, `npm run build` e `npm test`.

## Marco funcional atual

- PWA responsiva com service worker e manifesto instalável.
- IndexedDB versionado para clientes, projetos, ambientes, fotos, marcações e fila de sincronização.
- Cadastro, arquivamento e restauração de clientes; criação de projetos e ambientes.
- Importação local de JPG/PNG/HEIC quando o navegador suporta o formato.
- Editor com coordenadas normalizadas, medidas lineares, proteção, seleção, desbloqueio, correção e ocultação.
- Planta vetorial inicial, indicadores offline, fila local e portal somente leitura demonstrativo.
- QR Code real e PDF local A4 paisagem gerado de dados estruturados.

## Segurança e dados remotos

O uso local não exige credenciais. Para produção, configure as variáveis de `.env.example`, o banco relacional e o armazenamento privado. Os bindings lógicos `DB` e `MEDIA` estão declarados para hospedagem. O adaptador remoto, autenticação, regras por organização, uploads retomáveis e publicação real ainda precisam ser conectados antes de uso com clientes reais.

## Limitações declaradas

Este repositório contém a fundação e um MVP local testável, não as nove fases concluídas. Ferramentas em L/ângulo/pontos, desenho livre completo, servidor, conflitos multidispositivo, PDF multipágina com preflight, portal autenticado, voz e auditoria completa permanecem como próximos marcos. Não trate os cartões dessas áreas como implementação de produção.

## Política de atualização

Migrações do Dexie devem sempre criar uma nova versão e nunca apagar tabelas ou blobs pendentes. A cópia local de mídia não pode ser removida antes da confirmação do armazenamento remoto.
