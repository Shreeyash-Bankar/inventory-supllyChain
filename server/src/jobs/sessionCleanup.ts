import corn from 'node-cron'
import { pool } from '../config/db.js'

export function startSessionCleanup(){
    corn.schedule("0 * * * *", async() => {
        try {
            const result = await pool.query(`
                DELETE FROM sessions 
                WHERE expires <= now()
                `)

            console.log(`Expired session deleted : ${result.rowCount}`)
        } catch (error) {
            console.log("Session cleanup failed:", error)
        }
    })
}