import { Pool } from "pg";
import { DB_CONFIG } from "../config/pg.config";

const pgPool = new Pool(DB_CONFIG);

pgPool.on("error", (err) => console.error("Postgres error: ", err));
