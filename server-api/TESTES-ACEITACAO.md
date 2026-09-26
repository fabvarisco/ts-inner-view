# Testes de Aceitação — Módulo Virtual Tours

Documento dos cenários escolhidos para os testes unitários do módulo `virtual-tours`
e a escrita dos respectivos testes de aceitação no formato **Dado / Quando / Então**.

- **Projeto:** `server-api` (NestJS + Prisma + Zod)
- **Suíte:** Jest + ts-jest (`yarn test`)
- **Situação atual:** 10 suítes, 52 testes, todos passando
- **Última execução:** 26/09/2026

---

## 1. Estratégia de teste

Os testes são **unitários e isolados do banco de dados**. Cada caso de uso é
instanciado diretamente (`new Service(prisma)`), recebendo um dublê do
`PrismaService`, de modo que o teste controla o retorno de cada consulta e pode
inspecionar exatamente o que seria gravado.

| Arquivo | Papel |
| --- | --- |
| `src/test/prisma-mock.ts` | Dublê do `PrismaService` com os delegates usados pelo módulo (`property`, `virtualTour`, `panorama`, `measurement`, `hotspot`, `visitor`, `view`, `share`, `$transaction`). O `$transaction` executa o callback recebido passando o próprio mock como `tx`, então o corpo da transação roda de verdade no teste. |
| `src/test/virtual-tour.fixtures.ts` | Dados de apoio: identificadores fixos, imagem 360° fictícia, usuários autenticados (`corretor`, `corretorDeOutraImobiliaria`, `administrador`) e o construtor `createTourDto()` — um tour de dois cômodos (Sala inicial → Cozinha), com uma medida e hotspots nos dois sentidos. |
| `src/test/stubs/prisma-client.stub.ts` | Stub do client gerado pelo Prisma, mapeado no Jest via `moduleNameMapper`, para que a suíte rode sem `prisma generate`. |

Três níveis de cenário foram escolhidos:

1. **Casos de uso (services)** — regra de negócio: o que é gravado, em que ordem,
   dentro de qual transação, e quais operações são recusadas.
2. **Contrato dos handlers (controllers)** — se o handler repassa ao caso de uso o
   corpo validado, o parâmetro de rota e o usuário autenticado, e qual resposta devolve.
3. **Validação de entrada (DTOs Zod + `ZodValidationPipe`)** — as regras de formato
   do requisito recusadas já na borda da API, antes de chegar ao caso de uso.

Duas preocupações atravessam todos os cenários de escrita:

- **Isolamento por imobiliária (multi-tenant):** toda operação autenticada busca o
  recurso filtrando pela `agencyId` do usuário logado; o usuário de outra
  imobiliária recebe "não encontrado", nunca "proibido".
- **Falha não deixa rastro:** quando a operação é recusada, nada é gravado — os
  testes verificam explicitamente que as escritas *não* foram chamadas.

### Como executar

```bash
yarn test                     # suíte completa
yarn test --coverage          # com cobertura
yarn jest src/modules/virtual-tours/services   # só os casos de uso
```

---

## 2. Inventário dos cenários

