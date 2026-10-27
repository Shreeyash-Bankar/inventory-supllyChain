import { Request, Response, NextFunction } from "express";

export async function authorize(...roles : string[]) {
    return function (req:Request, res:Response, next:NextFunction) {
        if(!req.user || !roles.includes(req.user.role)){
            res.status(403).json({message:"Access Denied"})
            return
        }

        next()
    }
}