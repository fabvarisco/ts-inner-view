# Roteiro da apresentação

O que falar em cada slide de `apresentacao-testes.html`. Navegação: setas do teclado, ou os botões Anterior e Próximo.

---

## 1. Capa — Testes de aceitação do tour virtual

Abrir dizendo o que vai ser mostrado: os testes de aceitação do backend, no módulo de tours virtuais do Inner View.

O requisito escolhido é a criação do tour. O corretor monta os cômodos e o cliente visita o imóvel sem ir até lá. Os cenários estão no formato Dado, Quando, Então. A suíte inteira do módulo tem 10 arquivos e 52 testes. Os próximos slides mostram como esses testes foram escritos, o domínio que eles cobrem e o resultado da execução.

## 2. Como o teste foi escrito

Explicar o ciclo do TDD em três passos, apontando cada cartão.

No vermelho, o cenário de aceitação vira um teste antes da regra existir. O service é chamado com um dublê do Prisma, e o teste falha porque o comportamento ainda não está implementado.

No verde, o código grava só o que aquele cenário pede: o tour, os panoramas, as medidas, os hotspots, ou a recusa. Nada além disso.

Na refatoração, a implementação pode mudar, por exemplo para gravar tudo numa transação só ou para filtrar pela imobiliária do usuário. Os cenários continuam descrevendo o mesmo comportamento, e a suíte permanece verde.

Aí ler o trecho de código de baixo pra cima: os comentários Dado, Quando e Então estão dentro do próprio teste do CEN-01. O corretor cria o tour de um imóvel que ainda não tem um, e o teste espera que ele nasça publicado.

## 3. Criação do tour virtual

Ler a história do usuário em voz alta.

Como corretor, quero criar o tour virtual de um imóvel e adicionar os panoramas de cada cômodo, para que o cliente possa visitar o imóvel a distância.

Em seguida, a pré-condição que vale para os cenários de criação: o imóvel existe, é da imobiliária daquele corretor e ainda não tem tour. Os testes sobem o `CreateVirtualTourService` direto, com o dublê do banco. A API e o PostgreSQL ficam de fora dessa suíte. Esse arquivo sozinho tem 10 cenários.

## 4. O diagrama que os cenários percorrem

Percorrer o desenho da esquerda para a direita e de cima para baixo.

Um imóvel possui no máximo um tour virtual. O tour contém vários panoramas, um por cômodo. Cada panorama origina hotspots, e cada hotspot aponta para outro panorama: é assim que o cliente sai da sala e entra na cozinha. O panorama também pode ter medidas, como a largura do cômodo.

Fechar dizendo que cada caixa do diagrama vira uma escrita que o teste confere na criação do tour.

## 5. Cliente, API e banco

Descer o fluxo do slide.

O cliente é um app Ionic com Angular. Ele chama a API pelo proxy `/api`. A API é NestJS, na porta 3000, com Swagger em `/docs`. Na entrada, o JWT autentica o usuário (access de 15 minutos, refresh de 7 dias) e o Zod valida o corpo antes de chegar no caso de uso. Os módulos são Auth, Users, Properties, Virtual Tours, Panoramas e Hotspots. Em cada um, o controller só repassa a chamada para o service.

O Prisma traduz isso nas tabelas e grava no PostgreSQL, na porta 5432.

Encerrar com a frase de baixo: nos testes unitários esse Prisma é um dublê. O banco não abre.

## 6. Três camadas, sem banco

A suíte olha o mesmo fluxo em três pontos.

Na regra de negócio, o teste do service confere o que seria gravado, a ordem, a transação e o que é recusado.

No contrato HTTP, o teste do controller confere se o handler entrega ao caso de uso o corpo, o id da rota e o usuário logado, e se devolve a resposta que o caso de uso produziu.

Na borda, o Zod recusa formato inválido com 400, antes do service. É aqui que entram os valores padrão, como a unidade metro numa medida.

Duas regras atravessam as escritas. A busca do recurso usa a imobiliária do usuário logado. Quando a operação é recusada, o teste confere que nenhuma gravação foi chamada.

## 7. Do imóvel até a medida

Falar os cinco cartões na ordem, ligando cada um a uma caixa do diagrama.

CEN-01. O imóvel ainda não tem tour. O corretor cria, o tour nasce publicado e volta completo para ele.

CEN-03. A sala é o panorama inicial, ordem zero. A cozinha vem depois, ordem um. O teste confere que essa ordem e a marca de panorama inicial são gravadas.

CEN-06. A sala aponta para a cozinha e a cozinha aponta para a sala, ainda com ids temporários. Depois da criação, cada hotspot usa o id real do panorama de origem e do panorama de destino.

CEN-12. A sala tem uma largura de 4,5 metros. Essa medida fica ligada ao panorama da sala.

CEN-01.1. Panoramas, medidas e hotspots entram na mesma transação. Se uma parte falha, o tour não fica pela metade.

## 8. Falha não deixa rastro

Agora os casos em que a criação é recusada. Em todos eles, o teste também confere que nada foi gravado.

CEN-02. O imóvel já tem um tour. O segundo é recusado com 409, com a mensagem de que o tour virtual já existe para aquele imóvel.

CEN-07. A sala aponta para um cômodo que não veio na lista enviada. A API responde 400, citando o `tempId` inválido, e nenhum hotspot é criado.

CEN-21. O id do imóvel não existe. A resposta é 404 e a transação nem abre.

CEN-22. O corretor é de outra imobiliária. A busca do imóvel filtra pela `agencyId` dele, então o imóvel da outra carteira aparece como não encontrado. A resposta é "imóvel não encontrado", e o teste mostra o filtro na consulta.

## 9. 52 testes, 10 suítes

Mostrar o terminal. As 10 suítes passaram, os 52 testes passaram, em 6,3 segundos. A criação do tour, que foi o requisito apresentado, é a primeira linha: 10 testes.

O inventário da direita mostra o resto do módulo, sem detalhar um a um: publicação, visita, remoção, miniatura, visualizações, compartilhamentos, analytics, os controllers e a validação dos DTOs.

Se perguntarem do Jest: o `yarn test` do repositório aponta para o Jest 25, e o ts-jest instalado é o 27. A saída da tela é essa mesma suíte rodando no Jest 27.5.1.

## 10. Rodar a suíte

Fechar mostrando como repetir.

Entrar em `server-api`, abrir o `nix-shell` e rodar `yarn test`. Com cobertura, `yarn test --coverage`. Para ver só os casos de uso, o comando que aponta para `src/modules/virtual-tours/services`.

Os testes não precisam do PostgreSQL ligado. O dublê do Prisma fica em `src/test/prisma-mock.ts` e os dados de exemplo, corretor, imóvel e tour de dois cômodos, ficam em `src/test/virtual-tour.fixtures.ts`.
