# Especificação e Implementação de um Sistema Distribuído para Tours Virtuais de Imóveis: o Caso Inner View

**Fabricio Varisco, Gustavo Potrich, Lucas Krug, Matheus Thiesen**

Universidade do Vale do Rio dos Sinos (Unisinos), São Leopoldo, RS, Brasil

---

**Abstract.** *This paper specifies the distributed system behind Inner View, a virtual tour platform for real estate agencies. Each design choice is justified: a three-tier client-server architecture, JSON over HTTP marshaling with NestJS acting as a broker middleware, request-reply as the communication paradigm, and centralized mutual exclusion through PostgreSQL advisory locks. The implemented feature is concurrent tour editing: when two agents edit the same tour through different API replicas, only one of them enters the critical section and the other receives an HTTP 409 response.*

**Resumo.** *Este artigo especifica o sistema distribuído do Inner View, uma plataforma de tours virtuais para imobiliárias, e justifica cada escolha de projeto: arquitetura cliente-servidor em três camadas, empacotamento em JSON sobre HTTP com o NestJS como middleware no papel de broker, requisição-resposta como paradigma de comunicação e exclusão mútua centralizada com advisory locks do PostgreSQL. A funcionalidade implementada é a edição concorrente de um tour: quando dois corretores editam o mesmo tour por réplicas diferentes da API, apenas um entra na região crítica, e o outro recebe a resposta HTTP 409.*

## 1. Introdução

O Inner View é um sistema de tours virtuais de imóveis. O corretor ou o administrador de uma imobiliária cadastra o imóvel, envia um panorama 360° de cada cômodo e liga os cômodos por *hotspots*. O visitante abre um link compartilhado e percorre o imóvel sem ir até ele. Cada visita fica registrada como uma visualização, para a análise da imobiliária.

O sistema tem dois componentes executáveis em processos e máquinas diferentes. O primeiro é o cliente `inner-view-client` (Ionic e Angular, porta 4200), que roda no navegador ou no celular. O segundo é a API `server-api` (NestJS e Prisma, porta 3000), que persiste os dados num PostgreSQL 16 (porta 5432). Os dois se comunicam somente pela rede, trocando mensagens. Pela definição de Coulouris et al. (2013), isso caracteriza um sistema distribuído.

Este trabalho especifica o sistema (Seção 2), descreve a funcionalidade implementada, a edição do tour com exclusão mútua (Seção 3), e encerra com as limitações e os trabalhos futuros (Seção 4).

## 2. Especificação do Sistema Distribuído

### 2.1. Questões de projeto

Coulouris et al. (2013) apontam desafios que todo sistema distribuído precisa tratar. Para cada um, indicamos como o Inner View o aborda e por quê.

- **Heterogeneidade.** Cliente (navegador ou celular) e servidor (Node.js em contêiner Linux) rodam em plataformas diferentes. Os dois conversam por HTTP com JSON, um formato independente de linguagem e de sistema operacional. Assim, nenhum lado depende da implementação do outro.
- **Abertura.** A interface da API é REST e está publicada no Swagger, em `/docs`. Qualquer cliente novo, como um app nativo ou um parceiro, consegue integrar a partir dessa documentação, sem acesso ao código.
- **Segurança.** A autenticação usa JWT de acesso, válido por 1 dia, e de refresh, válido por 7 dias (`token.service.ts`). Os *guards* do NestJS conferem o papel do usuário, e o `agencyId` do token restringe cada consulta à imobiliária dele. O Zod valida toda entrada antes da regra de negócio. Em produção, o tráfego passa por HTTPS. Com isso, confidencialidade e integridade ficam a cargo do canal, e a autorização fica no servidor, que é o único ponto confiável.
- **Escalabilidade.** A API não guarda sessão em memória: todo estado fica no PostgreSQL, e a identidade vem no token. Por isso dá para subir várias réplicas atrás de um balanceador sem afinidade de sessão.
- **Tratamento de falhas.** O `docker-compose.yml` só sobe a API depois que o *healthcheck* do banco passa, e reinicia os contêineres com `restart: unless-stopped`. As escritas compostas, como a criação do tour com panoramas e *hotspots*, rodam numa transação: se algo falha no meio, nada fica gravado pela metade.
- **Concorrência.** Dois corretores da mesma imobiliária podem editar o mesmo tour ao mesmo tempo, e as requisições podem cair em réplicas diferentes. Esse é o recurso compartilhado que exige exclusão mútua (Seção 2.5).
- **Transparência.** O proxy `/api` (`proxy.conf.json`) esconde do cliente onde a API está, o que dá transparência de localização. O balanceador esconde quantas réplicas existem, o que dá transparência de replicação.
- **Qualidade de serviço.** Os panoramas trafegam em base64 dentro do JSON. Por isso o limite do corpo foi ampliado para 50 MB em `main.ts`. Isso torna o upload mais lento, mas mantém uma interface só.

