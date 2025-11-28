/**
 * Rutas de Productos
 * 
 * @author Oscar Javier Rivera
 * @description Endpoints REST para gestión de productos con JSON API
 */

const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Crear producto
router.post('/', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || data.type !== 'products') {
      return res.status(400).json({
        errors: [{
          status: '400',
          title: 'Bad Request',
          detail: 'Formato JSON API inválido'
        }]
      });
    }

    const { nombre, precio, descripcion } = data.attributes;

    if (!nombre || !precio) {
      return res.status(400).json({
        errors: [{
          status: '400',
          title: 'Bad Request',
          detail: 'Nombre y precio son requeridos'
        }]
      });
    }

    const product = await Product.create({ nombre, precio, descripcion });
    
    res.status(201).json({
      data: Product.toJsonApi(product)
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: 'Error al crear el producto'
      }]
    });
  }
});

// Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: 'Producto no encontrado'
        }]
      });
    }

    res.json({
      data: Product.toJsonApi(product)
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: 'Error al obtener el producto'
      }]
    });
  }
});

// Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll();
    
    res.json({
      data: products.map(p => Product.toJsonApi(p))
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: 'Error al obtener los productos'
      }]
    });
  }
});

module.exports = router;
