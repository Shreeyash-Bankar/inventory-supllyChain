// import { Pool } from "pg";
// import dotenv from "dotenv";
// dotenv.config();
// const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
// if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER || !DB_PASSWORD) {
//   throw new Error("Missing required database environment variables.");
// }
// export const pool = new Pool({
//   // host: DB_HOST,
//   // port: Number(DB_PORT),
//   // database: DB_NAME,
//   // user: DB_USER,
//   // password: DB_PASSWORD,
//   connectionString: process.env.DATABASE_URL,
// });
// pool
//   .query("SELECT NOW()")
//   .then((result) => {
//     console.log("Connected successfully!");
//     console.log(result.rows);
//   })
//   .catch((error) => {
//     console.error(error);
//   });
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
console.log("🔥 DB FILE LOADED");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "FOUND" : "MISSING");
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
