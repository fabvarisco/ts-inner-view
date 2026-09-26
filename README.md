# Inner View

Tour virtual de imóveis. O repositório tem duas partes:

- `server-api` — API NestJS, Prisma e PostgreSQL
- `inner-view-client` — app Ionic / Angular

A API sobe em [http://localhost:3000](http://localhost:3000). O Swagger fica em [http://localhost:3000/docs](http://localhost:3000/docs). O cliente sobe em [http://localhost:4200](http://localhost:4200) e encaminha `/api` para a API.

No macOS, no Windows e no Linux o banco e a API sobem com Docker. No NixOS há um caminho sem Docker, no final deste guia.

## Pré-requisitos

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| Git | qualquer recente | clonar o repositório |
| Node.js | 22 ou mais recente | cliente e o comando de seed da API |
| Yarn | 1.x | dependências da API |
| Docker e Docker Compose | Docker Desktop ou Engine | PostgreSQL e a API |

Instalação por sistema:

- **macOS.** [Docker Desktop](https://www.docker.com/products/docker-desktop/) e [Node.js 22](https://nodejs.org/). No Terminal: `corepack enable`.
- **Windows.** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (com o backend WSL2 ligado) e [Node.js 22](https://nodejs.org/). No PowerShell: `corepack enable`. Os comandos abaixo funcionam no PowerShell, no Git Bash e no terminal do WSL.
- **Linux.** [Docker Engine](https://docs.docker.com/engine/install/) com o plugin Compose, e Node.js 22 (via [nvm](https://github.com/nvm-sh/nvm), NodeSource ou o pacote da distribuição). Depois: `corepack enable`.

Confira as versões:

```bash
node -v          # v22.x ou mais novo
yarn -v          # 1.x
docker compose version
```

## Clonar

```bash
git clone https://github.com/fabvarisco/ts-inner-view.git
cd ts-inner-view
```

## API (Docker)

Os comandos são os mesmos nos três sistemas. Entre na pasta da API e crie o `.env` a partir do exemplo. Os valores locais já servem para o Docker.

```bash
cd server-api
```

macOS, Linux e Git Bash:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Suba o PostgreSQL 16 e a API. Na primeira vez a imagem é construída, o banco espera ficar saudável e as migrations rodam sozinhas.

```bash
docker compose up --build -d
docker compose logs -f api
```

Quando aparecer `Application is running`, a API está em [http://localhost:3000/docs](http://localhost:3000/docs). `Ctrl+C` só fecha o log; os containers continuam.

Instale as dependências no host e grave os dados de exemplo. O seed usa o PostgreSQL publicado em `localhost:5432`.

```bash
yarn install
yarn seed
```

O seed cria a imobiliária Relax Inn:

| Quem | E-mail | Senha |
| --- | --- | --- |
| Admin | `admin@relaxinn.com.br` | `admin123` |
| Corretor | `corretor@relaxinn.com.br` | `corretor123` |

Também cria os imóveis `RLX-001` (com tour) e `RLX-002`, além de algumas visualizações e compartilhamentos.

O login é `POST /auth/signin`, documentado no Swagger.

Para parar:

```bash
docker compose down       # para os containers
docker compose down -v    # para e apaga os dados do banco
```

## Cliente

Em outro terminal, na raiz do repositório:

```bash
cd inner-view-client
npm ci
npm start
```

Abra [http://localhost:4200](http://localhost:4200). O `proxy.conf.json` manda `/api` para `http://localhost:3000`, então a API precisa estar no ar antes de usar o app.

## Bônus: Nix (sem Docker)

O `server-api/shell.nix` entrega Node 22, Yarn, PostgreSQL 16 e as engines do Prisma usadas no NixOS, onde os binários oficiais do Prisma não existem.

```bash
cd server-api
nix-shell
```

Na primeira vez o shell cria o `.env` se ele ainda não existir. Setup inicial, uma vez:

```bash
db-start
yarn install
npx prisma migrate deploy
yarn seed
```

`db-start` inicializa um cluster em `server-api/.postgres` e cria o banco `property-360`. O `yarn seed` grava nele os dois usuários da aplicação, os mesmos do Docker:

| Quem | E-mail | Senha |
| --- | --- | --- |
| Admin | `admin@relaxinn.com.br` | `admin123` |
| Corretor | `corretor@relaxinn.com.br` | `corretor123` |

Para desenvolver:

```bash
db-start && yarn start:dev
```

Outros comandos dentro do `nix-shell`: `db-stop` encerra o PostgreSQL e `db-logs` mostra o log.

O cliente continua no fluxo com npm. No NixOS, use Node 22 do sistema ou `nix-shell -p nodejs_22` dentro de `inner-view-client` e rode `npm ci` e `npm start`.
