docker exec -it ead-backend-dev sh -c "pnpm test"

docker exec -it ead-backend-dev sh -c "\
 pnpm vitest run src/domain/course-catalog/application/use-cases/list-videos.use-case.spec.ts\
"
docker exec -it ead-backend-dev sh -c "\
 pnpm vitest run src/infra/controllers/video.controller.spec.ts\
"

docker exec -it ead-backend sh -c "pnpm test:e2e"

docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma migrate reset --force

docker exec -it ead-backend-dev sh -c "pnpm prisma db push --force-reset"

# Mark the migration as already applied

docker exec -it ead-backend-dev sh -c "pnpm prisma migrate resolve --applied 20250618140155_init"

sudo chown -R $(id -un):$(id -gn) prisma/migrations

## Prompts

crie unit test para cobrir cenarios de erro, edge case e entradas invalidas. foque em comportamento, nao em implementacao.

### listar videos no panda

curl -s \
 -H "Authorization: panda-cdb205efa07ed9662761e12adf2b6aa8a97b79e9942ec7f9b4ad93c368cf411a" \
 -H "Accept: application/json" \
 "https://api-v2.pandavideo.com.br/videos" | jq '.videos[] | {id, title}'
