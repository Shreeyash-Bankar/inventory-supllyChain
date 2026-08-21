import { faker } from "@faker-js/faker";
import { pool } from "../config/db.js";

async function seedProducts() {
  try {
    for (let i = 0; i < 100; i++) {
      const name = faker.commerce.productName();
      const price = faker.number.int({
        min: 100,
        max: 50000,
      });

      const sku = faker.string.alphanumeric(8).toUpperCase();

      const quantity = faker.number.int({
        min: 0,
        max: 200,
      });

      const categoryId = faker.number.int({
        min: 1,
        max: 5,
      });

      await pool.query(
        `
        INSERT INTO products
        (name, price, sku, quantity, category_id)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [name, price, sku, quantity, categoryId],
      );
    }

    console.log("Products Seeded");
  } finally {
    await pool.end();
  }
}

seedProducts();