| Cenário | Descrição | Arquivo |
| --- | --- | --- |
| **US01 — Criação do tour virtual** | | `services/create-virtual-tour.service.spec.ts` |
| CEN-01 | Cria o tour de um imóvel que ainda não possui tour | |
| CEN-01.1 | Grava tudo dentro de uma única transação | |
| CEN-03 | Um panorama por cômodo, preservando ordem e panorama inicial | |
| CEN-06 | Hotspots criados resolvendo `tempId` → id real do panorama | |
| CEN-07 | Recusa hotspot cujo destino não está na lista enviada | |
| CEN-12 | Registra as medidas informadas para cada cômodo | |
| CEN-12.1 | Não consulta o banco quando o cômodo não tem medidas | |
| CEN-02 | Impede um segundo tour para o mesmo imóvel | |
| CEN-21 | Recusa a criação quando o imóvel não existe | |
| CEN-22 | Recusa a criação para imóvel de outra imobiliária | |
| **US04 — Publicação e arquivamento** | | `services/update-virtual-tour.service.spec.ts` |
| CEN-14 | Publica o tour virtual do imóvel | |
| CEN-17 | Arquiva um tour publicado | |
| CEN-23 | Recusa a alteração de tour inexistente | |
| CEN-24 | Recusa a alteração de tour de outra imobiliária | |
| **US05 — Visita ao tour** | | `services/find-virtual-tour.service.spec.ts` |
| CEN-19 | Devolve o tour completo, panoramas ordenados e hotspots de navegação | |
| CEN-19.1 | Inclui a imagem 360° de cada panorama | |
| CEN-25 | Recusa a visita a um tour inexistente | |
| **US06 — Remoção do tour** | | `services/delete-virtual-tour.service.spec.ts` |
| CEN-26 | Remove o tour da própria imobiliária | |
| CEN-27 | Recusa a remoção de tour inexistente | |
| CEN-28 | Recusa a remoção de tour de outra imobiliária | |
| **US07 — Miniatura do tour** | | `services/get-thumbnail.service.spec.ts` |
| CEN-29 | Usa o panorama inicial como miniatura | |
| CEN-30 | Converte data URL nos bytes da imagem | |
| CEN-30.1 | Aceita base64 puro, sem prefixo | |
| CEN-31 | Recusa a miniatura quando o tour não tem panoramas | |
| **US08 — Registro de visualizações** | | `services/record-view.service.spec.ts` |
| CEN-32 | Registra a visualização vinculada ao visitante da sessão | |
| CEN-33 | Reaproveita o visitante quando a sessão já é conhecida | |
| CEN-33.1 | Aceita visualização sem duração e sem dispositivo | |
| CEN-34 | Não registra visualização de tour inexistente | |
| **US09 — Registro de compartilhamentos** | | `services/record-share.service.spec.ts` |
| CEN-35 | Registra o compartilhamento com o canal utilizado | |
| CEN-36 | Reaproveita o visitante da sessão | |
| CEN-37 | Não registra compartilhamento de tour inexistente | |
| **US10 — Analytics do tour** | | `services/get-analytics.service.spec.ts` |
| CEN-38 | Consolida visualizações, compartilhamentos e tempo médio | |
| CEN-39 | Ignora visualizações sem duração no cálculo da média | |
| CEN-40 | Tempo médio zero quando nenhuma visita teve duração medida | |
| CEN-41 | Recusa analytics de tour inexistente | |
| CEN-42 | Recusa analytics de tour de outra imobiliária | |
| **Contrato HTTP dos handlers** | | `controllers/virtual-tours.controllers.spec.ts` |
| CEN-43 a CEN-50 | Cada endpoint repassa os dados validados ao caso de uso e devolve a resposta esperada | |
| **Validação de entrada (borda da API)** | | `dto/virtual-tour-dto.spec.ts` |
| CEN-51 | Aplica os valores padrão do cômodo | |
| CEN-52 | Recusa cômodo sem nome ou sem imagem 360° | |
| CEN-13 | Recusa medida com valor zero, negativo ou sem descrição | |
| CEN-12.2 | Assume metro como unidade padrão da medida | |
| CEN-53 | Recusa hotspot sem destino informado | |
| CEN-54 | Recusa criação sem um imóvel válido | |
| CEN-18 | Aceita apenas `DRAFT`, `PUBLISHED` e `ARCHIVED` | |
| CEN-55 | Recusa visualização sem sessão ou com duração inválida | |

---

## 3. Testes de aceitação

### US01 — Criação do tour virtual

> Como corretor, quero criar o tour virtual de um imóvel e adicionar os panoramas
> de cada cômodo, para que o cliente possa visitar o imóvel a distância.

**Pré-condição comum:** o imóvel existe, pertence à imobiliária do corretor e
ainda não tem tour virtual.

**CEN-01 — Cria o tour virtual de um imóvel que ainda não possui tour**
- **Dado** um imóvel cadastrado, sem tour virtual, e o tour montado pelo corretor
- **Quando** o corretor cria o tour virtual do imóvel
- **Então** o tour é criado para aquele imóvel já com status `PUBLISHED`
- **E** o tour completo é devolvido ao corretor

**CEN-01.1 — Grava tudo dentro de uma única transação**
- **Dado** o tour montado pelo corretor
- **Quando** o tour é criado
- **Então** panoramas, medidas e hotspots são gravados em uma só transação
  (uma falha parcial não deixa tour incompleto)

**CEN-03 — Persiste um panorama por cômodo, preservando ordem e panorama inicial**
- **Dado** um tour com a Sala (inicial, ordem 0) e a Cozinha (ordem 1)
- **Quando** o tour é criado
- **Então** cada cômodo vira um panorama vinculado ao tour
- **E** a ordem de exibição e a marcação de panorama inicial são preservadas

