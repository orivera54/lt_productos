/**
 * Rutas de Inventario
 * 
 * @author Oscar Javier Rivera
 * @description Endpoints REST para gestión de inventario con JSON API
 */

const express = require('express');
const Inventory = require('../models/Inventory');
const productsClient = require('../services/productsClient');
const router = express.Router();

// Consultar inventario por producto_id
router.get('/:producto_id', async (req, res) => {
  try {
    const { producto_id } = req.params;

    // Obtener información del producto
    const productData = await productsClient.getProduct(producto_id);

    // Obtener inventario
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

    res.json({
      data: Inventory.toJsonApi(inventory, productData)
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: 'Producto no encontrado'
        }]
      });
    }

    res.status(503).json({
      errors: [{
        status: '503',
        title: 'Service Unavailable',
        detail: error.message
      }]
    });
  }
});

// Actualizar inventario
router.patch('/:producto_id', async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { data } = req.body;

    if (!data || data.type !== 'inventory') {
      return res.status(400).json({
        errors: [{
          status: '400',
          title: 'Bad Request',
          detail: 'Formato JSON API inválido'
        }]
      });
    }

    const { cantidad } = data.attributes;

    if (cantidad === undefined || cantidad < 0) {
      return res.status(400).json({
        errors: [{
          status: '400',
          title: 'Bad Request',
          detail: 'Cantidad debe ser un número no negativo'
        }]
      });
    }

    // Verificar que el producto existe
    await productsClient.getProduct(producto_id);

    const inventory = await Inventory.upsert(producto_id, cantidad);

    console.log(`[EVENT] Inventario actualizado - Producto: ${producto_id}, Nueva cantidad: ${cantidad}`);

    res.json({
      data: Inventory.toJsonApi(inventory)
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    
    if (error.message === 'Producto no encontrado') {
      return res.status(404).json({
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: 'Producto no encontrado'
        }]
      });
    }

    res.status(500).json({
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: 'Error al actualizar el inventario'
      }]
    });
  }
});

module.exports = router;
