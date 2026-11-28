import { pool } from "../config/db.js";

export interface ProductInput {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category_id: number | null;
  image_key: string | null;
}

// CREATE PRODUCT
export async function createProduct(product: ProductInput) {
  const { name, sku, price, quantity, category_id, image_key } = product;

  const result = await pool.query(
    `
        INSERT INTO products
        (name, sku, price, quantity, category_id, image_key)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
    [name, sku, price, quantity, category_id, image_key],
  );

  return result.rows[0];
}

// GET ALL PRODUCTS
export async function getProducts() {
  const result = await pool.query(`SELECT * FROM products ORDER BY id DESC`);

  return result.rows;
}

// GET PRODUCT BY ID
export async function getProductById(id: number) {
  const result = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);

  return result.rows[0] ?? null;
}

// UPDATE PRODUCT
export async function updateProduct(id: number, product: ProductInput) {
  const { name, sku, price, quantity, category_id, image_key } = product;

  const result = await pool.query(
    `
        UPDATE products
        SET
            name = $1,
            sku = $2,
            price = $3,
            quantity = $4,
            category_id = $5,
            image_key = $6
        WHERE id = $7
        RETURNING *
        `,
    [name, sku, price, quantity, category_id, image_key, id],
  );

  return result.rows[0] ?? null;
}

// DELETE PRODUCT
export async function deleteProduct(id: number) {
  const result = await pool.query(
    `
        DELETE FROM products
        WHERE id = $1
        RETURNING *
        `,
    [id],
  );

  return result.rows[0] ?? null;
}
