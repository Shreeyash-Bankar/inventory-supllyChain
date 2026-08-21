import { pool } from "../config/db.js";
import { Request, Response } from "express";

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { supplier_name, address, email, phone, contact_person } = req.body;

    if (!supplier_name || !email || !phone || !contact_person) {
      res.json({ message: "All fields are required except address" });
      return;
    }

    const result = await pool.query(
      `
        INSERT INTO suppliers (supplier_name, email, phone, contact_person, address)
        VALUES ($1,$2,$3, $4,$5)
        RETURNING *
        `,
      [supplier_name, email, phone, contact_person, address],
    );

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request to create supplier failed" });
  }
};

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
            SELECT * FROM suppliers
            `,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request to get suppliers list failed" });
  }
};



export const getSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
            SELECT id,phone FROM suppliers WHERE id = $1
            `,
      [id],
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Request to get the supplier failed" });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { supplier_name, phone, email, address, contact_person } = req.body;
    const result = await pool.query(
      `
        UPDATE suppliers 
        SET
        supplier_name = $1, phone = $2, email = $3, address = $4 , contact_person = $5
        WHERE id = $6
        RETURNING *
        `,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Request for updating the supplier failed" });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM suppliers where id = $1`, [
      id,
    ]);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Request for deleting the supplier failed" });
  }
};
