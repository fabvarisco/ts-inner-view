# Roteiro da apresentação — Sistema distribuído

O que falar em cada slide de `apresentacao-distribuidos.html`. Navegação: setas do teclado, ou os botões Anterior e Próximo. São cerca de 25 segundos por slide, para caber nos 5 minutos do vídeo.

---

## 1. Capa

Dizer que o caso de ensino é o Inner View, um tour virtual de imóveis. O deck traz a especificação do sistema distribuído e a funcionalidade escolhida: editar um tour com exclusão mútua entre réplicas da API.

## 2. A tarefa

Ler os dois objetivos. No item 1 estão as questões de projeto, a arquitetura, o marshaling, o paradigma de comunicação e a exclusão mútua. No item 2, uma funcionalidade coerente com essa especificação. As entregas são o relatório SBC, o código e este vídeo.

## 3. O caso de ensino

Os atores: o corretor e o admin montam o tour, e o visitante percorre o imóvel. Os dados são da imobiliária. Depois, os componentes reais: o cliente Ionic na 4200, o proxy `/api`, a API NestJS na 3000 e o PostgreSQL na 5432.

## 4. Questões de projeto

Passar pelos cartões. Destacar o de concorrência, que está com a borda laranja: é ele que leva à exclusão mútua. Os outros já estão resolvidos no código atual: JSON entre plataformas diferentes, Swagger, JWT e Zod, API sem estado e healthcheck.

## 5. Arquitetura

Cliente-servidor em três camadas. Percorrer o diagrama: clientes, proxy/balanceador, réplicas da API, banco. A justificativa principal é que existe uma fonte de verdade por imobiliária e a autorização é central. P2P não cabe, porque o visitante entra e sai e os dados não pertencem aos usuários.

## 6. Marshaling

Ler o pipeline da esquerda para a direita. O `HttpClient` serializa o objeto em JSON, o body-parser desserializa e o Zod confere o tipo. O NestJS é o broker: o cliente não sabe qual service atende. JSON e não gRPC porque é nativo no navegador, legível e já está documentado no Swagger.

## 7. Paradigma de comunicação

Requisição-resposta, a linha destacada. O corretor precisa da resposta na hora: 200, 400 ou 409. Explicar por que os outros paradigmas ficaram de fora e onde pub-sub e filas entrariam como evolução, nas visualizações e nas miniaturas.

## 8. Exclusão mútua: o problema

Dois corretores editam o mesmo tour e cada requisição cai numa réplica diferente. As duas leem a v1, e a segunda escrita apaga a primeira. Um mutex em memória não resolve, porque vale só para um processo. Citar os requisitos de segurança e vivacidade.

## 9. Exclusão mútua: a solução

Algoritmo de servidor central, com o PostgreSQL como coordenador. Percorrer a sequência: a API #1 obtém o lock e a API #2 recebe false e devolve 409. O lock é da transação, então some no COMMIT ou quando a conexão cai. Ricart-Agrawala e anel foram descartados porque as réplicas não se conhecem e já compartilham o banco.

## 10. Implementação

Ler o código de cima para baixo: transação, `pg_try_advisory_xact_lock`, 409 se não conseguir o lock, filtro pela imobiliária, update. Comentar que o lock fica no service, onde a suíte de testes já atua, e que se usa o lock de transação porque o Prisma reaproveita conexões.

## 11. Demonstração

Rodar os comandos ao vivo: as duas réplicas, o login com o corretor do seed e as duas requisições em paralelo. Mostrar uma saída 200 e a outra 409. Se der tempo, rodar o `pg_locks` durante a edição.

## 12. Referências

Citar Coulouris como base das questões de projeto e da exclusão mútua, o padrão Broker da Microsoft e a documentação do PostgreSQL. Fechar com os próximos passos.
