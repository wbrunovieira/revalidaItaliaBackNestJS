# Fluxo de Criação de Assessment - Frontend

## 🎯 Fluxo Ideal de Criação (Wizard/Stepper)

### **Passo 1: Criar Assessment (Configurações Gerais)**

```typescript
// Formulário inicial com:
- title
- description
- type (QUIZ/SIMULADO/PROVA_ABERTA)
- lessonId (opcional - vincular a uma aula)
- quizPosition (BEFORE/AFTER se for QUIZ)
- passingScore
- timeLimitInMinutes (se SIMULADO)
- randomizeQuestions
- randomizeOptions
```

### **Passo 2: Definir Argument (Tema da Prova)**

```typescript
// Argument é o tema/assunto principal da prova
// Exemplo: "Matemática Básica" ou "Anatomia Humana"
- Criar um único argument por assessment
- Título obrigatório para o argument
- Sugestão: pré-preencher com título do assessment
```

### **Passo 3: Adicionar Questões**

```typescript
// Para o Argument criado:
- Criar questões (MULTIPLE_CHOICE ou OPEN)
- Se MULTIPLE_CHOICE: adicionar opções
- Definir resposta correta
- Adicionar explicação do gabarito
```

## 📋 Considerações Importantes:

### **1. Arguments (Tema da Prova)**

- **Propósito**: Define o tema/assunto principal da prova
- **Relação**: 1 assessment = 1 argument
- **Benefícios**:
  - Organização clara do conteúdo
  - Facilita análise de desempenho por tema
  - Simplifica a estrutura
- **Implementação**: Criar automaticamente ao criar assessment

### **2. Vinculação com Lessons**

- **Opcional para todos os tipos**: QUIZ, SIMULADO e PROVA_ABERTA
- **Benefícios**:
  - Organiza assessments por aula/módulo
  - Facilita navegação do aluno
  - Permite relatórios por lesson
  - QUIZ pode ser configurado para aparecer antes ou depois da aula

### **3. Fluxo Alternativo (Inline)**

```typescript
// Tudo em uma única tela:
Assessment Info
├── Lesson: [Seletor de Lesson - opcional]
└── Argument (Tema)
    ├── Question 1
    │   └── Options/Answer
    ├── Question 2
    │   └── Options/Answer
    └── [+ Add Question]
```

### **4. Lógica de Validação Frontend**

```typescript
// Regras de negócio importantes:
1. QUIZ:
   - Deve definir quizPosition (BEFORE/AFTER)
   - Geralmente tem poucas questões (5-10)
   - Comumente vinculado a uma lesson

2. SIMULADO:
   - Deve ter timeLimitInMinutes
   - Geralmente tem muitas questões (30-100)
   - Um único argument organiza todas as questões

3. PROVA_ABERTA:
   - Questões apenas do tipo OPEN
   - Correção manual pelo professor

4. TODOS os tipos:
   - Podem ser vinculados a uma lesson (lessonId)
   - Devem ter passingScore definido
```

### **5. UX Melhorias**

```typescript
// Features recomendadas:
1. Auto-save (salvar rascunho)
2. Preview da prova
3. Importar questões de outras provas
4. Duplicar questões
5. Banco de questões reutilizáveis
6. Templates de assessment
```

### **6. Estrutura de Estado (Frontend)**

```typescript
interface AssessmentCreationState {
  step: 1 | 2 | 3;
  assessment: {
    id?: string; // após criar
    title: string;
    description?: string;
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
    lessonId?: string; // opcional para todos os tipos
    quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON'; // apenas se type === 'QUIZ'
    passingScore: number;
    timeLimitInMinutes?: number; // apenas se type === 'SIMULADO'
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
  };
  argument: {
    tempId: string; // ID temporário no frontend
    id?: string; // ID real após salvar
    title: string;
  };
  questions: Array<{
    tempId: string;
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN';
    options: Array<{
      tempId: string;
      text: string;
      isCorrect: boolean;
    }>;
    explanation: string;
  }>;
}
```

### **7. Endpoints Necessários**

```typescript
// Sequência de chamadas:
1. POST /assessments (cria o assessment)
2. POST /assessments/:id/argument (cria o único argument)
3. POST /arguments/:id/questions (cria questões em batch)
4. POST /questions/:id/options (se múltipla escolha)
5. POST /questions/:id/answer (define gabarito)
```

## 🎨 Melhor Abordagem UX:

**Para máxima flexibilidade**, recomendo:

1. **Criação em Etapas com Save Parcial**

   - Salvar Assessment primeiro
   - Criar Argument automaticamente (ou solicitar título)
   - Permitir adicionar Questions depois
   - Botão "Publicar" quando estiver completo

2. **Interface Tipo "Builder"**

   - Informações do Assessment no topo
   - Área principal com Questions
   - Drag & drop para reordenar questões
   - Ações rápidas (duplicar, mover, deletar)

3. **Validações em Tempo Real**
   - Mínimo 1 questão por assessment
   - Múltipla escolha precisa 2+ opções
   - Apenas 1 opção correta
   - Argument título obrigatório

### **8. Sugestão de Implementação**

```typescript
// Ao criar o Assessment, automaticamente criar o Argument:
const argument = await createArgument({
  assessmentId: assessment.id,
  title: assessment.title, // ou solicitar título específico
});
```

Isso simplifica o fluxo e garante que sempre haverá um argument para organizar as questões.

Essa abordagem oferece flexibilidade para professores criarem provas simples rapidamente ou provas complexas com boa organização! 🚀
