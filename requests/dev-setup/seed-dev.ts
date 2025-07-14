#!/usr/bin/env tsx
// requests/dev-setup/seed-dev.ts
// Script para popular o banco com dados de desenvolvimento

import { PrismaClient } from '@prisma/client';
import { DEV_IDS, DEV_DATA } from './dev-ids';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando seed de desenvolvimento...');

  try {
    // Limpar dados existentes (ordem importante por causa das FKs)
    console.log('🧹 Limpando dados existentes...');
    
    await prisma.attemptAnswer.deleteMany();
    await prisma.attempt.deleteMany();
    await prisma.answerTranslation.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.argument.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.lessonDocumentTranslation.deleteMany();
    await prisma.lessonDocument.deleteMany();
    await prisma.videoTranslation.deleteMany();
    await prisma.video.deleteMany();
    await prisma.lessonTranslation.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.moduleTranslation.deleteMany();
    await prisma.module.deleteMany();
    await prisma.trackTranslation.deleteMany();
    // Deletar tabela de relacionamento primeiro
    await prisma.trackCourse.deleteMany();
    await prisma.track.deleteMany();
    await prisma.courseTranslation.deleteMany();
    await prisma.course.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();

    // Criar dados de desenvolvimento
    console.log('📝 Criando dados de desenvolvimento...');

    // 1. User
    await prisma.user.create({
      data: {
        id: DEV_DATA.user.id,
        name: DEV_DATA.user.name,
        email: DEV_DATA.user.email,
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password hash para 'password'
        cpf: DEV_DATA.user.cpf,
        role: DEV_DATA.user.role,
      },
    });

    // 2. Courses
    const courses = [DEV_DATA.course, DEV_DATA.course2, DEV_DATA.course3];
    for (const course of courses) {
      await prisma.course.create({
        data: {
          id: course.id,
          slug: course.slug,
          imageUrl: course.imageUrl,
        },
      });

      await prisma.courseTranslation.create({
        data: {
          locale: 'pt',
          title: course.title,
          description: course.description,
          courseId: course.id,
        },
      });
    }

    // 3. Tracks
    const tracks = [DEV_DATA.track, DEV_DATA.track2, DEV_DATA.track3];
    for (const track of tracks) {
      await prisma.track.create({
        data: {
          id: track.id,
          slug: track.slug,
        },
      });

      await prisma.trackTranslation.create({
        data: {
          locale: 'pt',
          title: track.title,
          description: `Descrição do ${track.title}`,
          trackId: track.id,
        },
      });

      await prisma.trackCourse.create({
        data: {
          trackId: track.id,
          courseId: track.courseId,
        },
      });
    }

    // 4. Modules
    const modules = [DEV_DATA.module, DEV_DATA.module2, DEV_DATA.module3];
    for (const module of modules) {
      await prisma.module.create({
        data: {
          id: module.id,
          slug: module.slug,
          order: module.order,
          courseId: module.trackId.replace('440011', '440010').replace('440031', '440030').replace('440041', '440040'), // Map track to course
          imageUrl: module.imageUrl,
        },
      });

      await prisma.moduleTranslation.create({
        data: {
          locale: 'pt',
          title: module.title,
          description: module.description,
          moduleId: module.id,
        },
      });
    }

    // 5. Lessons
    const lessons = [DEV_DATA.lesson, DEV_DATA.lesson2, DEV_DATA.lesson3];
    for (const lesson of lessons) {
      await prisma.lesson.create({
        data: {
          id: lesson.id,
          slug: lesson.slug,
          order: lesson.order,
          moduleId: lesson.moduleId,
          imageUrl: lesson.imageUrl,
        },
      });

      await prisma.lessonTranslation.create({
        data: {
          locale: 'pt',
          title: lesson.title,
          description: lesson.description,
          lessonId: lesson.id,
        },
      });
    }

    // 6. Videos
    const videos = [DEV_DATA.video, DEV_DATA.video2, DEV_DATA.video3];
    for (const video of videos) {
      await prisma.video.create({
        data: {
          id: video.id,
          slug: video.slug,
          providerVideoId: video.providerVideoId,
          durationInSeconds: video.durationInSeconds,
          lessonId: video.lessonId,
          imageUrl: video.imageUrl,
        },
      });

      await prisma.videoTranslation.create({
        data: {
          locale: 'pt',
          title: `Vídeo - ${video.slug}`,
          description: `Descrição do ${video.slug}`,
          videoId: video.id,
        },
      });
    }

    // 7. Documents
    const documents = [DEV_DATA.document, DEV_DATA.document2, DEV_DATA.document3];
    for (const document of documents) {
      await prisma.lessonDocument.create({
        data: {
          id: document.id,
          filename: document.filename,
          lessonId: document.lessonId,
        },
      });

      await prisma.lessonDocumentTranslation.create({
        data: {
          locale: 'pt',
          title: document.filename.replace('.pdf', ''),
          description: `Documento de apoio: ${document.filename}`,
          url: `https://exemplo.com/documents/${document.filename}`,
          documentId: document.id,
        },
      });
    }

    // 8. Assessments
    const assessments = [DEV_DATA.assessment, DEV_DATA.assessment2, DEV_DATA.assessment3];
    for (const assessment of assessments) {
      await prisma.assessment.create({
        data: {
          id: assessment.id,
          slug: assessment.slug,
          title: assessment.title,
          description: assessment.description,
          type: assessment.type,
          passingScore: assessment.passingScore,
          randomizeQuestions: assessment.randomizeQuestions,
          randomizeOptions: assessment.randomizeOptions,
          lessonId: assessment.lessonId,
        },
      });
    }

    // 9. Arguments
    const argumentsData = [DEV_DATA.argument, DEV_DATA.argument2, DEV_DATA.argument3];
    for (const argument of argumentsData) {
      await prisma.argument.create({
        data: {
          id: argument.id,
          title: argument.title,
          assessmentId: argument.assessmentId,
        },
      });
    }

    // 10. Questions
    const questions = [DEV_DATA.question, DEV_DATA.question2, DEV_DATA.question3];
    for (const question of questions) {
      await prisma.question.create({
        data: {
          id: question.id,
          text: question.text,
          type: question.type,
          assessmentId: question.assessmentId,
          argumentId: question.argumentId,
        },
      });
    }

    // 11. Answers
    const answers = [DEV_DATA.answer, DEV_DATA.answer2, DEV_DATA.answer3];
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = [DEV_DATA.question, DEV_DATA.question2, DEV_DATA.question3][i];
      
      // Para múltipla escolha, definir a opção correta
      const correctOptionId = question.type === 'MULTIPLE_CHOICE' ? `${question.id}-option-1` : null;
      
      await prisma.answer.create({
        data: {
          id: answer.id,
          explanation: answer.explanation,
          questionId: answer.questionId,
          correctOptionId: correctOptionId,
        },
      });

      await prisma.answerTranslation.create({
        data: {
          locale: 'pt',
          explanation: answer.explanation,
          answerId: answer.id,
        },
      });
    }

    // 12. Question Options for Multiple Choice Questions
    const multipleChoiceQuestions = [DEV_DATA.question, DEV_DATA.question2];
    for (let i = 0; i < multipleChoiceQuestions.length; i++) {
      const question = multipleChoiceQuestions[i];
      const options = [
        { text: 'Aplicar conhecimentos médicos ao direito', isCorrect: true },
        { text: 'Realizar procedimentos cirúrgicos', isCorrect: false },
        { text: 'Diagnosticar doenças', isCorrect: false },
        { text: 'Prescrever medicamentos', isCorrect: false },
      ];

      if (i === 1) {
        // Question 2 options
        options[0] = { text: 'Eletrocardiograma (ECG)', isCorrect: true };
        options[1] = { text: 'Tomografia computadorizada', isCorrect: false };
        options[2] = { text: 'Ressonância magnética', isCorrect: false };
        options[3] = { text: 'Ecocardiograma', isCorrect: false };
      }

      for (let j = 0; j < options.length; j++) {
        await prisma.questionOption.create({
          data: {
            id: `${question.id}-option-${j + 1}`,
            text: options[j].text,
            questionId: question.id,
          },
        });
      }
    }

    console.log('✅ Seed de desenvolvimento concluído!');
    console.log('\n📋 IDs criados:');
    console.log(`Course 1 ID: ${DEV_IDS.courseId}`);
    console.log(`Course 2 ID: ${DEV_IDS.courseId2}`);
    console.log(`Course 3 ID: ${DEV_IDS.courseId3}`);
    console.log(`Track 1 ID: ${DEV_IDS.trackId}`);
    console.log(`Track 2 ID: ${DEV_IDS.trackId2}`);
    console.log(`Track 3 ID: ${DEV_IDS.trackId3}`);
    console.log(`Module 1 ID: ${DEV_IDS.moduleId}`);
    console.log(`Module 2 ID: ${DEV_IDS.moduleId2}`);
    console.log(`Module 3 ID: ${DEV_IDS.moduleId3}`);
    console.log(`Lesson 1 ID: ${DEV_IDS.lessonId}`);
    console.log(`Lesson 2 ID: ${DEV_IDS.lessonId2}`);
    console.log(`Lesson 3 ID: ${DEV_IDS.lessonId3}`);
    console.log(`Video 1 ID: ${DEV_IDS.videoId}`);
    console.log(`Video 2 ID: ${DEV_IDS.videoId2}`);
    console.log(`Video 3 ID: ${DEV_IDS.videoId3}`);
    console.log(`Document 1 ID: ${DEV_IDS.documentId}`);
    console.log(`Document 2 ID: ${DEV_IDS.documentId2}`);
    console.log(`Document 3 ID: ${DEV_IDS.documentId3}`);
    console.log(`Assessment 1 ID (Quiz): ${DEV_IDS.assessmentId}`);
    console.log(`Assessment 2 ID (Simulado): ${DEV_IDS.assessmentId2}`);
    console.log(`Assessment 3 ID (Perguntas Abertas): ${DEV_IDS.assessmentId3}`);
    console.log(`Question 1 ID: ${DEV_IDS.questionId}`);
    console.log(`Question 2 ID: ${DEV_IDS.questionId2}`);
    console.log(`Question 3 ID: ${DEV_IDS.questionId3}`);
    console.log(`Answer 1 ID: ${DEV_IDS.answerId}`);
    console.log(`Answer 2 ID: ${DEV_IDS.answerId2}`);
    console.log(`Answer 3 ID: ${DEV_IDS.answerId3}`);
    console.log('\n🔗 Use estes IDs nos seus arquivos .http!');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });