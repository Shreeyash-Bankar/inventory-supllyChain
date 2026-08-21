import { pool } from "../config/db.js";
import { Request, Response } from "express";

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, price, sku, quantity, category_id } = req.body;

    const result = await pool.query(
      `
            INSERT INTO PRODUCTS(name , price, sku, quantity, category_id)
            VALUE($1, $2, $3, $4, $5)
            RETURNING *;
            `,
      [name, price, sku, quantity, category_id],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

export async function getProducts(req: Request, res: Response) {
  try {
    const result = await pool.query(`SELECT * FROM PRODUCTS`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, sku, price, quantity, category_id } = req.body;

    const result = await pool.query(
      `
            UPDATE products 
            SET 
            name = $1,
            sku = $2,
            price = $3,
            quantity = $4,
            category_id = $5

            WHERE id = $6
            RETURNING *;
            `,
      [name, sku, price, quantity, category_id, id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Product not found" });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.body;
    const result = await pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING *`,
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted " });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}
