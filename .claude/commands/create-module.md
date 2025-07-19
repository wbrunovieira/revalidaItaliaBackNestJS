---
description: Criar um novo módulo NestJS seguindo os padrões do projeto
argument-hint: <nome-modulo> [dominio]
allowed-tools: Bash, Write, Read, Edit
---

# Comando Create Module

Cria um novo módulo NestJS seguindo os padrões e standards estabelecidos no projeto.

## Uso
`/create-module <nome-modulo> [dominio]`

- `<nome-modulo>`: O nome do módulo no singular (ex: "product", "order", "payment")
- `[dominio]`: Opcional. O domínio ao qual pertence (padrão: "auth"). Opções: auth, course-catalog, etc.

## Exemplos
- `/create-module product course-catalog` - Cria ProductModule no domínio course-catalog
- `/create-module notification` - Cria NotificationModule no domínio auth (padrão)

## Tarefa

Com base no nome do módulo "$ARGUMENTS", crie um novo módulo seguindo estes padrões:

### 1. Estrutura do Módulo
Crie o arquivo do módulo no local correto seguindo o padrão em @docs/patterns/modules.md

### 2. Padrões Principais a Seguir:
- Nome do módulo deve ser SINGULAR (ProductModule, não ProductsModule)
- Comentário com o caminho do arquivo no cabeçalho é obrigatório
- Imports devem ser organizados por categoria com espaçamento adequado
- Incluir documentação JSDoc para o módulo
- Incluir apenas comentários necessários (Repository binding, Internal configuration)
- Seguir a ordem exata de imports: Framework → Infrastructure → Domain (Repositories) → Domain (Use Cases)

### 3. Pontos de Decisão:
- Se o módulo gerencia um repositório: importar DatabaseModule e criar repository binding
- Se o módulo apenas usa repositórios existentes: importar o módulo que os fornece
- Exportar interface do repositório se outros módulos precisarem
- Exportar use cases que outros módulos possam compor

### 4. Arquivos a Criar:
1. O arquivo do módulo em si
2. Atualizar HttpModule para importar o novo módulo

### 5. Validação:
Após criar o módulo, verifique:
- [ ] Arquivo tem comentário de caminho no cabeçalho
- [ ] Imports estão organizados corretamente
- [ ] Módulo tem documentação JSDoc
- [ ] Providers e exports seguem a ordem padrão
- [ ] Módulo está importado no HttpModule

### ⚠️ IMPORTANTE - Casos Especiais:
**SE encontrar qualquer situação não coberta pelos padrões:**
1. **NÃO tome decisões automáticas**
2. **PARE e analise** a necessidade específica
3. **CONSIDERE** as melhores práticas do NestJS e DDD
4. **APRESENTE** as opções disponíveis com justificativas
5. **PERGUNTE** ao usuário qual abordagem seguir

**Lembre-se:** 
- A camada de módulo deve manter sua responsabilidade conforme NestJS e DDD
- Módulos são apenas para **wiring/configuração**, nunca lógica de negócio
- Cada decisão arquitetural deve ser consciente e justificada
- É melhor perguntar do que assumir incorretamente

Consulte o documento completo de padrões em @docs/patterns/modules.md para diretrizes detalhadas.