**CEN-06 — Cria os hotspots resolvendo os `tempId` para os ids dos panoramas gravados**
- **Dado** um tour em que a Sala aponta para a Cozinha e a Cozinha aponta para a Sala
- **Quando** o tour é criado
- **Então** cada hotspot é gravado com origem e destino já resolvidos para os ids
  reais dos panoramas, com rótulo e posição informados

**CEN-07 — Recusa hotspot cujo destino não está na lista de panoramas enviada**
- **Dado** um tour em que a Sala aponta para um cômodo que não foi enviado
- **Quando** o corretor tenta criar o tour
- **Então** a operação é recusada com `400 Bad Request`, apontando o destino inválido
  (`targetTempId "temp-inexistente" not found in panoramas list`)
- **E** nenhum hotspot é gravado

**CEN-12 — Registra as medidas informadas para cada cômodo**
- **Dado** um tour em que a Sala tem uma medida de largura (4,5 m)
- **Quando** o tour é criado
- **Então** a medida é gravada vinculada ao panorama da Sala

**CEN-12.1 — Não chama o banco quando o cômodo não tem medidas**
- **Dado** um tour com um único cômodo, sem medidas e sem hotspots
- **Quando** o tour é criado
- **Então** nenhuma gravação de medida é disparada

**CEN-02 — Impede a criação de um segundo tour virtual para o mesmo imóvel**
- **Dado** um imóvel que já possui um tour virtual
- **Quando** o corretor tenta criar outro tour para o mesmo imóvel
- **Então** a operação é recusada com `409 Conflict`
  (`Virtual tour already exists for this property`)
- **E** nenhum tour é criado

**CEN-21 — Recusa a criação quando o imóvel não existe**
- **Dado** um `propertyId` que não corresponde a nenhum imóvel
- **Quando** o corretor tenta criar o tour
- **Então** a operação é recusada com `404 Not Found`
- **E** a transação de gravação nem é aberta

**CEN-22 — Recusa a criação de tour para imóvel de outra imobiliária**
- **Dado** um corretor de outra imobiliária
- **Quando** ele tenta criar o tour do imóvel
- **Então** a operação é recusada como `Property not found`
- **E** o imóvel é procurado apenas dentro da imobiliária do usuário logado
  (a consulta é filtrada por `agencyId`)

---

### US04 — Publicação e arquivamento

> Como corretor, quero publicar o tour virtual quando ele estiver pronto e
> arquivá-lo quando o imóvel sair da carteira, controlando o que o cliente vê.

**CEN-14 — Publica o tour virtual do imóvel**
- **Dado** um tour em rascunho (`DRAFT`) da imobiliária do corretor
- **Quando** o corretor publica o tour
- **Então** o status passa a `PUBLISHED`
- **E** o tour atualizado é devolvido

**CEN-17 — Arquiva um tour publicado**
- **Dado** um tour com status `PUBLISHED`
- **Quando** o corretor arquiva o tour
- **Então** o tour fica com status `ARCHIVED`

**CEN-23 — Recusa a alteração de tour que não existe**
- **Dado** um id que não corresponde a nenhum tour
- **Quando** o corretor tenta publicar
- **Então** a operação é recusada com `404 Not Found`
- **E** nada é atualizado

**CEN-24 — Recusa a alteração de tour de outra imobiliária**
- **Dado** um corretor de outra imobiliária
- **Quando** ele tenta arquivar o tour
- **Então** a operação é recusada como `Virtual tour not found`
- **E** o tour é procurado apenas entre os imóveis da imobiliária dele

---

### US05 — Visita ao tour virtual

> Como cliente, quero visitar o tour virtual do imóvel, começando pelo panorama
> inicial e navegando pelos hotspots entre os cômodos.

**CEN-19 — Devolve o tour completo, com panoramas ordenados e hotspots de navegação**
- **Dado** um tour publicado com Sala (inicial) e Cozinha ligadas por um hotspot
- **Quando** o cliente abre o tour
- **Então** recebe o tour com os panoramas na ordem de exibição (Sala, Cozinha)
- **E** com os hotspots de saída de cada cômodo, para navegar entre eles

**CEN-19.1 — Inclui a imagem 360° de cada panorama, para renderizar a visita**
- **Dado** um tour qualquer
- **Quando** o cliente abre o tour
- **Então** a consulta traz a imagem 360° de cada panorama

**CEN-25 — Recusa a visita a um tour que não existe**
- **Dado** um id que não corresponde a nenhum tour
- **Quando** o cliente tenta abrir o tour
- **Então** a operação é recusada com `404 Not Found` (`Virtual tour not found`)

