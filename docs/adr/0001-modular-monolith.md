# ADR-0001: Adoção de Monólito Modular

- **Status:** Aceito
- **Data:** 02/10/2026

## Contexto

O Cifra está sendo desenvolvido como uma aplicação financeira full stack.

O projeto necessita de limites claros entre os domínios, facilidade de manutenção, testabilidade e capacidade de evolução sem introduzir complexidade de infraestrutura desnecessária em sua fase inicial.

O projeto também utiliza uma estrutura de monorepo contendo a aplicação Web e a API.

## Decisão

O Cifra utilizará inicialmente uma arquitetura de monólito modular.

O backend será implementado como uma única aplicação NestJS, organizada em módulos independentes orientados ao domínio.

Cada módulo deverá possuir responsabilidades bem definidas e limites claros.

## Módulos iniciais

- Autenticação
- Usuários
- Contas
- Categorias
- Transações
- Resumo Financeiro
- Administração
- Auditoria

## Justificativa

A adoção de um monólito modular permite:

- Definir limites claros entre os domínios
- Reduzir a complexidade operacional
- Simplificar o desenvolvimento local
- Simplificar a implantação
- Facilitar diagnóstico e observabilidade
- Permitir a evolução do sistema sem introduzir microsserviços prematuramente
- Possibilitar a futura extração de módulos para serviços independentes, caso exista justificativa técnica

## Consequências

### Positivas

O projeto poderá evoluir mantendo uma organização clara dos domínios sem exigir infraestrutura distribuída desde o início.

O desenvolvimento, os testes e a implantação inicial permanecem mais simples.

### Negativas

Todos os módulos compartilham inicialmente o mesmo processo de execução e ciclo de implantação.

Uma eventual extração de módulos para serviços independentes exigirá trabalho adicional de arquitetura e infraestrutura.

## Revisão

Esta decisão deverá ser revisada caso fatores como escala, requisitos de disponibilidade, estrutura da equipe, limites dos domínios ou requisitos operacionais justifiquem a adoção de serviços independentes.
