📋 Análise por Entidade:

1. Flashcard ✅ PRECISA de tudo

- Rotas: CRUD completo para professores
- Use Cases: Create, Update, Delete, List, GetByIdok
- Repositório: Completo com queries específicas
- Justificativa: Entidade principal com gestão direta

2. FlashcardTag ✅ PRECISA de tudo

- Rotas: CRUD para professores gerenciarem tags
- Use Cases: Create, Update, Delete, List, GetById
- Repositório: Completo com busca por nome/slug
- Justificativa: Gestão independente de tags

3. FlashcardInteraction ⚠️ PARCIAL

- Rotas: Apenas POST/PUT (estudante marca dificuldade)
- Use Cases: Apenas CreateOrUpdate (sobrescreve)
- Repositório: Simples (findByUserAndFlashcard, upsert)
- Justificativa: Não há gestão CRUD, apenas registro de
  interação

🔄 Fluxos Identificados:

Professor:

- POST /flashcards - Criar flashcard ##0k
- PUT /flashcards/:id - Atualizar flashcard
- DELETE /flashcards/:id - Deletar flashcard
- GET /flashcards - Listar flashcards (com filtros) ##ok
- POST /flashcard-tags - Criar tag ##ok
- PUT /flashcard-tags/:id - Atualizar tag

Estudante:

- POST /flashcards/:id/interact - Marcar como
  fácil/difícil
- GET /flashcards/by-lesson/:lessonId - Flashcards da
  aula
- GET /flashcards/by-argument/:argumentId - Flashcards
  do argumento

Concorda com esta abordagem?

> FlashcardInteraction ⚠️ PARCIAL

    - Rotas: Apenas POST/PUT (estudante marca dificuldade)
    - Use Cases: Apenas CreateOrUpdate (sobrescreve)
    - Repositório: Simples (findByUserAndFlashcard,

upsert) - Justificativa: Não há gestão CRUD, apenas registro
de
interação duvida mas a leitura de onde vem ?

⏺ Excelente pergunta! Você está certo, a leitura é
essencial. Vou corrigir:

🔄 FlashcardInteraction - Análise Completa:

📖 Leituras Necessárias:

1. Métricas do Estudante:

- GET /me/flashcards/stats - Minhas estatísticas gerais
- GET /me/flashcards/stats/by-argument/:argumentId -
  Stats por argumento
- GET /flashcards/:id/my-interaction - Minha interação
  com flashcard específico

2. Métricas do Professor:

- GET /arguments/:id/flashcards/stats - Stats gerais do
  argumento
- GET /flashcards/:id/stats - Stats de um flashcard
  específico

3. Algoritmo de Reapresentação:

- GET /me/flashcards/hard - Flashcards marcados como
  difíceis
- GET /me/flashcards/review-needed - Flashcards para
  revisão

⚠️ Correção: FlashcardInteraction PRECISA de mais:

Rotas:

- ✅ POST/PUT /flashcards/:id/interact - Marcar
  dificuldade
- ✅ GET /me/flashcards/interactions - Minhas interações
- ✅ GET /flashcards/:id/interactions - Interações do
  flashcard (admin)

Use Cases:

- ✅ CreateOrUpdateInteraction - Sobrescrever interação
- ✅ GetUserInteractions - Buscar interações do usuário
- ✅ GetFlashcardStats - Estatísticas do flashcard

Repositório:

- ✅ findByUserAndFlashcard - Interação específica
- ✅ findByUser - Todas interações do usuário
- ✅ findByFlashcard - Todas interações do flashcard
- ✅ upsert - Criar ou atualizar
