// test/e2e/answers/shared/answer-test-setup.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { GetAnswerUseCase } from '../../../../src/domain/assessment/application/use-cases/get-answer.use-case';
import { CreateAnswerUseCase } from '../../../../src/domain/assessment/application/use-cases/create-answer.use-case';
import { ListAnswersUseCase } from '../../../../src/domain/assessment/application/use-cases/list-answers.use-case';
import { AnswerController } from '../../../../src/infra/controllers/answer.controller';
import { PrismaAnswerRepository } from '../../../../src/infra/database/prisma/repositories/prisma-answer-repository';
import { PrismaQuestionRepository } from '../../../../src/infra/database/prisma/repositories/prisma-question-repository';
import { PrismaAssessmentRepository } from '../../../../src/infra/database/prisma/repositories/prisma-assessment-repository';

@Module({
  controllers: [AnswerController],
  providers: [
    GetAnswerUseCase,
    CreateAnswerUseCase,
    ListAnswersUseCase,
    PrismaService,
    {
      provide: 'AnswerRepository',
      useClass: PrismaAnswerRepository,
    },
    {
      provide: 'QuestionRepository',
      useClass: PrismaQuestionRepository,
    },
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    },
  ],
})
export class TestAnswerModule {}

export class AnswerTestSetup {
  public app: INestApplication;
  public prisma: PrismaService;
  public courseId: string;
  public moduleId: string;
  public lessonId: string;
  public quizAssessmentId: string;
  public simuladoAssessmentId: string;
  public provaAbertaAssessmentId: string;
  public questionId: string;
  public multipleChoiceQuestionId: string;
  public openQuestionId: string;
  public answerId: string;
  public multipleChoiceAnswerId: string;
  public openAnswerId: string;
  public firstOptionId: string;
  public secondOptionId: string;

