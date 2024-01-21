import productsService from "../services/products.service.js";
import { errorTypes } from '../services/errors/enums.js';
import { isValidObjectId } from 'mongoose';
import CustomError from '../services/errors/CustomError.js';

async function getCartProductsFromBD(req, res, next) {
    try {
      res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader("Content-Type", "application/json");

      if(!req.body || !req.body.length){
        CustomError.createError({
          name: "Error buscando productos",
          cause: "No se proporcionaron id's",
          code: errorTypes.INVALID_ARGS_ERROR,
        });
      }
      
      const productIds = req.body;
      const productIdsSanitized = productIds.filter(products=> isValidObjectId(products.id))
      let productsFormat = productIdsSanitized.map(product=>product.id)
      const products = await productsService.getProducts({ _id: { $in: productsFormat } });
      
      if (!products) return res.status(200).json({ payload: "No se encontraron productos", products });
  
      let array = []
  
      for(const sanitizedProduct of productIdsSanitized){
        for(const product of products){
          if(product._id.toString()===sanitizedProduct.id){
            let productResponse = {
              id: sanitizedProduct.id,
              title: product.title,
              description: product.description,
              labels: product.labels,
              category: product.category,
              thumbnail: product.thumbnail,
              price: product.price,
              code: product.code,
              quantity: sanitizedProduct.quantity,
            }
            array.push(productResponse)
          }
        }
      }
  
      return res.status(200).json({ products: array });
    } catch (error) {
      next(error);
    }
}

function notFound(req, res){
  res.setHeader('Content-Type','application/json');
  return res.status(404).json({payload:'Bad request, 404 url not found'});
}

export default { getCartProductsFromBD, notFound }
