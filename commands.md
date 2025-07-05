docker exec -it ead-backend-dev sh -c "pnpm test"

docker exec -it ead-backend-dev sh -c "\
 pnpm vitest run src/domain/course-catalog/application/use-cases/list-videos.use-case.spec.ts\
"
docker exec -it ead-backend-dev sh -c "\
 pnpm vitest run src/infra/controllers/video.controller.spec.ts\
"

docker exec -it ead-backend sh -c "pnpm test:e2e"

sudo docker system prune -a -f --volumes

terraform taint null_resource.run_ansible

docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma migrate reset --force

1 docker exec -it ead-backend-dev sh -c "pnpm prisma db push --force-reset"
2 docker compose -f compose.dev.yaml down
3 docker compose -f compose.dev.yaml up -d db

4 docker exec -it revalida_postgres psql -U postgres -d revalida_postgres \
 -c 'DROP TABLE IF EXISTS "\_prisma_migrations";'
NOTICE: table "\_prisma_migrations" does not exist, skipping
DROP TABLE
5 docker exec -it revalida_postgres \
 psql -U postgres -d revalida_postgres \
 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
6 docker compose -f compose.dev.yaml run --rm backend sh -c "\
 pnpm prisma migrate dev --name init \
"

docker compose -f compose.dev.yaml down && docker compose -f compose.dev.yaml build --no-cache && docker compose -f compose.dev.yaml up -d && docker compose -f compose.dev.yaml logs -f

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

terraform import aws_key_pair.revalida revalida-key
export AWS_PROFILE=bruno-admin-revalida-aws

npx prisma migrate dev --name add_url_to_lesson_document_translation
npx prisma generate