  async initialize(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAnswerModule],
    }).compile();

    this.app = moduleRef.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await this.app.init();
    this.prisma = this.app.get(PrismaService);

    await this.cleanupDatabase();
  }

  async setupTestData(): Promise<void> {
    // Clean up before each test for isolation
    await this.cleanupDatabase();

    // Create base structure: Course > Module > Lesson > Assessments > Questions > Answers
    const course = await this.prisma.course.create({
      data: {
        slug: 'test-course',
        translations: {
          create: [
            { locale: 'pt', title: 'Curso de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Corso di Test', description: 'Desc IT' },
            { locale: 'es', title: 'Curso de Prueba', description: 'Desc ES' },
          ],
        },
      },
    });
    this.courseId = course.id;

    const module = await this.prisma.module.create({
      data: {
        slug: 'test-module',
        order: 1,
        courseId: this.courseId,
        translations: {
          create: [
            { locale: 'pt', title: 'Módulo de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Modulo di Test', description: 'Desc IT' },
            { locale: 'es', title: 'Módulo de Prueba', description: 'Desc ES' },
          ],
        },
      },
    });
    this.moduleId = module.id;

    const lesson = await this.prisma.lesson.create({
      data: {
        slug: 'test-lesson',
        moduleId: this.moduleId,
        order: 1,
        translations: {
          create: [
            { locale: 'pt', title: 'Aula de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Lezione di Test', description: 'Desc IT' },
            {
              locale: 'es',
              title: 'Lección de Prueba',
              description: 'Desc ES',
            },
          ],
        },
      },
    });
    this.lessonId = lesson.id;

    // Create different types of assessments
    const quizAssessment = await this.prisma.assessment.create({
      data: {
        slug: 'test-quiz',
        title: 'Test Quiz Assessment',
        description: 'Quiz for multiple choice questions',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: this.lessonId,
      },
    });
    this.quizAssessmentId = quizAssessment.id;

    const simuladoAssessment = await this.prisma.assessment.create({
      data: {
        slug: 'test-simulado',
        title: 'Test Simulado Assessment',
        description: 'Simulado for multiple choice questions',
        type: 'SIMULADO',
        passingScore: 75,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: this.lessonId,
      },
    });
    this.simuladoAssessmentId = simuladoAssessment.id;

    const provaAbertaAssessment = await this.prisma.assessment.create({
      data: {
        slug: 'test-prova-aberta',
        title: 'Test Prova Aberta Assessment',
        description: 'Prova aberta for open questions',
        type: 'PROVA_ABERTA',
        passingScore: 60,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: this.lessonId,
      },
    });
    this.provaAbertaAssessmentId = provaAbertaAssessment.id;

    // Create test questions
    const multipleChoiceQuestion = await this.prisma.question.create({
      data: {
        text: 'What is the capital of Brazil?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: this.quizAssessmentId,
      },
    });
    this.multipleChoiceQuestionId = multipleChoiceQuestion.id;
    this.questionId = multipleChoiceQuestion.id; // Default question ID

    // Create question options for multiple choice question
    const firstOption = await this.prisma.questionOption.create({
      data: {
        text: 'Brasília',
        questionId: this.multipleChoiceQuestionId,
      },
    });
    this.firstOptionId = firstOption.id;

    const secondOption = await this.prisma.questionOption.create({
      data: {
        text: 'São Paulo',
        questionId: this.multipleChoiceQuestionId,
      },
    });
    this.secondOptionId = secondOption.id;

    const openQuestion = await this.prisma.question.create({
      data: {
        text: 'Explain the pathophysiology of hypertension and discuss current treatment guidelines.',
        type: 'OPEN',
        assessmentId: this.provaAbertaAssessmentId,
      },
    });
    this.openQuestionId = openQuestion.id;

    // Create test answers - ONLY for GET tests, not for POST tests
    // These are used by existing GET tests that expect pre-existing answers
    const multipleChoiceAnswer = await this.prisma.answer.create({
      data: {
        explanation: 'Brasília is the capital of Brazil, established in 1960.',
        questionId: this.multipleChoiceQuestionId,
        correctOptionId: this.firstOptionId,
        translations: {
          create: [
            {
              locale: 'pt',
              explanation:
                'Brasília é a capital do Brasil, estabelecida em 1960.',
            },
            {
              locale: 'it',
              explanation:
                'Brasília è la capitale del Brasile, stabilita nel 1960.',
            },
            {
              locale: 'es',
              explanation:
                'Brasília es la capital de Brasil, establecida en 1960.',
            },
          ],
        },
      },
    });
    this.multipleChoiceAnswerId = multipleChoiceAnswer.id;
    this.answerId = multipleChoiceAnswer.id; // Default answer ID

    const openAnswer = await this.prisma.answer.create({
      data: {
        explanation:
          'Hypertension is characterized by elevated blood pressure (≥140/90 mmHg). The pathophysiology involves increased peripheral resistance, reduced arterial compliance, and endothelial dysfunction. Treatment includes lifestyle modifications and antihypertensive medications.',
        questionId: this.openQuestionId,
        translations: {
          create: [
            {
              locale: 'pt',
              explanation:
                'A hipertensão é caracterizada por pressão arterial elevada (≥140/90 mmHg). A fisiopatologia envolve aumento da resistência periférica, redução da complacência arterial e disfunção endotelial. O tratamento inclui modificações no estilo de vida e medicamentos anti-hipertensivos.',
            },
          ],
        },
      },
    });
    this.openAnswerId = openAnswer.id;
  }

  async cleanupDatabase(): Promise<void> {
    if (!this.prisma) return;

    try {
      // Clean up in correct order to respect foreign keys
      await this.prisma.answerTranslation.deleteMany({});
      await this.prisma.answer.deleteMany({});
      await this.prisma.questionOption.deleteMany({});
      await this.prisma.question.deleteMany({});
      await this.prisma.assessment.deleteMany({});
      await this.prisma.lessonTranslation.deleteMany({});
      await this.prisma.lesson.deleteMany({});
      await this.prisma.moduleTranslation.deleteMany({});
      await this.prisma.module.deleteMany({});
      await this.prisma.courseTranslation.deleteMany({});
      await this.prisma.course.deleteMany({});
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }

  async teardown(): Promise<void> {
    await this.cleanupDatabase();
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * Get HTTP server instance for supertest
   */
  getHttpServer() {
    return this.app.getHttpServer();
  }

  /**
   * Create a test answer with custom data
   */
  async createTestAnswer(data: {
    explanation: string;
    questionId: string;
    correctOptionId?: string;
    translations?: Array<{
      locale: string;
      explanation: string;
    }>;
  }): Promise<string> {
    const answer = await this.prisma.answer.create({
      data: {
        explanation: data.explanation,
        questionId: data.questionId,
        correctOptionId: data.correctOptionId || undefined,
        translations: data.translations
          ? {
              create: data.translations,
            }
          : undefined,
      },
    });
    return answer.id;
  }

  /**
   * Create a test question with custom data
   */
  async createTestQuestion(data: {
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN';
    assessmentId: string;
  }): Promise<string> {
    const question = await this.prisma.question.create({
      data: {
        text: data.text,
        type: data.type,
        assessmentId: data.assessmentId,
      },
    });
    return question.id;
  }

  /**
   * Create a test question with options for POST answer tests
   */
  async createTestQuestionWithOptions(data: {
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN';
    assessmentId: string;
    options?: string[];
  }): Promise<{ questionId: string; optionIds: string[] }> {
    const question = await this.prisma.question.create({
      data: {
        text: data.text,
        type: data.type,
        assessmentId: data.assessmentId,
      },
    });

    const optionIds: string[] = [];
    if (data.options && data.options.length > 0) {
      for (const optionText of data.options) {
        const option = await this.prisma.questionOption.create({
          data: {
            text: optionText,
            questionId: question.id,
          },
        });
        optionIds.push(option.id);
      }
    }

    return { questionId: question.id, optionIds };
  }

  /**
   * Find answer by ID
   */
  async findAnswerById(id: string) {
    return await this.prisma.answer.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });
  }

  /**
   * Find question by ID
   */
  async findQuestionById(id: string) {
    return await this.prisma.question.findUnique({
      where: { id },
    });
  }

  /**
   * Get answer count for testing
   */
  async getAnswerCount(): Promise<number> {
    return await this.prisma.answer.count();
  }

  /**
   * Generate a non-existent UUID for testing
   */
  getNonExistentUUID(): string {
    return '00000000-0000-0000-0000-000000000000';
  }

  /**
   * Generate a random UUID for testing
   */
  getRandomUUID(): string {
    return randomUUID();
  }

  /**
   * Wait for a specified time (useful for timestamp testing)
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get answer IDs by type for testing
   */
  getAnswerIdByType(type: 'MULTIPLE_CHOICE' | 'OPEN'): string {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return this.multipleChoiceAnswerId;
      case 'OPEN':
        return this.openAnswerId;
      default:
        return this.multipleChoiceAnswerId;
    }
  }

  /**
   * Get question IDs by type for testing
   */
  getQuestionIdByType(type: 'MULTIPLE_CHOICE' | 'OPEN'): string {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return this.multipleChoiceQuestionId;
      case 'OPEN':
        return this.openQuestionId;
      default:
        return this.multipleChoiceQuestionId;
    }
  }

  /**
   * Create answer with question for testing
   */
  async createAnswerWithQuestion(data: {
    questionText: string;
    questionType: 'MULTIPLE_CHOICE' | 'OPEN';
    answerExplanation: string;
    correctOptionId?: string;
    assessmentId?: string;
  }): Promise<{ questionId: string; answerId: string }> {
    const assessmentId =
      data.assessmentId ||
      (data.questionType === 'MULTIPLE_CHOICE'
        ? this.quizAssessmentId
        : this.provaAbertaAssessmentId);

    const questionId = await this.createTestQuestion({
      text: data.questionText,
      type: data.questionType,
      assessmentId,
    });

    const answerId = await this.createTestAnswer({
      explanation: data.answerExplanation,
      questionId,
      correctOptionId: data.correctOptionId,
    });

    return { questionId, answerId };
  }

  /**
   * Find answers by question ID
   */
  async findAnswersByQuestionId(questionId: string) {
    return await this.prisma.answer.findMany({
      where: { questionId },
      include: {
        translations: true,
      },
    });
  }

  /**
   * Verify answer data integrity
   */
  async verifyAnswerDataIntegrity(answerId: string): Promise<boolean> {
    const answer = await this.findAnswerById(answerId);
    if (!answer) return false;

    // Check if question exists
    const question = await this.findQuestionById(answer.questionId);
    if (!question) return false;

    // Check if answer has required fields
    if (!answer.explanation || answer.explanation.trim() === '') return false;

    // Check if correctOptionId is valid UUID format when present
    if (answer.correctOptionId && !this.isValidUUID(answer.correctOptionId)) {
      return false;
    }

    return true;
  }

  /**
   * Check if string is valid UUID format
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Create multiple answers for testing pagination
   */
  async createMultipleAnswers(count: number): Promise<string[]> {
    const answerIds: string[] = [];

    for (let i = 0; i < count; i++) {
      // Alternate between different question types for variety
      const questionId = i % 2 === 0 ? this.multipleChoiceQuestionId : this.openQuestionId;
      const isMultipleChoice = i % 2 === 0;

      // Create unique question for each answer to avoid conflicts
      const { questionId: uniqueQuestionId, optionIds } = await this.createTestQuestionWithOptions({
        text: `Test question ${i + 1} for multiple answers`,
        type: isMultipleChoice ? 'MULTIPLE_CHOICE' : 'OPEN',
        assessmentId: isMultipleChoice ? this.quizAssessmentId : this.provaAbertaAssessmentId,
        options: isMultipleChoice ? [`Option A ${i}`, `Option B ${i}`, `Option C ${i}`] : undefined,
      });

      const answerData = {
        explanation: `Test answer ${i + 1} for pagination testing`,
        questionId: uniqueQuestionId,
        correctOptionId: isMultipleChoice ? optionIds[0] : undefined,
        translations: [
          {
            locale: 'pt' as const,
            explanation: `Explicação ${i + 1} em português`,
          },
        ],
      };

      const answerId = await this.createTestAnswer(answerData);
      answerIds.push(answerId);
    }

    return answerIds;
  }
}