---

### US06 — Remoção do tour virtual

> Como corretor, quero remover o tour virtual de um imóvel, junto com seus
> panoramas, quando o material não servir mais.

**CEN-26 — Remove o tour virtual da própria imobiliária**
- **Dado** um tour existente da imobiliária do corretor
- **Quando** o corretor remove o tour
- **Então** o tour é excluído (panoramas caem em cascata)
- **E** nenhum conteúdo é devolvido na resposta

**CEN-27 — Recusa a remoção de um tour que não existe**
- **Dado** um id que não corresponde a nenhum tour
- **Quando** o corretor tenta remover
- **Então** a operação é recusada com `404 Not Found`
- **E** nada é excluído

**CEN-28 — Recusa a remoção de tour de outra imobiliária**
- **Dado** um corretor de outra imobiliária
- **Quando** ele tenta remover o tour
- **Então** a operação é recusada como `Virtual tour not found`
- **E** o tour é procurado apenas entre os imóveis da imobiliária dele
- **E** nada é excluído

---

### US07 — Miniatura do tour

> Como cliente, quero ver uma miniatura do tour na listagem de imóveis, para
> reconhecer o imóvel antes de abrir a visita.

**CEN-29 — Usa o panorama inicial do tour como miniatura**
- **Dado** um tour com panoramas cadastrados
- **Quando** a miniatura do tour é pedida
- **Então** o panorama inicial é o escolhido
- **E** no empate vale a ordem de exibição

**CEN-30 — Converte a imagem em data URL para os bytes da imagem**
- **Dado** um panorama cuja imagem está gravada como data URL (`data:image/jpeg;base64,…`)
- **Quando** a miniatura é pedida
- **Então** o prefixo é descartado e só o conteúdo binário da imagem é devolvido

**CEN-30.1 — Aceita imagem gravada como base64 puro, sem prefixo**
- **Dado** um panorama cuja imagem está gravada sem o prefixo de data URL
- **Quando** a miniatura é pedida
- **Então** os bytes da imagem são devolvidos do mesmo jeito

**CEN-31 — Recusa a miniatura quando o tour não tem nenhum panorama**
- **Dado** um tour sem panoramas
- **Quando** a miniatura é pedida
- **Então** a operação é recusada com `404 Not Found` (`No thumbnail available`)

---

### US08 — Registro de visualizações

> Como corretor, quero que cada visita ao tour seja registrada, com tempo de
> permanência e dispositivo, para acompanhar o interesse no imóvel.

**CEN-32 — Registra a visualização vinculada ao visitante da sessão**
- **Dado** um tour existente e um visitante identificado pela sessão
- **Quando** a visualização é registrada com duração (120 s) e dispositivo (`mobile`)
- **Então** a visualização é gravada para aquele tour e visitante, com duração e dispositivo
- **E** o registro criado é devolvido

**CEN-33 — Reaproveita o visitante quando a sessão já foi vista antes**
- **Dado** um visitante que já visitou tours antes (mesmo `sessionId`)
- **Quando** uma nova visualização é registrada
- **Então** o visitante é reaproveitado pela sessão, sem duplicar o cadastro de visitante

**CEN-33.1 — Aceita visualização sem duração e sem dispositivo informados**
- **Dado** um cliente que fechou o tour sem que a duração fosse medida
- **Quando** a visualização é registrada apenas com a sessão
- **Então** a visualização é gravada mesmo assim, sem esses dados

**CEN-34 — Não registra visualização de um tour que não existe**
- **Dado** um id que não corresponde a nenhum tour
- **Quando** se tenta registrar a visualização
- **Então** a operação é recusada com `404 Not Found`
- **E** nem o visitante nem a visualização são gravados

---

### US09 — Registro de compartilhamentos

> Como corretor, quero saber quando um cliente compartilha o tour e por qual
> canal, para medir o alcance do anúncio.

**CEN-35 — Registra o compartilhamento com o canal utilizado**
- **Dado** um tour existente e um visitante identificado pela sessão
- **Quando** o compartilhamento por WhatsApp é registrado
- **Então** o compartilhamento é gravado para aquele tour, visitante e canal
- **E** o registro criado é devolvido

**CEN-36 — Reaproveita o visitante quando a sessão já é conhecida**
- **Dado** um visitante que já interagiu com tours antes (mesmo `sessionId`)
- **Quando** um novo compartilhamento é registrado (canal `email`)
- **Então** o visitante é reaproveitado pela sessão

