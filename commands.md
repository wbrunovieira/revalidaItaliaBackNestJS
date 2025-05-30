docker exec -it ead-backend-dev sh -c "pnpm test"

docker exec -it ead-backend sh -c "pnpm test:e2e"

docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma migrate reset --force