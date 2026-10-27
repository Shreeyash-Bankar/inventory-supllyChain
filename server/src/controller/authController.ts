import { Request, Response } from "express";
import { pool } from "../config/db.js";

export async function signUp (req:Request, res:Response){
    try{
        const {name, email, password} = req.body;

        const user = await pool.query(
            `
            SELECT * FROM 
            `
        )

    }catch(error){
        console.error("Error in Registering: ", error)
    }
}