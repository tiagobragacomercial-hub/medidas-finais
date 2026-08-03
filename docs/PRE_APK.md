# Preparação obrigatória antes do APK

Nenhum APK definitivo, AAB, TestFlight ou publicação em loja poderá ser gerado enquanto um item bloqueante deste documento estiver pendente.

## Confirmado

- Produto: **Medidas Finais**.
- Nome curto atual: **Medidas Finais**.
- Arte principal: `assets/icon.png`, fornecida e aprovada pela responsável.
- Arquitetura: SQLite local, Supabase, Supabase Storage, backup no Google Drive e futura migração opcional para R2.
- Salvamento automático: imediato e sempre local primeiro.
- Sincronização: automática ao reconectar, com repetição manual disponível.
- Lixeira: 90 dias.
- Histórico: não é apagado automaticamente.
- Backup externo: diário quando houver Wi-Fi, sujeito a energia e autorização do usuário.
- Arquivos locais: permanecem no aparelho; nenhuma remoção automática ocorre após upload.
- Ambientes isolados: desenvolvimento, teste e produção, com bancos, buckets, chaves, identificadores visuais e canais de atualização separados.
- Portal do cliente: somente conteúdo publicado e autorizado; nenhuma edição ou exclusão.

## Identidade visual

- Azul-marinho: `#092c4c`.
- Azul de sincronização: `#0876db`.
- Fundo claro: `#f5f8fb`.
- Grafite: `#172534`.
- Verde de sucesso: `#16845b`.
- Laranja de pendência: `#a86705`.
- Vermelho de erro: `#ba3341`.
- Dourado do ícone será usado como destaque discreto, sem prejudicar contraste.
- Tipografia atual: Geist no sistema web; a versão móvel utilizará fonte compatível e métricas verificadas em Android/iOS.

## Arquivos gráficos ainda necessários

A arte aprovada tem 1254 × 1254 e permanece como fonte original. Antes da compilação móvel serão derivados e inspecionados, sem redesenhar a marca:

- ícone principal de loja 1024 × 1024, sem transparência;
- foreground e background do ícone adaptável Android;
- ícone monocromático Android;
- ícone de notificação 96 × 96, branco e transparente;
- splash claro e escuro;
- capturas e imagem promocional das lojas.

As versões pequenas devem ser testadas em tamanho real. Se textos ou detalhes perderem leitura, será preparada uma variante simplificada utilizando apenas o símbolo MF, mantendo a arte aprovada como logo completa.

## Papéis propostos para validação

| Papel | Escopo inicial |
|---|---|
| Administradora | Acesso completo, usuários, publicação, backup e restauração |
| Designer | Criar e editar projetos autorizados |
| Medidor | Medidas, fotos, observações e checklists autorizados |
| Montador | Visualização e checklist |
| Cliente | Somente conteúdo publicado e autorizado |

Permissões serão aplicadas no servidor com RLS e também refletidas na interface. Ocultar um botão não substitui a autorização do backend.

## Permissões do aparelho

Solicitar somente no momento de uso, com explicação em português:

- câmera: registrar ambientes e anexar fotos ao projeto;
- biblioteca de fotos: selecionar imagens solicitadas pelo usuário;
- arquivos: importar ou exportar documentos escolhidos pelo usuário;
- notificações: avisos operacionais escolhidos pelo usuário;
- biometria: desbloqueio local, somente se habilitado;
- internet: sincronização, backup e portal.

Permissão negada não pode apagar dados nem impedir funções offline não relacionadas.

## Dados e sincronização

A tela obrigatória deverá mostrar separadamente:

- salvo neste aparelho;
- última sincronização confirmada;
- itens pendentes;
- erros e conflitos;
- sincronizar agora;
- criar e restaurar backup;
- exportar projeto.

Mensagens oficiais:

- `Salvo neste aparelho`;
- `Salvo na nuvem`;
- `Aguardando sincronização`;
- `Falha no envio — seus dados permanecem no aparelho`.

## Notificações permitidas

Backup concluído, sincronização concluída, erro de sincronização, novo projeto compartilhado, pergunta do cliente, prazo e pendência. Cada categoria será opcional e configurável. Não serão enviados dados técnicos ou pessoais no texto visível da notificação.

## Bloqueios que exigem decisão da responsável

- nome completo oficial nas lojas;
- nome curto sob o ícone, caso deva ser apenas “Medidas”;
- nome jurídico/comercial da empresa responsável;
- identificador permanente Android e iOS;
- e-mail e endereço de suporte;
- login: senha, PIN, biometria e política de bloqueio;
- limite de aparelhos por usuário;
- limite/alerta de armazenamento local;
- política de privacidade e termos de uso aprovados;
- categoria e textos das lojas;
- prazo e responsável pela retenção dos backups.

`com.francianebraga.medidasfinais` permanece apenas como candidato e não será gravado na primeira compilação sem confirmação explícita.

## Ordem de liberação

1. Fechar os bloqueios acima.
2. Preparar e inspecionar os recursos gráficos.
3. Implementar SQLite, arquivos permanentes e fila na versão Expo.
4. Aplicar autenticação, RLS, conflito, backup e restauração.
5. Testar desenvolvimento.
6. Gerar APK interno no ambiente de teste.
7. Executar todos os testes offline e de recuperação.
8. Corrigir falhas e repetir a suíte.
9. Aprovação explícita da responsável.
10. Somente então gerar AAB/TestFlight e materiais de loja.
