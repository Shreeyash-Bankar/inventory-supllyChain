import { Request, Response } from "express";
import { pool } from "../config/db.js";
import { DatabaseError } from "pg";

import bcrypt from "bcrypt";
import crypto from "crypto";
import { Jwt } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import session from "express-session";
import strict from "assert/strict";

export async function signUp(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    const user = await pool.query(
      `
            SELECT EXISTS (
            SELECT 1
            FROM users
            WHERE email = $1
            ) AS "userExists"
            `,
      [email],
    );

    if (user.rows[0].userExists) {
      return res.status(409).json({
        message: "User already Exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
            INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
      [name, email, passwordHash],
    );

    const newUser = result.rows[0];

    const { password_hash, ...safeUser } = newUser;

    console.log(newUser);

    return res.json({
      message: "user registered successfully",
      user: safeUser,
    });
  } catch (error: any) {
    if (error.code === 23505) {
      return res.status(409).json({ message: "Email already exists" });
    }
    console.error("Error in Registering: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const findUser = await pool.query(
      `
            SELECT * FROM users
            WHERE email = $1

            `,
      [email],
    );

    if (!findUser.rows[0]) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const checkPassword = await bcrypt.compare(
      password,
      findUser.rows[0].password_hash,
    );

    if (!checkPassword) {
      return res.status(409).json({ message: "Incorrect Password" });
    }

    /*
        Alternate way using the JWT
        

          const token = jwt.sign(
            {userId: findUser.rows[0].id},
            process.env.JWT_SECRET as string,
            {expiresIn: '7d'}
        )

        res.cookie("jwtToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'strict'
        })

        const {password_hash , ...safeUser} = findUser.rows[0]

        return res.json({
            message:'Login Succesfull',
            user:safeUser
        })
        


        */

    const sessionId = crypto.randomBytes(32).toString("hex");

    const expireAt = new Date();

    expireAt.setDate(expireAt.getDate() + 7);
    await pool.query(
      `
            INSERT INTO sessions(sessionId , sessionData, expires)
            VALUES ($1, $2, $3)
            `,
      [
        sessionId,
        JSON.stringify({
          userId: findUser.rows[0].id,
          role: findUser.rows[0].role,
        }),
        expireAt,
      ],
    );

    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expireAt,
    });

    const { password_hash, ...safeUser } = findUser.rows[0];

    return res.json({
      message: "Login Succesfull",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error Logging User : ", error);

    return res.json({
      message: "Error Logging User",
      uiMessage: "We are working on the problem , please try after some time",
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
      await pool.query(
        `
        DELETE FROM sessions 
        WHERE sessionId = $1
        `,
        [sessionId],
      );
    }

    res.clearCookie("sessionId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error :", error);
    return res.status(500).json({ message: "Internal server Error" });
  }
}