### 2.2. Arquitetura

O sistema usa a arquitetura **cliente-servidor em três camadas**: apresentação (cliente Ionic), lógica de aplicação (réplicas da API NestJS) e dados (PostgreSQL).

```
 Corretor ─┐                    ┌─ API #1 (NestJS :3000) ─┐
 Admin ────┼─ HTTP+JSON ─ Proxy/┤                         ├─ SQL ─ PostgreSQL :5432
 Visitante ┘              balanc.└─ API #2 (NestJS :3001) ─┘
```

*Figura 1. Arquitetura do Inner View, com duas réplicas da API.*

**Justificativa.** (i) Os tours, panoramas e *hotspots* de uma imobiliária precisam ter uma só fonte de verdade, consistente para todos os visitantes. (ii) A autorização por imobiliária precisa estar num ponto confiável, e num modelo *peer-to-peer* cada par teria que confiar nos demais. (iii) Os clientes são efêmeros: o visitante abre o link, navega e sai, e não sobram pares estáveis para guardar ou repassar dados. (iv) Como a camada de lógica não guarda estado, a escala horizontal se resume a adicionar réplicas. O P2P compensa quando os recursos estão espalhados entre os usuários [Coulouris et al. 2013]. No Inner View, eles pertencem à imobiliária, então o P2P foi descartado.

### 2.3. Empacotamento e desempacotamento

O empacotamento (*marshaling*) converte as estruturas de dados da memória numa sequência de bytes para transmitir, e o desempacotamento (*unmarshaling*) faz o caminho inverso [Coulouris et al. 2013]. No Inner View, o formato é **JSON sobre HTTP**, e o caminho da mensagem é:

1. **Cliente:** o `HttpClient` do Angular serializa o objeto TypeScript com `JSON.stringify` e envia `PATCH /virtual-tours/:id`, com `Content-Type: application/json`.
2. **Servidor:** o *body-parser* do Express desserializa o corpo em objeto JavaScript.
3. **Validação:** o `ZodValidationPipe` (`common/pipes/zod-validation.pipe.ts`) confere o esquema e devolve 400 se o corpo for inválido. O resultado é um DTO tipado.
4. O *controller* repassa o DTO ao *service*, e o Prisma o traduz em SQL para o PostgreSQL. Na volta, o objeto de resposta é serializado em JSON pelo NestJS.

O NestJS é o middleware que cumpre o papel do padrão **Broker** [Microsoft 2004]. O cliente não sabe qual componente atende a requisição: o framework localiza o *controller* pela rota, aplica *guards* e *pipes* e chama o *service*. No cliente, o `HttpClient` funciona como o proxy do lado cliente, escondendo serialização e transporte.

**Justificativa.** O JSON é nativo em TypeScript nos dois lados e dispensa a geração de *stubs*. Também é legível e testável com `curl`, e fica documentado no Swagger. A falta de tipos no JSON é compensada pelo Zod. Formatos binários como Protobuf, usado pelo gRPC, reduziriam o tamanho das mensagens, mas exigiriam um proxy (gRPC-Web) no navegador e tirariam a legibilidade do contrato. Na escala de uma imobiliária, esse custo não se paga.

### 2.4. Paradigma de comunicação

