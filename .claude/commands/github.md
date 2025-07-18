---
description: Regras e padrões para commits no projeto
---

# Regras de Commit e Git

## ⚠️ REGRA CRÍTICA: Mensagens de Commit Simples e Diretas

### SEMPRE use commits curtos e sem metadados extras:

✅ CORRETO:
```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve navigation issue"
git commit -m "refactor: simplify payment logic"
```

❌ EVITAR:
- Mensagens multi-linha desnecessárias
- Metadados de ferramentas (Co-Authored-By, Generated with, etc)
- Emojis ou formatações especiais
- Referências a ferramentas de IA

### Por quê?

- Mantém o histórico limpo e profissional
- Facilita a leitura do log
- Evita poluição no histórico do git
- Padrão da indústria

## Padrão de Commits (Conventional Commits)

### Formato:

```bash
<tipo>(<escopo opcional>): <descrição>

[corpo opcional]

[rodapé opcional]
Tipos Permitidos:

feat: Nova funcionalidade
fix: Correção de bug
docs: Apenas documentação
style: Formatação (sem mudança de código)
refactor: Refatoração sem mudança funcional
perf: Melhoria de performance
test: Adição/correção de testes
chore: Manutenção, dependências
build: Mudanças no build system

Exemplos Corretos:
bash# Feature
git commit -m "feat: add password recovery form"
git commit -m "feat(auth): implement JWT refresh token"

# Fix
git commit -m "fix: resolve form state not clearing after submit"
git commit -m "fix(courses): correct module ordering logic"

# Refactor
git commit -m "refactor: simplify course fetching logic"
git commit -m "refactor(components): extract shared modal logic"

# Style
git commit -m "style: improve spacing in course cards"
git commit -m "style(ui): align buttons consistently"

# Docs
git commit -m "docs: update API integration guide"
git commit -m "docs(readme): add setup instructions"
Workflow de Commit
1. Verificar mudanças:
bashgit status
git diff
2. Adicionar arquivos:
bash# Específicos
git add src/components/NewComponent.tsx
git add src/styles/component.css

# Todos (use com cuidado)
git add .

# Interativo (recomendado)
git add -p
3. Commit com mensagem simples e direta:
```bash
# SEMPRE prefira o formato curto:
git commit -m "feat: add course enrollment animation"

# NÃO use formatações extras ou metadados:
# ❌ git commit -m "$(cat <<'EOF'..."
# ❌ Adicionar Co-Authored-By
# ❌ Adicionar links ou emojis
```
4. Push para o repositório:
bashgit push origin main
# ou
git push origin feature/nome-da-feature
Regras Específicas do Projeto
1. Sempre em inglês
bash✅ git commit -m "fix: resolve navigation issue"
❌ git commit -m "fix: corrigir problema de navegação"
2. Mensagem concisa (50-72 caracteres)
bash✅ git commit -m "feat: add course completion badge"
❌ git commit -m "feat: add a new badge that shows when user completes all modules in a course successfully"
3. Use imperativo
bash✅ git commit -m "add loading state" (não "added" ou "adding")
✅ git commit -m "fix memory leak" (não "fixed" ou "fixing")
4. Seja específico
bash✅ git commit -m "fix: prevent form double submission"
❌ git commit -m "fix: bug fix"
❌ git commit -m "update files"
## Commits Multi-line (apenas quando estritamente necessário)

⚠️ **IMPORTANTE**: Prefira sempre commits simples de uma linha. Use multi-line APENAS para:
- Pull Requests que agregam múltiplos commits
- Mudanças muito complexas que requerem contexto extra
- Quando explicitamente solicitado

### Exemplo (use com moderação):
```bash
git commit -m "feat: implement course recommendation system

- Add recommendation algorithm
- Create API endpoint
- Add UI component

Closes #123"
```
Corrigindo Commits
Alterar último commit:
bash# Mudar mensagem apenas
git commit --amend -m "feat: correct message"

# Adicionar arquivos esquecidos
git add arquivo-esquecido.tsx
git commit --amend --no-edit
Squash commits antes do push:
bash# Últimos 3 commits
git rebase -i HEAD~3
Git Aliases Úteis
Adicione ao .gitconfig:
bash[alias]
    # Atalhos para comandos comuns
    st = status
    co = checkout
    br = branch

    # Commit semântico rápido
    feat = "!f() { git commit -m \"feat: $@\"; }; f"
    fix = "!f() { git commit -m \"fix: $@\"; }; f"
    docs = "!f() { git commit -m \"docs: $@\"; }; f"
    style = "!f() { git commit -m \"style: $@\"; }; f"
    refactor = "!f() { git commit -m \"refactor: $@\"; }; f"

    # Log bonito
    lg = log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
Uso:
bashgit feat "add user authentication"
git fix "resolve memory leak in course list"
Checklist Antes do Commit

 Código está funcionando (testado manualmente)
 Sem console.log ou código de debug
 Formatação correta (Prettier/ESLint)
 Arquivos desnecessários removidos
 Mensagem de commit segue o padrão
 Sem informações sensíveis (tokens, passwords)
 Sem atribuições automáticas do Claude

## Exemplo de Sessão Completa

```bash
# 1. Verificar mudanças
git status
git diff

# 2. Adicionar arquivos
git add src/components/PasswordResetForm.tsx
git add src/components/PasswordResetForm.module.css

# 3. Commit SIMPLES e DIRETO
git commit -m "feat(auth): add password reset form"

# 4. Push
git push origin main
```

## Instruções para Claude/IA

1. **SEMPRE** use o formato simples: `git commit -m "tipo: descrição"`
2. **NUNCA** use HEREDOC ou formatações complexas
3. **NUNCA** adicione metadados extras (Co-Authored-By, links, etc)
4. **MANTENHA** as mensagens curtas e diretas
```