**CEN-37 — Não registra compartilhamento de um tour que não existe**
- **Dado** um id que não corresponde a nenhum tour
- **Quando** se tenta registrar o compartilhamento
- **Então** a operação é recusada com `404 Not Found`
- **E** nem o visitante nem o compartilhamento são gravados

---

### US10 — Analytics do tour

> Como administrador da imobiliária, quero ver os números do tour (visualizações,
> compartilhamentos e tempo médio de visita) para avaliar o anúncio.

**CEN-38 — Consolida visualizações, compartilhamentos e tempo médio de visita**
- **Dado** um tour com 10 visualizações, 3 compartilhamentos e média de 95,5 s
- **Quando** o administrador consulta os analytics do tour
- **Então** recebe os três indicadores consolidados
  (`totalViews: 10`, `totalShares: 3`, `avgDurationSeconds: 95.5`)
- **E** cada contagem é restrita àquele tour

**CEN-39 — Ignora visualizações sem duração ao calcular o tempo médio**
- **Dado** um tour em que só parte das visualizações tem duração medida
- **Quando** o administrador consulta os analytics
- **Então** a média considera apenas as visualizações com duração informada
  (visitas sem medição não puxam a média para baixo)

**CEN-40 — Devolve tempo médio zero quando nenhuma visita teve duração medida**
- **Dado** um tour sem nenhuma duração registrada (média nula no banco)
- **Quando** o administrador consulta os analytics
- **Então** o tempo médio é apresentado como `0`, e não como nulo

**CEN-41 — Recusa analytics de tour que não existe**
- **Dado** um id que não corresponde a nenhum tour
- **Quando** o administrador consulta os analytics
- **Então** a operação é recusada com `404 Not Found`
- **E** nenhuma contagem é executada

**CEN-42 — Recusa analytics de tour de outra imobiliária**
- **Dado** um usuário de outra imobiliária
- **Quando** ele consulta os analytics do tour
- **Então** a operação é recusada como `Virtual tour not found`
- **E** o tour é procurado apenas entre os imóveis da imobiliária dele

---

### Contrato HTTP dos handlers

Cada controller apenas repassa os dados já validados (corpo, parâmetro de rota e
usuário autenticado) para o service do caso de uso e devolve a resposta esperada.
O service é substituído por um dublê que registra a chamada.

**CEN-43 — `POST /virtual-tours` repassa o corpo validado e o corretor autenticado**
- **Dado** o corpo do tour já validado pelo `ZodValidationPipe`
- **Quando** o corretor chama o endpoint de criação
- **Então** o caso de uso recebe o corpo e o usuário logado
- **E** o tour criado é devolvido

**CEN-44 — `PATCH /virtual-tours/:id` repassa id, novo status e corretor autenticado**
- **Dado** um tour existente e o novo status desejado
- **Quando** o corretor publica o tour pelo endpoint
- **Então** o caso de uso recebe id, status e usuário logado
- **E** o tour atualizado (`PUBLISHED`) é devolvido

**CEN-45 — `GET /virtual-tours/:id` é público e repassa apenas o id do tour**
- **Dado** um tour publicado
- **Quando** o cliente (sem autenticação) abre o tour
- **Então** o caso de uso é chamado somente com o id do tour
- **E** o tour é devolvido como veio do caso de uso

**CEN-46 — `DELETE /virtual-tours/:id` repassa id e corretor autenticado**
- **Dado** um tour existente
- **Quando** o corretor remove o tour
- **Então** o caso de uso recebe o id e o usuário logado

**CEN-47 — `GET /virtual-tours/:id/thumbnail` responde a imagem com cabeçalhos de cache**
- **Dado** um tour cuja miniatura já está disponível em bytes
- **Quando** o cliente pede a miniatura do tour
- **Então** a resposta tem `Content-Type: image/jpeg` e `Cache-Control: public, max-age=3600`
- **E** o corpo da resposta são os bytes da imagem

**CEN-48 — `POST /virtual-tours/:id/views` repassa id do tour e dados da sessão**
- **Dado** uma visita do cliente ao tour
- **Quando** a visualização é registrada
- **Então** o caso de uso recebe o id do tour e os dados da visualização (sessão e duração)

**CEN-49 — `POST /virtual-tours/:id/shares` repassa id do tour e canal**
- **Dado** um compartilhamento do tour pelo cliente
- **Quando** o compartilhamento é registrado
- **Então** o caso de uso recebe o id do tour e os dados do compartilhamento (sessão e canal)

