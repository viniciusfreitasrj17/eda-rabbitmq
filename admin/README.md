# Admin MS

## Generate migration typeorm script

```sh
docker exec -it eda-rabbitmq_admin_1 npm run typeorm migration:generate ./src/migrations/CreateProduct -- -d ./src/data-source.ts
```

## Run migration typeorm script

```sh
docker exec -it eda-rabbitmq_admin_1 npm run typeorm migration:run -- -d src/data-source.ts
```
