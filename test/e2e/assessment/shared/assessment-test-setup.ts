// test/e2e/assessment/shared/assessment-test-setup.ts

import { PrismaClient } from '@prisma/client';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class AssessmentTestSetup {
  constructor(private prisma: PrismaClient) {}

  async createTestScenario() {
    // Create user
    const userId = new UniqueEntityID();
    await this.prisma.user.create({
      data: {
        id: userId.toString(),
        name: 'Test User',
        email: 'test@example.com',
        cpf: '123.456.789-00',
        password: 'hashed-password',
        role: 'STUDENT',
      },
    });

    // Create course, track and module first
    const courseId = new UniqueEntityID();
    await this.prisma.course.create({
      data: {
        id: courseId.toString(),
        slug: 'test-course',
        imageUrl: 'https://example.com/course.jpg',
      },
    });

    await this.prisma.courseTranslation.create({
      data: {
        courseId: courseId.toString(),
        locale: 'pt',
        title: 'Curso de Teste',
        description: 'Descrição do curso de teste',
      },
    });

    const trackId = new UniqueEntityID();
    await this.prisma.track.create({
      data: {
        id: trackId.toString(),
        slug: 'test-track',
      },
    });

    // Create track-course relationship
    await this.prisma.trackCourse.create({
      data: {
        trackId: trackId.toString(),
        courseId: courseId.toString(),
      },
    });

    await this.prisma.trackTranslation.create({
      data: {
        trackId: trackId.toString(),
        locale: 'pt',
        title: 'Trilha de Teste',
        description: 'Descrição da trilha de teste',
      },
    });

    const moduleId = new UniqueEntityID();
    await this.prisma.module.create({
      data: {
        id: moduleId.toString(),
        slug: 'test-module',
        order: 1,
        courseId: courseId.toString(),
      },
    });

    await this.prisma.moduleTranslation.create({
      data: {
        moduleId: moduleId.toString(),
        locale: 'pt',
        title: 'Módulo de Teste',
        description: 'Descrição do módulo de teste',
      },
    });

    // Create lesson
    const lessonId = new UniqueEntityID();
    await this.prisma.lesson.create({
      data: {
        id: lessonId.toString(),
        slug: 'test-lesson',
        moduleId: moduleId.toString(),
        order: 1,
      },
    });

    await this.prisma.lessonTranslation.create({
      data: {
        lessonId: lessonId.toString(),
        locale: 'pt',
        title: 'Aula de Teste',
        description: 'Descrição da aula de teste',
      },
    });

    // Create QUIZ assessment
    const quizId = new UniqueEntityID();
    await this.prisma.assessment.create({
      data: {
        id: quizId.toString(),
        slug: 'test-quiz',
        title: 'Test Quiz',
        description: 'A test quiz for E2E testing',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: lessonId.toString(),
      },
    });

    // Create question for quiz
    const questionId = new UniqueEntityID();
    await this.prisma.question.create({
      data: {
        id: questionId.toString(),
        text: 'What is 2+2?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: quizId.toString(),
      },
    });

    // Create options
    const option1Id = new UniqueEntityID();
    const option2Id = new UniqueEntityID();
    const option3Id = new UniqueEntityID();

    await this.prisma.questionOption.createMany({
      data: [
        {
          id: option1Id.toString(),
          text: '3',
          questionId: questionId.toString(),
        },
        {
          id: option2Id.toString(),
          text: '4',
          questionId: questionId.toString(),
        },
        {
          id: option3Id.toString(),
          text: '5',
          questionId: questionId.toString(),
        },
      ],
    });

    // Create answer
    const answerId = new UniqueEntityID();
    await this.prisma.answer.create({
      data: {
        id: answerId.toString(),
        correctOptionId: option2Id.toString(),
        explanation: 'Two plus two equals four',
        questionId: questionId.toString(),
      },
    });

    await this.prisma.answerTranslation.createMany({
      data: [
        {
          answerId: answerId.toString(),
          locale: 'pt',
          explanation: 'Dois mais dois é igual a quatro',
        },
        {
          answerId: answerId.toString(),
          locale: 'it',
          explanation: 'Due più due fa quattro',
        },
      ],
    });

    // Create SIMULADO assessment
    const simuladoId = new UniqueEntityID();
    await this.prisma.assessment.create({
      data: {
        id: simuladoId.toString(),
        slug: 'test-simulado',
        title: 'Test Simulado',
        description: 'A comprehensive medical exam simulation',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
      },
    });

    // Create argument for simulado
    const argumentId = new UniqueEntityID();
    await this.prisma.argument.create({
      data: {
        id: argumentId.toString(),
        title: 'Cardiology',
        assessmentId: simuladoId.toString(),
      },
    });

    // Create question for simulado
    const simuladoQuestionId = new UniqueEntityID();
    await this.prisma.question.create({
      data: {
        id: simuladoQuestionId.toString(),
        text: 'What is the normal heart rate?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: simuladoId.toString(),
        argumentId: argumentId.toString(),
      },
    });

    // Create options for simulado question
    const simOption1Id = new UniqueEntityID();
    const simOption2Id = new UniqueEntityID();

    await this.prisma.questionOption.createMany({
      data: [
        {
          id: simOption1Id.toString(),
          text: '40-60 bpm',
          questionId: simuladoQuestionId.toString(),
        },
        {
          id: simOption2Id.toString(),
          text: '60-100 bpm',
          questionId: simuladoQuestionId.toString(),
        },
      ],
    });

    // Create answer for simulado
    const simuladoAnswerId = new UniqueEntityID();
    await this.prisma.answer.create({
      data: {
        id: simuladoAnswerId.toString(),
        correctOptionId: simOption2Id.toString(),
        explanation: 'Normal adult resting heart rate is 60-100 bpm',
        questionId: simuladoQuestionId.toString(),
      },
    });

    // Create PROVA_ABERTA assessment
    const provaAbertaId = new UniqueEntityID();
    await this.prisma.assessment.create({
      data: {
        id: provaAbertaId.toString(),
        slug: 'test-prova-aberta',
        title: 'Test Prova Aberta',
        description: 'An open-ended exam',
        type: 'PROVA_ABERTA',
        randomizeQuestions: false,
        randomizeOptions: false,
      },
    });

    // Create open question
    const openQuestionId = new UniqueEntityID();
    await this.prisma.question.create({
      data: {
        id: openQuestionId.toString(),
        text: 'Explain the cardiovascular system',
        type: 'OPEN',
        assessmentId: provaAbertaId.toString(),
      },
    });

    // Create empty assessment
    const emptyAssessmentId = new UniqueEntityID();
    await this.prisma.assessment.create({
      data: {
        id: emptyAssessmentId.toString(),
        slug: 'empty-assessment',
        title: 'Empty Assessment',
        description: 'An assessment with no questions',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
    });

    return {
      userId: userId.toString(),
      lessonId: lessonId.toString(),
      quizId: quizId.toString(),
      simuladoId: simuladoId.toString(),
      provaAbertaId: provaAbertaId.toString(),
      emptyAssessmentId: emptyAssessmentId.toString(),
      questionId: questionId.toString(),
      simuladoQuestionId: simuladoQuestionId.toString(),
      openQuestionId: openQuestionId.toString(),
      option2Id: option2Id.toString(),
      simOption2Id: simOption2Id.toString(),
      argumentId: argumentId.toString(),
    };
  }

  async cleanup() {
    // Clean up in reverse order of creation to avoid foreign key constraints
    await this.prisma.answerTranslation.deleteMany();
    await this.prisma.answer.deleteMany();
    await this.prisma.questionOption.deleteMany();
    await this.prisma.question.deleteMany();
    await this.prisma.argument.deleteMany();
    await this.prisma.assessment.deleteMany();
    await this.prisma.lessonTranslation.deleteMany();
    await this.prisma.lesson.deleteMany();
    await this.prisma.moduleTranslation.deleteMany();
    await this.prisma.module.deleteMany();
    await this.prisma.trackTranslation.deleteMany();
    await this.prisma.trackCourse.deleteMany();
    await this.prisma.track.deleteMany();
    await this.prisma.courseTranslation.deleteMany();
    await this.prisma.course.deleteMany();
    await this.prisma.user.deleteMany();
  }
}