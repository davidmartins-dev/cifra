# Visão Geral da Arquitetura

## Visão geral

O Cifra é uma aplicação full stack de gestão financeira pessoal, desenvolvida inicialmente como um monólito modular.

O projeto é organizado como um monorepo contendo a aplicação web, a API e pacotes compartilhados de configuração e código.

## Arquitetura

A arquitetura inicial segue os seguintes princípios:

- Monólito modular
- Clean Architecture
- SOLID
- Separação de responsabilidades
- Limites claros entre módulos
- Testabilidade
- Segurança desde a concepção

## Aplicações

### API

A API é responsável pelas regras de negócio, autenticação, autorização, persistência de dados e integrações.

Tecnologias principais:

- NestJS
- TypeScript
- REST API
- Prisma
- PostgreSQL
- Swagger/OpenAPI

Localização:

`apps/api`

### Web

A aplicação web é responsável pela interface de usuário e interação com a API.

Tecnologias principais:

- Next.js
- React
- TypeScript

Localização:

`apps/web`

## Infraestrutura

### Desenvolvimento

A infraestrutura local utiliza Docker Compose.

O PostgreSQL é executado em um contêiner durante o desenvolvimento.

A API e a aplicação Web são executadas como processos independentes.

### Produção

A infraestrutura de produção está planejada da seguinte forma:

- Web: Vercel
- API: Google Cloud Compute Engine
- Banco de dados: Neon PostgreSQL

## Comunicação

A aplicação Web se comunica com a API por meio de HTTP utilizando uma API REST.

A API é responsável por:

- Autenticação
- Autorização
- Regras de negócio
- Persistência
- Integrações externas

## Módulos

A API é organizada por módulos orientados ao domínio:

- Autenticação
- Usuários
- Contas
- Categorias
- Transações
- Resumo Financeiro
- Administração
- Auditoria

Cada módulo deve possuir responsabilidades bem definidas e evitar acoplamento desnecessário com outros módulos.

## Dados

O PostgreSQL é utilizado como banco de dados relacional principal.

O Prisma é utilizado como ORM e camada de acesso aos dados.

## Evolução

A arquitetura poderá evoluir conforme as necessidades do sistema.

Mudanças arquiteturais relevantes devem ser registradas por meio de Architecture Decision Records (ADRs).
