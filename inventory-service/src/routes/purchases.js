/**
 * Rutas de Compras
 * 
 * @author Oscar Javier Rivera
 * @description Endpoints REST para procesar compras con validación de inventario
 * @note El endpoint de compra está en Inventory Service por responsabilidad única
 */

const express = require('express');
const Inventory = require('../models/Inventory');
const productsClient = require('../services/productsClient');
const router = express.Router();

// Realizar compra
router.post('/', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || data.type !== 'purchases') {
      return res.status(400).json({
        errors: [{
          status: '400',
          title: 'Bad Request',
          detail: 'Formato JSON API inválido'
        }]
      });
    }

    const { producto_id, cantidad } = data.attributes;

    if (!producto_id || !cantidad || cantidad <= 0) {
      return res.status(400).json({
        errors: [{
          status: '400',
          title: 'Bad Request',
          detail: 'producto_id y cantidad (mayor a 0) son requeridos'
        }]
      });
    }

    // 1. Obtener información del producto
    const productData = await productsClient.getProduct(producto_id);

    // 2. Verificar disponibilidad en inventario
    const inventory = await Inventory.findByProductId(producto_id);

    if (!inventory) {
      return res.status(404).json({
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: 'Inventario no encontrado para este producto'
        }]
      });
    }

    if (inventory.cantidad < cantidad) {
      return res.status(409).json({
        errors: [{
          status: '409',
          title: 'Conflict',
          detail: `Inventario insuficiente. Disponible: ${inventory.cantidad}, Solicitado: ${cantidad}`
        }]
      });
    }

    // 3. Actualizar inventario (con transacción)
    const updatedInventory = await Inventory.decrementStock(producto_id, cantidad);

    // 4. Registrar en historial
    const precioUnitario = productData.attributes.precio;
    const purchaseRecord = await Inventory.createPurchaseRecord(
      producto_id,
      cantidad,
      precioUnitario
    );

    console.log(`[EVENT] Compra realizada - Producto: ${producto_id}, Cantidad: ${cantidad}, Total: $${purchaseRecord.total}`);

    // 5. Retornar información de la compra
    res.status(201).json({
      data: {
        type: 'purchases',
        id: purchaseRecord.id.toString(),
        attributes: {
          producto_id: producto_id,
          producto_nombre: productData.attributes.nombre,
          cantidad: cantidad,
          precio_unitario: parseFloat(purchaseRecord.precio_unitario),
          total: parseFloat(purchaseRecord.total),
          inventario_restante: updatedInventory.cantidad,
          fecha: purchaseRecord.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error processing purchase:', error);

    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: 'Producto no encontrado'
        }]
      });
    }

    if (error.message === 'Inventario insuficiente') {
      return res.status(409).json({
        errors: [{
          status: '409',
          title: 'Conflict',
          detail: 'Inventario insuficiente'
        }]
      });
    }

    if (error.message.includes('no disponible')) {
      return res.status(503).json({
        errors: [{
          status: '503',
          title: 'Service Unavailable',
          detail: error.message
        }]
      });
    }

    res.status(500).json({
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: 'Error al procesar la compra'
      }]
    });
  }
});

// Obtener historial de compras (opcional)
router.get('/history/:producto_id', async (req, res) => {
  try {
    const { producto_id } = req.params;
    const history = await Inventory.getPurchaseHistory(producto_id);

    res.json({
      data: history.map(record => ({
        type: 'purchase-history',
        id: record.id.toString(),
        attributes: {
          producto_id: record.producto_id,
          cantidad: record.cantidad,
          precio_unitario: parseFloat(record.precio_unitario),
          total: parseFloat(record.total),
          fecha: record.created_at
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: 'Error al obtener el historial'
      }]
    });
  }
});

module.exports = router;
