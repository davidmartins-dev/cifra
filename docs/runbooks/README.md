# Runbooks

Procedimentos operacionais para desenvolvimento, implantação e manutenção do Cifra.

## Desenvolvimento local

### Iniciar a infraestrutura

Na raiz do projeto:

```bash
docker compose up -d
```

### Iniciar as aplicações

Na raiz do projeto:

```bash
pnpm dev
```

A API e a aplicação Web serão executadas como processos independentes.

### Parar a infraestrutura

```bash
docker compose down
```

## Testes

Executar os testes do projeto:

```bash
pnpm test
```

## Build

Executar o build das aplicações:

```bash
pnpm build
```

## Variáveis de ambiente

As variáveis de ambiente devem ser configuradas de acordo com os respectivos arquivos `.env.example`.

Segredos de produção nunca devem ser versionados no repositório.

## Futuros runbooks

Novos procedimentos operacionais serão adicionados conforme o projeto evoluir, incluindo:

- Migrações de banco de dados
- Implantação em produção
- Rollback
- Resposta a incidentes
- Backup e recuperação
- Observabilidade
- Diagnóstico de problemas
