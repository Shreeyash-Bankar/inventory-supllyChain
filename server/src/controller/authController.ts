import { Request, Response } from "express";
import { pool } from "../config/db.js";
import bcrypt from 'bcrypt'

export async function signUp (req:Request, res:Response){
    try{
        const {name, email, password} = req.body;

        const user = await pool.query(
            `
            SELECT EXISTS (
            SELECT 1
            FROM users
            WHERE email = $1
            ) AS "userExists"
            `, [email]
        )

        if(user.rows[0].userExists) {
            return res.status(409).json({
                message: "User already Exists"
            })
        }
        
        const passwordHash = await bcrypt.hash(password, 10)


        const result = await pool.query(
            `
            INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [name, email, passwordHash]
        )

        const newUser = result.rows[0]

        const {password_hash , ...safeUser} = newUser

        console.log(newUser)
        
        return res.json({
            message:"user registered successfully",
            user: safeUser
        })
        

    }catch(error){
        console.error("Error in Registering: ", error)
    }
}

export async function login (req:Request, res:Response){

    try {
        const {email, password} = req.body

        const findUser = await pool.query(
            `
            SELECT * FROM users
            WHERE email = $1
            `,[email]
        )
        
        if(!findUser.rows[0]){
           return res.status(404).json({message: "Ivalid email"})
        }

        const checkPassword = await bcrypt.compare(password, findUser.rows[0].password_hash)

        if(checkPassword){
            
        }
    } catch (error) {
        
    }
   

    
}