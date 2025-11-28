/**
 * Modelo de Inventario
 * 
 * @author Oscar Javier Rivera
 * @description Modelo de datos y métodos de acceso para inventario y compras
 */

const { pool } = require('../config/database');

class Inventory {
  static async findByProductId(productoId) {
    const result = await pool.query(
      'SELECT * FROM inventario WHERE producto_id = $1',
      [productoId]
    );
    return result.rows[0];
  }

  static async upsert(productoId, cantidad) {
    const result = await pool.query(
      `INSERT INTO inventario (producto_id, cantidad, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (producto_id)
       DO UPDATE SET cantidad = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [productoId, cantidad]
    );
    return result.rows[0];
  }

  static async decrementStock(productoId, cantidad) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const checkResult = await client.query(
        'SELECT cantidad FROM inventario WHERE producto_id = $1 FOR UPDATE',
        [productoId]
      );

      if (!checkResult.rows[0]) {
        throw new Error('Inventario no encontrado');
      }

      const currentStock = checkResult.rows[0].cantidad;
      if (currentStock < cantidad) {
        throw new Error('Inventario insuficiente');
      }

      const updateResult = await client.query(
        `UPDATE inventario 
         SET cantidad = cantidad - $1, updated_at = CURRENT_TIMESTAMP
         WHERE producto_id = $2
         RETURNING *`,
        [cantidad, productoId]
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async createPurchaseRecord(productoId, cantidad, precioUnitario) {
    const total = cantidad * precioUnitario;
    const result = await pool.query(
      `INSERT INTO historial_compras (producto_id, cantidad, precio_unitario, total)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productoId, cantidad, precioUnitario, total]
    );
    return result.rows[0];
  }

  static async getPurchaseHistory(productoId) {
    const result = await pool.query(
      'SELECT * FROM historial_compras WHERE producto_id = $1 ORDER BY created_at DESC',
      [productoId]
    );
    return result.rows;
  }

  static toJsonApi(inventory, productData = null) {
    const data = {
      type: 'inventory',
      id: inventory.producto_id.toString(),
      attributes: {
        producto_id: inventory.producto_id,
        cantidad: inventory.cantidad
      }
    };

    if (productData) {
      data.attributes.producto = productData.attributes;
    }

    return data;
  }
}

module.exports = Inventory;
