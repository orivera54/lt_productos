/**
 * Modelo de Producto
 * 
 * @author Oscar Javier Rivera
 * @description Modelo de datos y métodos de acceso para productos
 */

const { pool } = require('../config/database');

class Product {
  static async create({ nombre, precio, descripcion }) {
    const result = await pool.query(
      'INSERT INTO productos (nombre, precio, descripcion) VALUES ($1, $2, $3) RETURNING *',
      [nombre, precio, descripcion]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM productos ORDER BY id');
    return result.rows;
  }

  static toJsonApi(product) {
    return {
      type: 'products',
      id: product.id.toString(),
      attributes: {
        nombre: product.nombre,
        precio: parseFloat(product.precio),
        descripcion: product.descripcion
      }
    };
  }
}

module.exports = Product;
