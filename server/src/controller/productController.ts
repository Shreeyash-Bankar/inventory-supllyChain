// import { pool } from "../config/db.js";
// import { Request, Response } from "express";

// export async function createProduct(req: Request, res: Response) {
//   try {
//     const { name, price, sku, quantity, category_id } = req.body;

//     const result = await pool.query(
//       `
//             INSERT INTO PRODUCTS(name , price, sku, quantity, category_id)
//             VALUE($1, $2, $3, $4, $5)
//             RETURNING *;
//             `,
//       [name, price, sku, quantity, category_id],
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// }

// export async function getProducts(req: Request, res: Response) {
//   try {
//     const result = await pool.query(`SELECT * FROM PRODUCTS`);
//     res.status(200).json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// }

// export async function updateProduct(req: Request, res: Response) {
//   try {
//     const { id } = req.params;
//     const { name, sku, price, quantity, category_id } = req.body;

//     const result = await pool.query(
//       `
//             UPDATE products
//             SET
//             name = $1,
//             sku = $2,
//             price = $3,
//             quantity = $4,
//             category_id = $5

//             WHERE id = $6
//             RETURNING *;
//             `,
//       [name, sku, price, quantity, category_id, id],
//     );

//     if (result.rowCount === 0) {
//       res.status(404).json({ message: "Product not found" });
//     }

//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "server error" });
//   }
// }

// export async function deleteProduct(req: Request, res: Response) {
//   try {
//     const { id } = req.body;
//     const result = await pool.query(
//       `DELETE FROM products WHERE id = $1 RETURNING *`,
//       [id],
//     );

//     if (result.rowCount === 0) {
//       res.status(404).json({ message: "Product not found" });
//     }

//     res.status(200).json({ message: "Product deleted " });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// }

import type { Request, Response, NextFunction } from "express";

import {
  createProduct as createProductService,
  getProducts as getProductsService,
  getProductById,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
  type ProductInput,
} from "../services/products.service.js";

import { uploadToS3, deleteFromS3 } from "../services/s3.service.js";

import { ProductValidationError } from "../errors/productValidationError.js";

interface ProductBody {
  name: string;
  sku: string;
  price: string | number;
  quantity: string | number;
  category_id?: string | number;
}

// Reusable product validation and conversion
function parseProductBody(body: ProductBody): Omit<ProductInput, "image_key"> {
  const { name, sku, price, quantity, category_id } = body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof sku !== "string" ||
    !sku.trim() ||
    price === undefined ||
    quantity === undefined ||
    price === "" ||
    quantity === ""
  ) {
    throw new ProductValidationError("Required product fields are missing");
  }

  const parsedPrice = Number(price);
  const parsedQuantity = Number(quantity);
  const parsedCategoryId = category_id ? Number(category_id) : null;

  if (
    !Number.isFinite(parsedPrice) ||
    parsedPrice < 0 ||
    !Number.isInteger(parsedQuantity) ||
    parsedQuantity < 0 ||
    (parsedCategoryId !== null &&
      (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0))
  ) {
    throw new ProductValidationError("Invalid product information");
  }

  return {
    name: name.trim(),
    sku: sku.trim(),
    price: parsedPrice,
    quantity: parsedQuantity,
    category_id: parsedCategoryId,
  };
}

// CREATE PRODUCT
export async function createProduct(
  req: Request<{}, {}, ProductBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let imageKey: string | null = null;

  try {
    const productData = parseProductBody(req.body);

    // Upload image if provided
    if (req.file) {
      imageKey = await uploadToS3(req.file, "products");
    }

    const product = await createProductService({
      ...productData,
      image_key: imageKey,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error: unknown) {
    // Cleanup uploaded image if necessary
    if (imageKey) {
      try {
        await deleteFromS3(imageKey);
      } catch (cleanupError) {
        console.error("S3 cleanup failed:", cleanupError);
      }
    }

    // Handle validation errors
    if (error instanceof ProductValidationError) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    // Forward unexpected errors
    next(error);
  }
}

// GET ALL PRODUCTS
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const products = await getProductsService();

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
}

// UPDATE PRODUCT
export async function updateProduct(
  req: Request<{ id: string }, {}, ProductBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let newImageKey: string | null = null;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        message: "Invalid product ID",
      });
      return;
    }

    // Find existing product
    const existingProduct = await getProductById(id);

    if (!existingProduct) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    }

    const productData = parseProductBody(req.body);

    // Keep old image key if no new image is provided
    let imageKey: string | null = existingProduct.image_key;

    // Upload replacement image if provided
    if (req.file) {
      newImageKey = await uploadToS3(req.file, "products");
      imageKey = newImageKey;
    }

    const updatedProduct = await updateProductService(id, {
      ...productData,
      image_key: imageKey,
    });

    if (!updatedProduct) {
      throw new Error("Product update failed");
    }

    // Delete old image only after database update succeeds
    if (
      newImageKey &&
      existingProduct.image_key &&
      existingProduct.image_key !== newImageKey
    ) {
      try {
        await deleteFromS3(existingProduct.image_key);
      } catch (cleanupError) {
        // Database already points to new image.
        // Don't delete the new image if old-image cleanup fails.
        console.error("Old image cleanup failed:", cleanupError);
      }
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error: unknown) {
    // Cleanup newly uploaded image if necessary
    if (newImageKey) {
      try {
        await deleteFromS3(newImageKey);
      } catch (cleanupError) {
        console.error("New image cleanup failed:", cleanupError);
      }
    }

    if (error instanceof ProductValidationError) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    next(error);
  }
}

// DELETE PRODUCT
export async function deleteProduct(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        message: "Invalid product ID",
      });
      return;
    }

    // Find product before deleting it
    const existingProduct = await getProductById(id);

    if (!existingProduct) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    }

    // Delete product from PostgreSQL
    const deletedProduct = await deleteProductService(id);

    if (!deletedProduct) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    }

    // Delete associated image from S3
    let cleanupWarning: string | undefined;

    if (existingProduct.image_key) {
      try {
        await deleteFromS3(existingProduct.image_key);
      } catch (cleanupError) {
        console.error("S3 image deletion failed:", cleanupError);

        cleanupWarning = "Product deleted, but image cleanup failed";
      }
    }

    res.status(200).json({
      message: "Product deleted successfully",
      cleanupWarning,
    });
  } catch (error) {
    next(error);
  }
}