O paradigma adotado é a **invocação remota pelo protocolo requisição-resposta**, em estilo REST [Fielding 2000]. A Tabela 1 compara as alternativas.

*Tabela 1. Paradigmas de comunicação avaliados.*

| Paradigma | Uso possível no Inner View | Decisão |
| --- | --- | --- |
| Requisição-resposta (REST) | Criar e editar tour, listar imóveis | **Adotado.** O corretor precisa de confirmação imediata (200, 400, 409). O HTTP é *stateless* e passa por proxies e balanceadores. |
| RPC / RMI | Stubs gRPC ou Java RMI | Não. O navegador não fala gRPC nativamente, e o RMI amarra tudo ao Java. O REST oferece a mesma semântica. |
| Publicação-assinatura | Visualização como evento para a analytics | Trabalho futuro. O volume atual é baixo. |
| Fila de mensagens | Gerar miniaturas dos panoramas fora da requisição | Trabalho futuro, se o upload virar gargalo. |
| Comunicação em grupo / memória compartilhada | Réplicas sincronizando estado | Não. As réplicas não guardam estado, e o PostgreSQL faz o papel de memória compartilhada. |

**Justificativa.** Todas as operações do corretor são interativas e precisam do resultado para seguir: um tour só pode ganhar *hotspots* depois que os panoramas existem. O acoplamento temporal da requisição-resposta, então, faz parte do requisito, e não é um defeito. A comunicação indireta compensaria em fluxos assíncronos e de muitos consumidores, que hoje não existem.

### 2.5. Exclusão mútua distribuída

**Região crítica.** É a atualização de um tour virtual e dos seus panoramas e *hotspots*. Sem coordenação, duas réplicas leem a mesma versão do tour e gravam por cima uma da outra, o que causa uma **atualização perdida**. Pior: um corretor pode apagar o panorama da cozinha enquanto o outro cria um *hotspot* apontando para ele. Um *mutex* em memória não resolve, porque vale só dentro de um processo Node.js, e a réplica #2 não o enxerga.

**Requisitos** [Coulouris et al. 2013]: **EM1 (segurança)**, no máximo um processo na região crítica por vez; **EM2 (vivacidade)**, todo pedido acaba sendo atendido ou recusado, sem *deadlock* e sem lock órfão.

**Algoritmo escolhido: servidor central**, com o PostgreSQL como coordenador. Cada tour é mapeado para uma chave inteira com `hashtext(tourId)`. A réplica abre uma transação e chama `pg_try_advisory_xact_lock(chave)` [PostgreSQL 2023]. Se a função retorna `true`, a réplica é dona da região crítica até o `COMMIT` ou o `ROLLBACK`, quando o banco libera o lock sozinho. Se retorna `false`, outra réplica está editando, e a API responde `409 Conflict`.

**Justificativa.** (i) **Segurança:** há um só coordenador, então nunca existem dois donos. (ii) **Sem lock órfão:** o lock pertence à transação, e se a réplica cair, a conexão fecha e o banco libera o lock, o que atende EM2. (iii) **Sem deadlock:** a variante *try* não bloqueia e responde na hora. (iv) **Granularidade:** há um lock por tour, então edições em tours diferentes correm em paralelo. Os algoritmos de Ricart-Agrawala e de anel lógico exigem que os processos se conheçam e troquem mensagens entre si. As réplicas da API são efêmeras e não se conhecem, mas já compartilham o PostgreSQL, que é o coordenador natural. A fraqueza clássica do servidor central, o ponto único de falha, não acrescenta risco aqui: sem banco, não há edição de qualquer forma.

## 3. Implementação

A funcionalidade escolhida é a **edição concorrente do tour virtual**. Ela fica no caso de uso `UpdateVirtualTourService` (`server-api/src/modules/virtual-tours/services/update-virtual-tour.service.ts`), exposto em `PATCH /virtual-tours/:id`. Hoje o service faz uma busca e uma atualização sem coordenação. A mudança, mostrada a seguir, envolve as duas numa transação protegida pelo lock:

