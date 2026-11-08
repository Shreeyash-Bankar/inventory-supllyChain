import { pool } from "../config/db.js";
export async function signUp(req, res) {
    try {
        const { name, email, password } = req.body;
        const user = await pool.query(`
            SELECT * FROM 
            `);
    }
    catch (error) {
        console.error("Error in Registering: ", error);
    }
}
