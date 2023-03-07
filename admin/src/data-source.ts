import "reflect-metadata"
import { DataSource } from "typeorm";
import 'dotenv/config'

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  username: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_DATABASE,
  synchronize: true,
  logging: true,
  subscribers: [],
  entities: [`src/entity/**/*{.ts,.js}`],
  migrations: [`src/migrations/**/*{.ts,.js}`],
})
