import { Request, Response, NextFunction } from "express";
import { pool } from "../config/db.js";

export async function authenticate(req: Request, res:Response, next:NextFunction) : Promise<void>{
    try{
        const userId = req.session.userId

        if(!userId){
            res.status(401).json({
                message:"Authentication required"
            })

            return
        }

        const result = await pool.query(
            `
            SELECT id, email, role
            FROM users
            WHERE id = $1 AND is_active = TRUE
            LIMIT 1
            `, [userId]
        )

        const user = result.rows[0]

        if(!user){
            req.session.destroy((err) => {
                if(err){
                    console.error("User acount may be deleted", err)
                    next(err)
                    return
                }
                res.status(401).json({
                    message:"Session is no longer valid"
                })
            })

            return
        }

        req.user = user

        next()
    }
    catch(error){
        console.error("Error in the authentication", error)
        next(error)
    }
}