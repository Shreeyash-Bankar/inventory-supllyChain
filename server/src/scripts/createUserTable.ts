
import { pool } from "../config/db.js";

async function createUserTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(250) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin', 'superadmin')),
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        console.log("User table created or already exists.");
    } catch (error) {
        console.error("Failed to create user table:", error);
    } finally {
        await pool.end();
    }
}

createUserTable();


const result = await pool.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name = 'users';
`);

console.log("Users table found:", result.rows);


const result2 = await pool.query(`
    SELECT
        current_database() AS database,
        current_schema() AS schema;

    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
    ORDER BY ordinal_position;
`);

console.log(result2.rows);