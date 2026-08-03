# Mapa visual das 131 telas

Fonte: `Modelo_Completo_131_Telas_App_Web_Medidas_Finais (1).pdf`, com 138 páginas físicas e 131 telas numeradas. As regras do Pacote Final e do Caderno Mestre prevalecem sobre os mockups.

## Grupos e cobertura

| Telas   | Grupo                                          | Fase principal | Estado atual |
| ------- | ---------------------------------------------- | -------------: | ------------ |
| 001-010 | Acesso, PWA, instalação, migração e erros      |            0/8 | Parcial      |
| 011-020 | Dashboard, pesquisa e clientes                 |            1/8 | Parcial      |
| 021-030 | Projetos, pavimentos e ambientes               |              1 | Parcial      |
| 031-040 | Câmera, galeria, classificação, vídeo e falhas |          1/2/8 | Parcial      |
| 041-050 | Editor de medidas e exportação PNG             |            1/2 | Parcial      |
| 051-060 | Pontos, etiquetas, camadas e fotos de detalhe  |              2 | Parcial      |
| 061-070 | Voz, ambiguidades e modo contínuo              |              7 | Pendente     |
| 071-081 | Planta, vértices, aberturas e câmeras          |              3 | Em andamento |
| 082-091 | Revisão, sincronização, conflitos e backup     |            4/8 | Pendente     |
| 092-101 | PDF, preflight, publicação e compartilhamento  |            5/6 | Parcial      |
| 102-111 | Administração, usuários, auditoria e lixeira   |              8 | Pendente     |
| 112-121 | Acesso e navegação do portal                   |              6 | Parcial      |
| 122-131 | Mídias, downloads, PDF e offline do portal     |            6/8 | Pendente     |

## Estados obrigatórios por componente

Cada fluxo deve cobrir: inicial, vazio, carregando, sucesso, validação, offline, permissão negada, falha recuperável, conflito, indisponível, expirado/revogado e somente leitura quando aplicável.

Uma tela só muda para concluída quando rota, ação, persistência, autorização, responsividade e testes estiverem implementados. Mockup, texto fixo, botão inativo ou adaptador provisório sem identificação não contam como conclusão.

## Regras visuais extraídas

- Desktop: cabeçalho azul-escuro, navegação lateral, área central ampla e painel contextual quando necessário.
- Celular: cabeçalho compacto, ação primária larga, cartões em coluna e navegação inferior.
- Tablet: prioriza canvas, toque/caneta e painel de ferramentas acessível.
- Fundo cinza muito claro, superfícies brancas, divisões discretas, azul vivo para ações e cores semânticas para sincronização e alertas.
- Estados críticos sempre informam o que foi preservado e oferecem uma ação segura.
- Portal não compartilha navegação nem controles administrativos.