**CEN-50 — `GET /virtual-tours/:id/analytics` repassa id e usuário administrador**
- **Dado** um administrador consultando os números do tour
- **Quando** ele chama o endpoint de analytics
- **Então** o caso de uso recebe o id e o usuário logado
- **E** os números são devolvidos como vieram do caso de uso

---

### Validação de entrada (borda da API)

O `ZodValidationPipe` roda antes do caso de uso, então as regras de formato do
requisito são recusadas na borda da API, com `400 Bad Request`.

**CEN-51 — Aceita o cômodo informado e aplica os valores padrão do tour**
- **Dado** um cômodo informado apenas com nome e imagem 360°
- **Quando** o corpo é validado
- **Então** os defaults são aplicados: ordem `0`, não inicial, sem medidas e sem hotspots

**CEN-52 — Recusa cômodo sem nome ou sem imagem 360°**
- **Dado** um cômodo sem nome, e outro sem imagem
- **Quando** o corpo é validado
- **Então** a requisição é recusada nos dois casos

**CEN-13 — Recusa medida com valor zero, negativo ou sem descrição**
- **Dado** medidas inválidas registradas em um cômodo (valor `0`, valor `-2,5`, descrição vazia)
- **Quando** o corpo é validado
- **Então** cada medida inválida é recusada

**CEN-12.2 — Assume metro como unidade padrão da medida**
- **Dado** uma medida informada sem unidade
- **Quando** o corpo é validado
- **Então** a unidade é registrada como metro (`m`)

**CEN-53 — Recusa hotspot sem destino informado**
- **Dado** um hotspot sem o cômodo de destino (`targetTempId` vazio)
- **Quando** o corpo é validado
- **Então** a requisição é recusada

**CEN-54 — Recusa criação de tour sem um imóvel válido**
- **Dado** um `propertyId` que não é um identificador válido (`IMV-001`)
- **Quando** o corpo é validado
- **Então** a requisição é recusada

**CEN-18 — Aceita apenas os três status previstos para o tour**
- **Dado** os status previstos no requisito (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
- **Quando** cada um é validado
- **Então** todos são aceitos
- **E** um status fora da lista (`PUBLICADO`) é recusado

**CEN-55 — Recusa visualização sem sessão ou com duração inválida**
- **Dado** registros de visualização inválidos (sessão vazia, duração `-10`)
- **Quando** o corpo é validado
- **Então** a requisição é recusada
- **E** uma visualização apenas com a sessão é aceita

---

## 4. Resultado da execução

```
Test Suites: 10 passed, 10 total
Tests:       52 passed, 52 total
Time:        ~10 s
```

| Suíte | Testes |
| --- | --- |
| `services/create-virtual-tour.service.spec.ts` | 10 |
| `services/update-virtual-tour.service.spec.ts` | 4 |
| `services/find-virtual-tour.service.spec.ts` | 3 |
| `services/delete-virtual-tour.service.spec.ts` | 3 |
| `services/get-thumbnail.service.spec.ts` | 4 |
| `services/record-view.service.spec.ts` | 4 |
| `services/record-share.service.spec.ts` | 3 |
| `services/get-analytics.service.spec.ts` | 5 |
| `controllers/virtual-tours.controllers.spec.ts` | 8 |
| `dto/virtual-tour-dto.spec.ts` | 8 |
| **Total** | **52** |

### Defeito encontrado pelos testes

Os cenários CEN-51 e CEN-12.2 falharam na primeira execução: os identificadores
fixos de `src/test/virtual-tour.fixtures.ts` (`33333333-3333-3333-3333-333333333333`
e similares) não são UUIDs válidos segundo a RFC — os dígitos de versão e variante
estavam fora da faixa aceita —, e o Zod 4 recusava o corpo inteiro em
`propertyId: z.string().uuid()`. Como efeito colateral, os cenários que esperavam
recusa passavam pelo motivo errado. Os identificadores foram corrigidos para o
formato válido (versão `4`, variante `8`), mantendo a legibilidade:
`33333333-3333-4333-8333-333333333333`.

### Cenários não cobertos por testes unitários

A numeração `CEN-*` vem do catálogo de cenários das user stories e tem lacunas
nesta suíte: **CEN-04, CEN-05, CEN-08 a CEN-11, CEN-15, CEN-16 e CEN-20** não são
exercitados pelos testes unitários documentados aqui.
