# Testes

Cada fase executa lint, TypeScript, unidades, integração e build. A validação final inclui offline, migração, recuperação, conflitos, upload interrompido, autorização, portal, QR, PDF renderizado, voz, acessibilidade, responsividade e desempenho nos tamanhos definidos no Caderno Mestre.

O comando `npm run verify` executa lint, typecheck, unidades, integração, build e E2E de rotas. O teste manual é uma etapa adicional obrigatória e deve registrar dispositivo, navegador, data, fluxo executado e resultado em `docs/PROGRESSO.md`.
