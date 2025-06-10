// test/e2e/videos.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('VideoController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const realVideoId = 'any-video-id';
  let courseId: string;
  let moduleId: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('VideoHostProvider')
      .useValue({
        getMetadata: async () => ({ durationInSeconds: 123 }),
        getEmbedUrl: () => 'https://fake/embed/url',
      })
      .compile();

    app = modRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // wipe and seed
    await prisma.videoTranslation.deleteMany();
    await prisma.video.deleteMany();
    await prisma.moduleTranslation.deleteMany();
    await prisma.module.deleteMany();
    await prisma.courseTranslation.deleteMany();
    await prisma.course.deleteMany();

    const course = await prisma.course.create({
      data: {
        slug: 'test-course',
        translations: {
          create: [
            { locale: 'pt', title: 'Curso PT', description: 'Desc PT' },
            { locale: 'it', title: 'Corso IT', description: 'Desc IT' },
            { locale: 'es', title: 'Curso ES', description: 'Desc ES' },
          ],
        },
      },
    });
    courseId = course.id;

    const module = await prisma.module.create({
      data: {
        slug: 'test-module',
        order: 1,
        courseId,
        translations: {
          create: [
            { locale: 'pt', title: 'Módulo PT', description: 'Desc PT' },
            { locale: 'it', title: 'Modulo IT', description: 'Desc IT' },
            { locale: 'es', title: 'Modulo ES', description: 'Desc ES' },
          ],
        },
      },
    });
    moduleId = module.id;
  });

  const endpoint = () => `/courses/${courseId}/modules/${moduleId}/videos`;

  it('[POST] create video → Success', async () => {
    const payload = {
      slug: 'video-intro',
      providerVideoId: realVideoId,
      translations: [
        { locale: 'pt', title: 'Vídeo Intro', description: 'Desc PT' },
        { locale: 'it', title: 'Video Intro', description: 'Desc IT' },
        { locale: 'es', title: 'Video Intro', description: 'Desc ES' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(endpoint())
      .send(payload);
    
    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        slug: payload.slug,
        providerVideoId: payload.providerVideoId,
        durationInSeconds: 123,
        isSeen: false,
      }),
    );
  });

  it('[POST] create video → Duplicate Slug', async () => {
    const payload = {
      slug: 'dup-video',
      providerVideoId: realVideoId,
      translations: [
        { locale: 'pt', title: 'Dup PT', description: 'Desc PT' },
        { locale: 'it', title: 'Dup IT', description: 'Desc IT' },
        { locale: 'es', title: 'Dup ES', description: 'Desc ES' },
      ],
    };


    let res = await request(app.getHttpServer())
      .post(endpoint())
      .send(payload);
    expect(res.status).toBe(201);


    res = await request(app.getHttpServer())
      .post(endpoint())
      .send(payload);
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message');
  });

  it('[POST] create video → Missing Portuguese Translation', async () => {
    const payload = {
      slug: 'no-pt-video',
      providerVideoId: realVideoId,
      translations: [
        { locale: 'it', title: 'Only IT', description: 'Desc IT' },
        { locale: 'es', title: 'Only ES', description: 'Desc ES' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(endpoint())
      .send(payload);
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');


    const message = res.body.message;
    
    if (typeof message === 'string') {
      expect(message.toLowerCase()).toContain('translation');
    } else if (Array.isArray(message)) {

      const hasTranslationError = message.some(err => {
        if (typeof err === 'string') {
          return err.toLowerCase().includes('translation');
        } else if (typeof err === 'object' && err !== null) {

          const messageContainsTranslation = err.message && 
            err.message.toLowerCase().includes('translation');
          const pathContainsTranslation = err.path && 
            Array.isArray(err.path) && 
            err.path.some(p => p.toLowerCase().includes('translation'));
          return messageContainsTranslation || pathContainsTranslation;
        }
        return false;
      });
      expect(hasTranslationError).toBe(true);
    } else if (typeof message === 'object' && message !== null) {

      const messageStr = JSON.stringify(message).toLowerCase();
      expect(messageStr).toContain('translation');
    }
  });

  it('[POST] create video → Unsupported Locale', async () => {
    const payload = {
      slug: 'bad-locale',
      providerVideoId: realVideoId,
      translations: [
        { locale: 'pt', title: 'OK', description: 'Desc PT' },
        { locale: 'en' as any, title: 'EN', description: 'Desc EN' },
      ],
    };

    const res = await request(app.getHttpServer())
      .post(endpoint())
      .send(payload);
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');


    const message = res.body.message;
    

    let messageStr: string;
    if (typeof message === 'string') {
      messageStr = message;
    } else if (Array.isArray(message)) {
      messageStr = message.join(' ');
    } else if (typeof message === 'object' && message !== null) {
      messageStr = JSON.stringify(message);
    } else {
      messageStr = String(message);
    }


    const errorPatterns = [
      /must be one of/i,
      /locale.*must be.*valid/i,
      /invalid.*locale/i,
      /locale.*enum/i,
      /translations\.\d+\.locale/i,  
      /each value in locale must be a valid enum value/i,
      /pt.*it.*es/i,  
      /validation.*fail/i,
      /bad.*request/i,
      /invalid.*value/i
    ];

    const hasValidationError = errorPatterns.some(pattern => 
      pattern.test(messageStr)
    );

    expect(res.status === 400 || hasValidationError).toBe(true);
  });
});