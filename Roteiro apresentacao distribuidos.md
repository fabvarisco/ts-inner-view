# Roteiro da apresentação: Sistema distribuído do Inner View

Roteiro da apresentação `apresentacao-distribuidos.html`, dividido entre os quatro integrantes. O vídeo tem limite de 5 minutos. Os tempos somam 4:50, o que deixa 10 segundos de folga. Para navegar, use as setas do teclado. Quem está falando também passa os slides.

| Parte | Quem | Slides | Tempo | Acumulado |
| --- | --- | --- | --- | --- |
| 1. Abertura e contexto | Fabricio Varisco | 1, 2, 3 | 0:50 | 0:50 |
| 2. Questões de projeto e arquitetura | Gustavo Potrich | 4, 5 | 1:05 | 1:55 |
| 3. Marshaling e paradigma | Lucas Krug | 6, 7 | 1:00 | 2:55 |
| 4. Exclusão mútua e implementação | Matheus Thiesen | 8, 9, 10 | 1:15 | 4:10 |
| 5. Demonstração e fechamento | Fabricio Varisco | 11, 12 | 0:40 | 4:50 |

O Fabricio abre e fecha porque a demonstração roda na máquina dele, onde o repositório e o Docker já estão prontos.

---

## Parte 1: Fabricio Varisco (slides 1 a 3, 0:50)

### Slide 1: Capa (0:10)

> "Olá, nós somos o Fabricio, o Gustavo, o Lucas e o Matheus. Nosso caso de ensino é o Inner View, um sistema de tour virtual de imóveis. Vamos mostrar a especificação dele como sistema distribuído e uma funcionalidade implementada: a edição de um tour com exclusão mútua."

### Slide 2: A tarefa (0:15)

> "A atividade tem duas partes. Na primeira, especificar o sistema: questões de projeto, arquitetura, marshaling, paradigma de comunicação e exclusão mútua. Na segunda, implementar uma funcionalidade coerente com essa especificação. A nossa é a edição do tour com um lock distribuído."

Apontar o cartão "Nossa escolha".

### Slide 3: O caso de ensino (0:25)

> "No Inner View, o corretor monta o tour: envia um panorama 360° de cada cômodo e liga os cômodos por hotspots. O visitante abre o link e anda pelo imóvel. Os dados pertencem à imobiliária. São processos separados que só se falam pela rede: o cliente Ionic na porta 4200, a API NestJS na 3000 e o PostgreSQL na 5432. O Gustavo vai mostrar como tratamos os desafios de projeto."

---

## Parte 2: Gustavo Potrich (slides 4 e 5, 1:05)

### Slide 4: Questões de projeto (0:35)

> "Usamos os desafios do Coulouris. Heterogeneidade: navegador e Node conversam por HTTP com JSON. Abertura: a API está documentada no Swagger. Segurança: JWT, guards por papel e validação com Zod. Escalabilidade: a API não guarda sessão, então dá para subir várias réplicas. Falhas: healthcheck, restart e transações. E transparência: o proxy esconde onde a API está."

Apontar o cartão laranja:

> "O cartão em destaque é o da concorrência. Dois corretores podem editar o mesmo tour ao mesmo tempo, e é daí que sai a exclusão mútua que o Matheus vai apresentar."

### Slide 5: Arquitetura (0:30)

Percorrer o diagrama da esquerda para a direita.

> "A arquitetura é cliente-servidor em três camadas: apresentação, lógica com as réplicas da API, e dados no PostgreSQL. Escolhemos assim porque precisa existir uma única fonte de verdade por imobiliária e porque a autorização tem que ficar num ponto confiável. Peer-to-peer não serve: o visitante entra e sai, e os dados não pertencem aos usuários. O Lucas explica como esses dados trafegam."

---

## Parte 3: Lucas Krug (slides 6 e 7, 1:00)

### Slide 6: Marshaling (0:30)

Ler a faixa de cima da esquerda para a direita.

> "No cliente, o HttpClient do Angular serializa o objeto em JSON. Esse é o marshaling. No servidor, o body-parser do Express desserializa, e o pipe do Zod confere o tipo antes de chegar no service. O NestJS cumpre o papel do padrão Broker da Microsoft: o cliente não sabe qual componente atende, porque o framework faz o roteamento. Escolhemos JSON e não gRPC porque o JSON é nativo no navegador, é legível e já está documentado no Swagger."

### Slide 7: Paradigma de comunicação (0:30)

Apontar a linha destacada da tabela.

> "O paradigma é requisição-resposta, em estilo REST. O corretor precisa da resposta na hora: 200 se deu certo, 400 se o dado está errado, 409 se houve conflito. RPC e RMI foram descartados porque o navegador não fala gRPC e o RMI amarra tudo ao Java. Publicação-assinatura e filas ficam como evolução, para eventos de visualização e geração de miniaturas. O Matheus mostra agora o problema de concorrência."

---

## Parte 4: Matheus Thiesen (slides 8 a 10, 1:15)

### Slide 8: O problema (0:25)

Seguir o diagrama de cima para baixo.

> "Dois corretores editam o mesmo tour, e cada requisição cai numa réplica diferente. As duas leem a versão 1, e a segunda escrita apaga a primeira. Pode até sobrar um hotspot apontando para um cômodo apagado. Um mutex em memória não resolve, porque só vale dentro de um processo. Precisamos garantir segurança, ou seja, um processo por vez, e vivacidade, sem deadlock e sem lock preso."

### Slide 9: A solução (0:25)

> "Usamos o algoritmo de servidor central, e o coordenador é o próprio PostgreSQL, com o pg_try_advisory_xact_lock. A API 1 pede o lock e recebe true. A API 2 recebe false e devolve 409. Como o lock pertence à transação, o banco libera sozinho no commit ou se a réplica cair. Ricart-Agrawala e anel exigiriam que as réplicas se conhecessem e trocassem mensagens. As nossas não se conhecem, mas já compartilham o banco."

### Slide 10: Implementação (0:25)

Ler o código de cima para baixo.

> "No service de edição, tudo roda numa transação. Primeiro pedimos o lock. Se não conseguimos, lançamos ConflictException, que vira 409. Se conseguimos, conferimos se o tour é da imobiliária do usuário e fazemos o update. O lock fica no service porque é regra de negócio, e usamos o de transação porque o Prisma reaproveita conexões. Fabricio, a demonstração."

---

## Parte 5: Fabricio Varisco (slides 11 e 12, 0:40)

### Slide 11: Demonstração (0:30)

Antes da gravação: subir o banco e a réplica #1 com `docker compose up -d`, a réplica #2 com `PORT=3001 yarn start:dev`, e deixar o `TOKEN` e o `TOUR` já exportados no terminal. Na gravação, só o laço com os dois `curl` roda ao vivo.

> "Temos duas réplicas da API, na 3000 e na 3001, ligadas ao mesmo banco. Vou mandar duas edições do mesmo tour ao mesmo tempo, uma para cada réplica."

Rodar o laço e mostrar a saída:

> "Uma respondeu 200 e a outra 409. Só uma entrou na região crítica. Enquanto a edição roda, o pg_locks mostra quem está com o lock."

### Slide 12: Referências (0:10)

> "A base do trabalho é o Coulouris, junto com o padrão Broker da Microsoft e a documentação do PostgreSQL. Obrigado."

---

## Antes de gravar

- Ensaiar uma vez com cronômetro. Quem passar do tempo corta a última frase da sua fala, não a do colega.
- Cada um passa os slides da sua parte. A frase final de cada parte já chama o próximo integrante.
- Manter o `pg_sleep(3)` dentro da transação só durante a gravação, para o 409 aparecer sempre. Ele sai antes do merge.
- Gravar a tela em 1280×720 ou mais, com o terminal em fonte grande no slide 11.
