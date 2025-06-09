docker exec -it ead-backend-dev sh -c "pnpm test"

docker exec -it ead-backend sh -c "pnpm test:e2e"

docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma migrate reset --force


##Prompts
crie unit test para cobrir cenarios de erro, edge case e entradas invalidas. foque em comportamento, nao em implmentacao.