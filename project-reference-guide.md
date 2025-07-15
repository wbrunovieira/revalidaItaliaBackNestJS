Project Reference Guide

Este documento reúne as informações essenciais sobre o projeto Revalida Italia Back (NestJS + DDD + PostgreSQL + Prisma + Multilíngue), servindo como referência central antes de qualquer implementação.

⸻

Role do Sistema

Você é um desenvolvedor backend altamente experiente, com profundo conhecimento em NestJS, Domain-Driven Design, Prisma e práticas de Clean Code. Suas prioridades são:
• Entregar tarefas de forma eficiente e precisa, seguindo o fluxo e convenções do projeto.
• Aplicar padrões de projeto, melhores práticas e princípios SOLID.
• Garantir qualidade de código, legibilidade e manutenibilidade.
• Utilizar tipagens fortes e imports absolutos (@/...).
• Validar dados de entrada com Zod e/ou class-validator conforme padrão.
• Criar e manter testes unitários (Vitest) e testes E2E automatizados.
• Documentar atualizações e manter este guia sempre atualizado.
• Processo passo a passo: sempre pense em uma lista de tarefas sequenciais antes de gerar artefatos.
• Verificações iniciais: confirme se há dúvidas, exemplos ou regras de negócio a esclarecer antes de criar/atualizar arquivos.

⸻

1. Visão Geral do Projeto
   • Domínio: Plataforma de ensino online multilíngue (pt/it/es).
   • Perfis: student, tutor, admin.
   • Hierarquia de Conteúdo: Trilha ➔ Curso ➔ Módulo ➔ Aula ➔ (Vídeo, Documento, Assessment, Flashcards).
   • Tipos de Assessment:
   1. Quiz: múltipla escolha, pontuação, explicações multilíngue.
   2. Simulado: múltipla escolha, tempo limitado, agrupamento por Argument.
   3. Prova Aberta: respostas abertas corrigidas manualmente.
      • Fluxos Principais: cadastro de conteúdo, execução de assessments, interação com flashcards, registro de tentativas, métricas de desempenho.

⸻

2. Regras de Negócio Detalhadas

Usuários
• student: realiza assessments, visualiza aulas, interage com flashcards e métricas pessoais.
• tutor: cria e edita cursos, módulos, aulas, assessments, flashcards e corrige provas abertas.
• admin: gerencia usuários, conteúdo, relatórios e permissões.

Assessments
• Quiz:
• Obrigatoriamente associado a uma aula.
• Deve ter ao menos uma pergunta com múltiplas opções.
• Cada questão pode ter uma explicação detalhada para respostas incorretas em múltiplos idiomas.
• Possui posição definida (antes ou depois da aula).
• Simulado:
• Pode ter tempo limite obrigatório.
• Obrigatoriamente tem um ou mais argumentos, e cada argumento contém múltiplas questões.
• Resultados e tentativas são sempre registrados.
• Prova Aberta:
• Não possui correção automática.
• Fluxo de correção: aluno submete resposta ➔ tutor revisa ➔ aceita ou pede nova tentativa.
• Todas as tentativas ficam registradas e visíveis ao tutor e aluno.

Aulas e Conteúdo
• Uma aula pode conter vídeos, documentos, assessments e flashcards.
• Cada item pode possuir traduções específicas para pt, it e es.
• Conteúdo pode ser reordenado dentro de módulos e aulas.

Flashcards
• Campos:
  - Pergunta: texto (italiano) ou imagem
  - Resposta: texto (italiano) ou imagem
• Organização por Argumento: utiliza os mesmos Arguments dos assessments
• Adição na aula: professor pode adicionar individualmente, todos de um Argument, ou por tags
• Acesso autônomo: aluno pode acessar página dedicada além das aulas
• Interação: clique para virar, deslize direita (fácil), esquerda (difícil)
• Ordem aleatória para reforçar memória
• Sistema de tags para filtros e subcategorias
• Métricas: percentual de domínio por aluno e geral por Argument
• Reapresentação: cards difíceis aparecem com maior frequência
• Importação/Exportação: suporte a lotes via PDF/CSV
• Stats: data última revisão e contadores por Argument

⸻

3. Tech Stack e Ferramentas
   • Framework: NestJS v11
   • Arquitetura: DDD
   • ORM: Prisma Client v6.10.0 (+ Migrations)
   • BD: PostgreSQL
   • Validação: Zod (env) + class-validator (DTOs)
   • Testes Unitários: Vitest v3.1.3
   • Testes E2E: Vitest + Supertest
   • Lint/Format: ESLint + Prettier
   • Containers: Docker & Docker Compose
   • Infra: Terraform + Ansible
   • i18n: Tabelas de tradução Prisma + VOs
   • CI/CD: pipelines customizados

⸻

4. Estrutura de Pastas

src/
├─ core/ # Base: Entity, Either, UniqueEntityID, utils
├─ domain/ # DDD: enterprise/entities, application/use-cases, dtos, repos (interfaces), validações
│  ├─ auth/ # Autenticação e usuários
│  ├─ course-catalog/ # Cursos, módulos, aulas, vídeos, documentos
│  ├─ assessment/ # Assessments, questões, tentativas, arguments
│  └─ flashcard/ # Flashcards, tags, interações (NOVO)
├─ infra/ # Implementações: controllers, modules, guards, database/prisma/repositories
├─ prisma/ # schema.prisma, migrations, PrismaService
├─ test/ # unit/in-memory repos, e2e/setup
├─ requests/ # .http para testes manuais
├─ app.module.ts
└─ main.ts

⸻

5. Fluxo de Desenvolvimento
   1. Entidade: enterprise/entities.
   2. Repositório: interface + in-memory + Prisma em infra/database/prisma/repositories.
   3. Use-Case: DTOs + validação (Zod) + lógica + testes unitários.
   4. Controller: DTOs Nest (class-validator), rotas, serviços de use-case + testes unitários do controller.
   5. Testes E2E: endpoints, fluxo completo.

⸻

6. Configuração de Ambiente
   • Arquivo env.ts validado por Zod (tipo Env).
   • Variáveis obrigatórias: DATABASE_URL, PANDA_API_KEY, JWT_PRIVATE_KEY|\_PATH, JWT_PUBLIC_KEY|\_PATH, STORAGE_TYPE.
   • Limite de arquivo: até 100MB, tipos configuráveis.

⸻

7. Autenticação & Autorização
   • JWT (@nestjs/jwt) + Passport
   • Decorators: @UseGuards(JwtAuthGuard, RolesGuard), @Public() para rotas abertas.

⸻

8. Estratégia de Testes
   • Todos os testes devem passar. Cobertura mínima = garantir cenários críticos (não percentuais).
   • Unitários: Vitest + in-memory repos; QA experiente cobrindo erro, edge cases, entradas inválidas; foco em comportamento.
   • E2E: Vitest + Supertest; prisma migrate deploy antes; validar fluxo ponta a ponta.
   • Scripts: npm run test, npm run test:e2e.

⸻

9. Fluxo de Conversas com a IA

Em cada chat, identifique o passo e siga este checklist antes de iniciar: 1. Liste as tarefas sequenciais (passo a passo). 2. Faça perguntas sobre regras de negócio ou exemplos necessários. 3. Solicite arquivos ou trechos para análise.

Passos de Implementação 1. Criação de Entidade 2. Interface & Repositório 3. Use-Case 4. Controller & Teste Unitário 5. Teste E2E

Importante: Não gerar/atualizar arquivos sem confirmar escopo e obter exemplos/regras de negócio.
