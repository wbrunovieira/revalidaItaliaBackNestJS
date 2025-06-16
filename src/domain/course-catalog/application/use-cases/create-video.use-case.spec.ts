// import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { CreateVideoUseCase } from './create-video.use-case';
// import { InMemoryModuleRepository } from '@/test/repositories/in-memory-module-repository';
// import { InMemoryVideoRepository } from '@/test/repositories/in-memory-video-repository';
// import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
// import { UniqueEntityID } from '@/core/unique-entity-id';
// import { InvalidInputError } from './errors/invalid-input-error';
// import { ModuleNotFoundError } from './errors/module-not-found-error';
// import { DuplicateVideoError } from './errors/duplicate-video-error';
// import { RepositoryError } from './errors/repository-error';
// import { right, left } from '@/core/either';
// import { VideoHostProvider } from '../providers/video-host.provider';

// function aValidRequest() {
//   return {
//     moduleId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
//     slug: 'video-test',
//     providerVideoId: 'panda-123',
//     translations: [
//       { locale: 'pt', title: 'Vídeo Teste', description: 'Desc PT' },
//       { locale: 'it', title: 'Video Test',    description: 'Desc IT' },
//       { locale: 'es', title: 'Vídeo Prueba',  description: 'Desc ES' },
//     ],
//   };
// }

// describe('CreateVideoUseCase', () => {
//   let moduleRepo: InMemoryModuleRepository;
//   let videoRepo: InMemoryVideoRepository;
//   let host: VideoHostProvider;
//   let getMetadataSpy: ReturnType<typeof vi.fn>;
//   let sut: CreateVideoUseCase;

//   beforeEach(() => {
//     moduleRepo = new InMemoryModuleRepository();
//     videoRepo = new InMemoryVideoRepository();

//     getMetadataSpy = vi.fn(async () => ({ durationInSeconds: 123 }));
//     const getEmbedUrlSpy = vi.fn(() => 'embed-url');

//     host = { getMetadata: getMetadataSpy, getEmbedUrl: getEmbedUrlSpy };

//     sut = new CreateVideoUseCase(
//       moduleRepo as any,
//       videoRepo as any,
//       host
//     );
//   });

//   it('creates a video successfully', async () => {
//     const mod = Module.create(
//       { slug: 'mod', translations: [{ locale: 'pt', title: 'M', description: 'D' }], order: 1, videos: [] },
//       new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
//     );
//     await moduleRepo.create('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', mod);

//     const result = await sut.execute(aValidRequest() as any);
//     expect(result.isRight()).toBe(true);
//     if (result.isRight()) {
//       const { video } = result.value;
//       expect(video.slug).toBe('video-test');
//       expect(video.durationInSeconds).toBe(123);
//       expect(getMetadataSpy).toHaveBeenCalledWith('panda-123');
//     }
//   });

//   it('returns InvalidInputError for missing providerVideoId', async () => {
//     const req = { ...aValidRequest(), providerVideoId: '' };
//     const result = await sut.execute(req as any);
//     expect(result.isLeft()).toBe(true);
//     if (result.isLeft()) {
//       expect(result.value).toBeInstanceOf(InvalidInputError);
//       expect((result.value as InvalidInputError).details)
//         .toEqual(expect.arrayContaining([
//           expect.objectContaining({ path: ['providerVideoId'] })
//         ]));
//     }
//   });

//   it('returns InvalidInputError for missing Portuguese translation', async () => {
//     const req = aValidRequest();
//     // remove Portuguese translation
//     req.translations = req.translations.filter(t => t.locale !== 'pt');

//     const result = await sut.execute(req as any);
//     expect(result.isLeft()).toBe(true);
//     if (result.isLeft()) {
//       const err = result.value as InvalidInputError;
//       expect(err.details[0].message).toMatch(/exactly three translations required/i);
//     }
//   });

//   it('errors if module not found', async () => {
//     const result = await sut.execute(aValidRequest() as any);
//     expect(result.isLeft()).toBe(true);
//     expect(result.value).toBeInstanceOf(ModuleNotFoundError);
//   });

//   it('errors on invalid slug format', async () => {
//     const mod = Module.create(
//       { slug: 'mod', translations: [{ locale: 'pt', title: 'M', description: 'D' }], order: 1, videos: [] },
//       new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
//     );
//     await moduleRepo.create('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', mod);
//     const req = { ...aValidRequest(), slug: 'Invalid Slug!' };
//     const result = await sut.execute(req as any);
//     expect(result.isLeft()).toBe(true);
//     expect(result.value).toBeInstanceOf(InvalidInputError);
//   });

//   it('errors on duplicate slug', async () => {
//     const mod = Module.create(
//       { slug: 'mod', translations: [{ locale: 'pt', title: 'M', description: 'D' }], order: 1, videos: [] },
//       new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
//     );
//     await moduleRepo.create('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', mod);
//     vi.spyOn(videoRepo, 'findBySlug').mockResolvedValueOnce(
//       right(mod as any)
//     );
//     const result = await sut.execute(aValidRequest() as any);
//     expect(result.isLeft()).toBe(true);
//     expect(result.value).toBeInstanceOf(DuplicateVideoError);
//   });

//   it('propagates host errors as RepositoryError', async () => {
//     const mod = Module.create(
//       { slug: 'mod', translations: [{ locale: 'pt', title: 'M', description: 'D' }], order: 1, videos: [] },
//       new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
//     );
//     await moduleRepo.create('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', mod);
//     getMetadataSpy.mockRejectedValueOnce(new Error('host fail'));
//     const result = await sut.execute(aValidRequest() as any);
//     expect(result.isLeft()).toBe(true);
//     expect(result.value).toBeInstanceOf(RepositoryError);
//   });

//   it('propagates repo.create errors as RepositoryError', async () => {
//     const mod = Module.create(
//       { slug: 'mod', translations: [{ locale: 'pt', title: 'M', description: 'D' }], order: 1, videos: [] },
//       new UniqueEntityID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
//     );
//     await moduleRepo.create('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', mod);
//     vi.spyOn(videoRepo, 'create').mockResolvedValueOnce(
//       left(new Error('save fail'))
//     );
//     const result = await sut.execute(aValidRequest() as any);
//     expect(result.isLeft()).toBe(true);
//     expect(result.value).toBeInstanceOf(RepositoryError);
//   });
// });
