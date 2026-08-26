import { pool } from "../config/db.js";
const categories = [
    "Electronics",
    "Furniture",
    "Groceries",
    "Stationery",
    "Clothing",
    "Sports",
    "Books",
    "Kitchen",
    "Office Supplies",
    "Automotive",
];
async function seedCategories() {
    try {
        for (const category of categories) {
            await pool.query(`INSERT INTO categories(name)
         VALUES($1)
         ON CONFLICT(name) DO NOTHING`, [category]);
        }
        console.log("Categories seeded");
    }
    finally {
        await pool.end();
    }
}
seedCategories();