```ts
async execute(id: string, dto: UpdateVirtualTourDto, currentUser: JwtPayload) {
  // Região crítica: todas as operações dentro de uma única transação.
  return this.prisma.$transaction(async (tx) => {
    // Pede o lock ao PostgreSQL (coordenador central). Não bloqueia.
    const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtext(${id})) AS locked`;

    // Outra réplica está editando este tour: recusa sem esperar.
    if (!locked) throw new ConflictException('Tour em edição por outro usuário');

    // Só edita tours da imobiliária do usuário logado.
    const tour = await tx.virtualTour.findFirst({
      where: { id, property: { agencyId: currentUser.agencyId } },
    });
    if (!tour) throw new NotFoundException('Virtual tour not found');

    return tx.virtualTour.update({ where: { id }, data: { status: dto.status } });
  }); // COMMIT ou ROLLBACK liberam o lock automaticamente
}
```

**Decisões de implementação.** (i) O lock fica no *service* e não no *controller*, porque é regra do caso de uso. O *controller* continua só repassando a chamada, e o comportamento pode ser testado com o dublê do Prisma (`src/test/prisma-mock.ts`), como o resto da suíte. (ii) Usamos o lock de transação (`xact`) e não o de sessão, porque o Prisma reaproveita conexões de um *pool*: um lock de sessão poderia continuar preso numa conexão devolvida ao *pool*. (iii) A recusa imediata com 409, em vez de espera, mantém a requisição curta e deixa a decisão de tentar de novo com o usuário. Esse é o comportamento esperado de uma interface de edição.

**Contrato HTTP.** `200` editou; `409` outro usuário está editando; `404` o tour não existe ou não é da imobiliária; `400` corpo inválido, rejeitado pelo Zod antes do *service*.

**Demonstração.** O banco e a réplica #1 sobem com `docker compose up -d` (porta 3000). A réplica #2 sobe no *host* com `PORT=3001 yarn start:dev`, apontando para o mesmo banco. Depois do login com o corretor do *seed* (`POST /auth/signin`), duas requisições `PATCH` para o mesmo tour, uma em cada porta, saem em paralelo. Uma recebe 200 e a outra 409. Para a janela de concorrência ficar visível no vídeo, um `pg_sleep(3)` temporário dentro da transação segura o lock. A consulta `SELECT * FROM pg_locks WHERE locktype = 'advisory'` mostra o dono do lock durante a edição.

## 4. Conclusão

A especificação trata o Inner View como um sistema cliente-servidor em três camadas: JSON sobre HTTP, o NestJS no papel de broker e requisição-resposta como paradigma. São escolhas simples, justificadas pela natureza interativa das operações e pela escala de uma imobiliária. A exclusão mútua centralizada no PostgreSQL resolve a atualização perdida entre réplicas, sem infraestrutura nova e sem lock órfão. A principal limitação é a dependência do banco como coordenador e como ponto único de falha, risco que já existia para a persistência. Como trabalhos futuros ficam a publicação-assinatura para os eventos de visualização e uma fila de mensagens para gerar miniaturas dos panoramas fora da requisição.

## Referências

Coulouris, G., Dollimore, J., Kindberg, T. e Blair, G. (2013). *Sistemas Distribuídos: Conceitos e Projeto*. Bookman, Porto Alegre, 5ª edição.

Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures*. Tese de doutorado, University of California, Irvine.

Microsoft (2004). Broker. In *Enterprise Solution Patterns Using Microsoft .NET*, Microsoft Patterns & Practices. Disponível em: https://docs.microsoft.com/en-us/previous-versions/msp-n-p/ff648096(v=pandp.10).

NestJS (2024). Pipes, Guards e Controllers. *NestJS Documentation*. Disponível em: https://docs.nestjs.com.

PostgreSQL Global Development Group (2023). Advisory Locks e Advisory Lock Functions. *PostgreSQL 16 Documentation*, seções 13.3.5 e 9.27.10. Disponível em: https://www.postgresql.org/docs/16/.

Tanenbaum, A. S. e Van Steen, M. (2017). *Distributed Systems*. Maarten van Steen, 3ª edição.
