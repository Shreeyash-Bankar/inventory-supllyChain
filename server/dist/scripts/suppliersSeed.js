import { faker } from "@faker-js/faker";
import { pool } from "../config/db.js";
async function seedSuppliers() {
    try {
        for (let i = 0; i < 100; i++) {
            const supplierName = faker.company.name();
            const contactPerson = faker.person.fullName();
            const email = faker.internet.email();
            const phone = faker.string.numeric(10);
            const address = faker.location.streetAddress(true);
            await pool.query(`
        INSERT INTO suppliers
        (
          supplier_name,
          contact_person,
          email,
          phone,
          address
        )
        VALUES
        ($1,$2,$3,$4,$5)
        `, [supplierName, contactPerson, email, phone, address]);
        }
        console.log("✅ Suppliers seeded successfully");
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await pool.end();
    }
}
seedSuppliers();
