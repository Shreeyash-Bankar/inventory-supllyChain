// import { faker } from "@faker-js/faker";
// import { pool } from "../config/db.js";
// async function seedProducts() {
//   try {
//     for (let i = 0; i < 100; i++) {
//       const name = faker.commerce.productName();
//       const price = faker.number.int({
//         min: 100,
//         max: 50000,
//       });
//       const sku = faker.string.alphanumeric(8).toUpperCase();
//       const quantity = faker.number.int({
//         min: 0,
//         max: 200,
//       });
//       const categoryId = faker.number.int({
//         min: 1,
//         max: 5,
//       });
//       await pool.query(
//         `
//         INSERT INTO products
//         (name, price, sku, quantity, category_id)
//         VALUES ($1,$2,$3,$4,$5)
//         `,
//         [name, price, sku, quantity, categoryId],
//       );
//     }
//     console.log("Products Seeded");
//   } finally {
//     await pool.end();
//   }
// }
// seedProducts();
import { faker } from "@faker-js/faker";
import { pool } from "../config/db.js";
async function seedProducts() {
    try {
        const categoryResult = await pool.query(`SELECT id FROM categories`);
        const categoryIds = categoryResult.rows.map((category) => category.id);
        if (categoryIds.length === 0) {
            throw new Error("No categories found. Seed categories first.");
        }
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
            const categoryId = faker.helpers.arrayElement(categoryIds);
            await pool.query(`
        INSERT INTO products
        (name, price, sku, quantity, category_id)
        VALUES ($1, $2, $3, $4, $5)
        `, [name, price, sku, quantity, categoryId]);
        }
        console.log("Products seeded");
    }
    finally {
        await pool.end();
    }
}
seedProducts();
