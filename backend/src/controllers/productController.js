const pool = require("../config/db");

function formatProduct(row) {
  return {
    id: row.id,
    name: row.name,
    cat: row.cat,
    price: row.price === null ? null : Number(row.price),
    tag: row.tag,
    desc: row.desc,
    imageUrl: row.imageUrl,
    paymentLink: row.paymentLink,
    isActive: row.is_active,
  };
}

async function getProducts(req, res, next) {
  try {
    const { category, search } = req.query;

    let query = `
      SELECT 
        id,
        name,
        category AS cat,
        price,
        tag,
        description AS desc,
        image_url AS "imageUrl",
        payment_link AS "paymentLink",
        is_active
      FROM products
      WHERE is_active = TRUE
    `;

    const values = [];

    if (category && category !== "all") {
      values.push(category);
      query += ` AND category = $${values.length}`;
    }

    if (search) {
      values.push(`%${search}%`);
      query += ` AND name ILIKE $${values.length}`;
    }

    query += " ORDER BY id ASC";

    const result = await pool.query(query, values);

    res.json(result.rows.map(formatProduct));
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id,
        name,
        category AS cat,
        price,
        tag,
        description AS desc,
        image_url AS "imageUrl",
        payment_link AS "paymentLink",
        is_active
      FROM products
      WHERE id = $1 AND is_active = TRUE
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(formatProduct(result.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function getAdminProducts(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT 
        id,
        name,
        category AS cat,
        price,
        tag,
        description AS desc,
        image_url AS "imageUrl",
        payment_link AS "paymentLink",
        is_active
      FROM products
      ORDER BY id DESC
      `
    );

    res.json(result.rows.map(formatProduct));
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const { name, cat, price, tag, desc, imageUrl, paymentLink } = req.body;

    if (!name || !cat || !desc) {
      return res.status(400).json({
        error: "Name, category, and description are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO products (
        name,
        category,
        price,
        tag,
        description,
        image_url,
        payment_link
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id,
        name,
        category AS cat,
        price,
        tag,
        description AS desc,
        image_url AS "imageUrl",
        payment_link AS "paymentLink",
        is_active
      `,
      [
        name,
        cat,
        price === "" || price === null || price === undefined
          ? null
          : Number(price),
        tag || null,
        desc,
        imageUrl || null,
        paymentLink || null,
      ]
    );

    res.status(201).json(formatProduct(result.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, cat, price, tag, desc, imageUrl, paymentLink, isActive } =
      req.body;

    const result = await pool.query(
      `
      UPDATE products
      SET 
        name = $1,
        category = $2,
        price = $3,
        tag = $4,
        description = $5,
        image_url = $6,
        payment_link = $7,
        is_active = $8
      WHERE id = $9
      RETURNING 
        id,
        name,
        category AS cat,
        price,
        tag,
        description AS desc,
        image_url AS "imageUrl",
        payment_link AS "paymentLink",
        is_active
      `,
      [
        name,
        cat,
        price === "" || price === null || price === undefined
          ? null
          : Number(price),
        tag || null,
        desc,
        imageUrl || null,
        paymentLink || null,
        isActive,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(formatProduct(result.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE products
      SET is_active = FALSE
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};