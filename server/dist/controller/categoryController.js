import { pool } from "../config/db.js";
/*
when we call the result we get the
{
    rows:[
        {
            id:1,
            name:"Electronics"
        }
    ],

    rowCount:1,

    command:"INSERT",

    fields:[...]
}
*/
export async function createCategory(req, res) {
    try {
        console.log(req.body);
        const { name } = req.body;
        const result = await pool.query(`
            INSERT INTO CATEGORIES(name)
            VALUES($1)
            RETURNING *;
            `, [name]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong",
        });
    }
}
export async function getCategory(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM categories`);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
}
export async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const result = await pool.query(`
        UPDATE categories SET name = $1
        WHERE id = $2 
        RETURNING *
        `, [name, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Category not found",
            });
        }
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
}
export async function deleteCategory(req, res) {
    try {
        console.log(req.params);
        const { id } = req.params;
        const result = await pool.query(`
            DELETE FROM categories 
            WHERE id = $1
            RETURNING *
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Category not found",
            });
        }
        res.json({
            message: "Category deleted successfully",
            category: result.rows[0],
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
}
