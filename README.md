# Cifra

Cifra é uma aplicação full stack de gestão financeira pessoal.

O projeto permite registrar receitas e despesas, organizar lançamentos por categorias e acompanhar informações financeiras por meio de um dashboard.

Foi desenvolvido como projeto de portfólio com foco em arquitetura de software, segurança, qualidade de código, testes, observabilidade e práticas de engenharia aplicadas a sistemas financeiros.

## Funcionalidades

- Autenticação e autorização de usuários
- Gestão de contas financeiras
- Cadastro e gerenciamento de categorias
- Registro de receitas e despesas
- Consulta e filtragem de transações
- Dashboard financeiro
- Resumos por período e categoria
- Controle de acesso baseado em papéis
- Isolamento de dados entre usuários
- Auditoria de operações relevantes
- Área administrativa
- Health checks e observabilidade da API

## Arquitetura

O backend utiliza uma arquitetura de Modular Monolith, combinada com princípios de Clean Architecture e SOLID.

A aplicação é organizada por módulos de domínio, mantendo responsabilidades bem definidas e baixo acoplamento entre componentes.

Principais módulos:

- Auth
- Users
- Accounts
- Categories
- Transactions
- Financial Summary
- Administration
- Audit

A autorização considera tanto o papel do usuário quanto a propriedade do recurso. Um usuário somente pode acessar contas e transações pertencentes a ele.

A área administrativa possui recursos específicos para gestão operacional, auditoria e observabilidade da plataforma.

Documentação arquitetural, decisões técnicas e diagramas estão disponíveis em `docs/`.

## Stack

### Backend

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- REST API
- Swagger / OpenAPI

### Frontend

- React
- Next.js
- TypeScript

### Monorepo

- PNPM
- Turborepo

### Infraestrutura

- Docker
- Neon PostgreSQL
- Google Cloud Compute Engine (`e2-micro`)
- Vercel
- GitHub Actions

## Estrutura

```text
cifra/
├── .github/
│   └── workflows/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── ui/
│   ├── shared/
│   ├── eslint-config/
│   └── typescript-config/
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── security/
│   └── runbooks/
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── turbo.json
```

## Backend

A API é construída com NestJS e organizada como um Modular Monolith.

Suas principais responsabilidades incluem:

- autenticação
- autorização
- regras de negócio
- validação de entrada
- persistência
- auditoria
- observabilidade
- integração com o banco de dados

O Prisma é utilizado como ORM e o PostgreSQL como banco de dados principal.

A API possui um Dockerfile próprio em `apps/api/Dockerfile`, utilizado para gerar a imagem de produção.

## Frontend

A aplicação web utiliza Next.js e React.

O frontend é responsável pela interface de autenticação, gestão financeira, lançamento de transações, consultas e visualização dos indicadores financeiros.

A comunicação com o backend ocorre por meio da API REST.

Em produção, o frontend é hospedado na Vercel.

## Segurança

O projeto aplica práticas de segurança compatíveis com uma aplicação que manipula informações financeiras pessoais.

Entre os mecanismos utilizados estão:

- JWT
- Hash seguro de senhas
- RBAC
- Validação de entrada
- Controle de propriedade dos recursos
- Isolamento de dados entre usuários
- Auditoria de operações relevantes
- Logs sem informações sensíveis
- Configuração segura de variáveis de ambiente

A autorização não depende apenas do papel do usuário. Recursos financeiros também são validados quanto à sua propriedade antes de serem acessados ou modificados.

## API

A API segue o padrão REST.

A documentação dos endpoints é disponibilizada através do Swagger / OpenAPI.

Em ambiente local:

```text
http://localhost:3000/api/docs
```

## Portas de desenvolvimento

O monorepo executa frontend e backend como aplicações independentes.

| Serviço | Porta |
|---|---:|
| Next.js | 3001 |
| NestJS API | 3000 |
| PostgreSQL | 5432 |

O frontend utiliza:

```text
http://localhost:3001
```

e a API:

```text
http://localhost:3000/api/v1
```

## Banco de dados

Durante o desenvolvimento local, o PostgreSQL é executado através do Docker Compose.

```bash
docker compose up -d
```

O arquivo `docker-compose.yml` está localizado na raiz do monorepo e é responsável pela infraestrutura local.

Em produção, o PostgreSQL utilizado pela API é hospedado no Neon.

As migrações do Prisma devem ser executadas a partir do workspace da API.

```bash
pnpm --filter api prisma migrate dev
```

## Testes

O projeto possui diferentes níveis de testes:

- Unitários
- Integração
- E2E

As principais ferramentas utilizadas são:

- Vitest
- Supertest
- Playwright

Os testes são executados pelo pipeline de CI.

## Desenvolvimento local

### Pré-requisitos

- Node.js 24+
- PNPM
- Docker

### Instalação

Na raiz do monorepo:

```bash
pnpm install
```

Configure os arquivos `.env` utilizando os respectivos `.env.example` disponíveis na raiz e nos aplicativos.

### Banco de dados

Inicie o PostgreSQL:

```bash
docker compose up -d
```

Execute as migrações:

```bash
pnpm --filter api prisma migrate dev
```

### Desenvolvimento

Para iniciar frontend e backend:

```bash
pnpm dev
```

O Turborepo executará as aplicações simultaneamente:

```text
Next.js  → http://localhost:3001
NestJS   → http://localhost:3000
```

## Docker

O Docker Compose é utilizado para infraestrutura de desenvolvimento local.

O Dockerfile da API está localizado em:

```text
apps/api/Dockerfile
```

A imagem da API pode ser construída a partir da raiz do monorepo:

```bash
docker build -f apps/api/Dockerfile .
```

O frontend não possui Dockerfile de produção, pois é hospedado diretamente na Vercel.

## Deploy

A arquitetura de produção é composta por:

```text
Vercel
└── Next.js

Google Cloud Compute Engine
└── Docker
    └── NestJS API

Neon
└── PostgreSQL
```

O frontend é publicado na Vercel.

A API é executada em uma instância Google Cloud Compute Engine `e2-micro` através de um container Docker.

O PostgreSQL de produção é hospedado no Neon.

O processo de build, testes e integração é automatizado através do GitHub Actions.

## Documentação

A documentação complementar fica organizada em:

```text
docs/
├── adr/
├── architecture/
├── runbooks/
└── security/
```

- `adr/` — decisões arquiteturais relevantes
- `architecture/` — arquitetura e estrutura do sistema
- `runbooks/` — procedimentos operacionais
- `security/` — definições relacionadas à segurança

## Status

Projeto em desenvolvimento.

O objetivo atual é construir uma aplicação funcional de gestão financeira pessoal, aplicando práticas de engenharia utilizadas em sistemas profissionais de produção.

## Autor

David Martins

Senior Software Engineer

Tecnologias principais: TypeScript, Node.js, NestJS, React, Next.js, PostgreSQL e arquitetura de sistemas.
