import "reflect-metadata"
import { DataSource } from "typeorm";
import 'dotenv/config'

export const AppDataSource = new DataSource({
  type: "mongodb",
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  synchronize: true,
  logging: true,
  subscribers: [],
  entities: [`src/entity/**/*{.ts,.js}`],
  migrations: [`src/migrations/**/*{.ts,.js}`],
})
