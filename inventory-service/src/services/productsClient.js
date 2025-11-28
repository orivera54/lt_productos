/**
 * Cliente HTTP para Products Service
 * 
 * @author Oscar Javier Rivera
 * @description Cliente con reintentos y timeout para comunicación con Products Service
 */

const axios = require('axios');

class ProductsClient {
  constructor() {
    this.baseURL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3001';
    this.apiKey = process.env.API_KEY;
    this.timeout = 5000;
    this.maxRetries = 3;
  }

  async getProduct(productId) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(
          `${this.baseURL}/api/products/${productId}`,
          {
            headers: {
              'X-API-Key': this.apiKey
            },
            timeout: this.timeout
          }
        );
        return response.data.data;
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed:`, error.message);
        
        if (error.response?.status === 404) {
          throw new Error('Producto no encontrado');
        }
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw new Error(`Servicio de productos no disponible después de ${this.maxRetries} intentos`);
  }
}

module.exports = new ProductsClient();
