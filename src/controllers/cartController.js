import { v4 as uuidv4 } from 'uuid';
import transporter from "../services/contact.service.js";
import productsService from "../services/products.service.js";
// import cartService from "../services/cart.service.js";
import ticketService from "../services/ticket.service.js";
import config from '../config/config.js';
import { errorTypes } from '../services/errors/enums.js';
import { isValidObjectId } from 'mongoose';
import CustomError from '../services/errors/CustomError.js';
import { MercadoPagoConfig, Preference } from 'mercadopago'

async function getCartProductsFromBD(req, res, next) {
    try {
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

async function purchaseCart(req, res, next){
    try {
        res.setHeader('Content-Type','application/json');

        if(!req.body.productIds || !req.body.productIds.length){
            CustomError.createError({
                name: "Error buscando productos",
                cause: 'No se proporcionaron identificadores',
                code: errorTypes.INVALID_ARGS_ERROR,
            });
        }

        let outOfStock = [];
        const purchasedProducts = req.body.productIds;
        let amount = 0;
        
        for(const product of purchasedProducts){

            if(!isValidObjectId(product.id)){
                CustomError.createError({
                    name: "Error procesando compra",
                    cause: `El ID: '${product.id} no es un id válidos'`,
                    code: errorTypes.INVALID_ARGS_ERROR,
                });
            }

            const productStock = await productsService.getProductById(product.id);

            if(productStock){
                CustomError.createError({
                    name: "Error procesando compra",
                    cause: `No se encontro el producto con ID: '${product.id}'`,
                    code: errorTypes.NOT_FOUND_ERROR,
                });
            }

            let productToPurchase = {
                id: productStock._id,
                title: productStock.title,
                code: productStock.code,
                price: productStock.price,
                quantity: product.quantity,
                category: productStock.category
            }
            if(productStock.stock<product.quantity){
                outOfStock.push(productToPurchase);
            }else{
                purchasedProducts.push(productToPurchase);

                // const updateProduct = await productsService.updateOne(
                //     {_id:product.product},
                //     {$inc: { 'stock': - product.quantity }}
                // )

                // if(updateProduct.stock <= 0){
                //     await productsService.updateOne(
                //         {_id:product.product},
                //         {$set: { 'isAvailable': false }}
                //     )
                // }
                
                
                // purchasedProducts.map(product=>{
                //     amount+=(product.price*product.quantity);
                //     cartService.updateCart(
                //         { _id: req.user.cart },
                //         { $pull: { products: { product: product.id } } }
                //     );
                // })

                // await ticketService.createTicket({
                //     products: purchasedProducts,
                //     amount,
                //     purchaser: req.user.email,
                //     code: uuidv4()
                // })                
            }
            
        }
        
        let preference = {
            items: purchasedProducts,
            back_urls: {
                "success": "http://localhost:8080/feedback",
                "failure": "http://localhost:8080/feedback",
                "pending": "http://localhost:8080/feedback"
            },
            auto_return: "approved",
        };
    
        mercadopago.preferences.create(preference)
        .then(function (response) {
            res.json({
                id: response.body.id
            });
        }).catch(function (error) {
            console.log(error);
        });
      
    }catch(error) {
        next(error);
    }
}

// async function deleteProductFromCart(req, res, next){
//     try {
//         res.setHeader('Content-Type','application/json');
//         const productId = req.params.productId;

//         if(!isValidObjectId(productId)){
//             CustomError.createError({
//                 name:'Error buscando el ID proporcionado',
//                 cause: invalidIdProductError(productId),
//                 code: errorTypes.INVALID_ARGS_ERROR 
//             })
//         }
        
//         const existingProduct = await productsService.getProductById(productId);
        
//         if (!existingProduct) {
//             CustomError.createError({
//                 name:"Error encontrando el producto",
//                 cause: IdNotFoundProductError(productId),
//                 code: errorTypes.NOT_FOUND_ERROR 
//             })
//         }
        
//         const cart = await cartService.getCartById(req.user.cart);
        
//         if (!cart) {
//             CustomError.createError({
//                 name:"Error buscando el carrito",
//                 cause: IdNotFoundCartError(productId),
//                 code: errorTypes.NOT_FOUND_ERROR 
//             })
//         }
       
//         await cartService.updateCart({_id: req.user.cart}, {$pull: {products: {product: productId}}});
//         const newProductList = await cartService.populateCart(req.user.cart)
  
//         return res.status(200).json({ message:'Se eliminó el producto satisfactoriamente', cart: newProductList});
//     } catch (error) {
//         next(error);
//     }    
// }

function notFound(req, res){
    res.setHeader('Content-Type','application/json');
    return res.status(404).json({payload:'Bad request, 404 url not found'});
}

export default { getCartProductsFromBD, purchaseCart, notFound }



        // // await transporter.transporter.sendMail({
        // //     from: config.MAIL_USER,
        // //     to: req.user.email,
        // //     subject: 'Ticket de compra',
        // //     html:`
        // //         <div style="width:100%; text-align:center;">
                
        // //             <h1>¡Muchas gracias por tu compra!</h1>
        // //             <p>A continuación te enviamos los detalles de tu compra</p>

        // //             <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%;">
        // //                 <div style="display:flex; align-items:center; justify-content:center; width:100%">
        // //                     ${purchasedProducts.map(product => `
        // //                         <ul style="background-color: #ebebeb; margin:0.5em; padding:0; width:100%; text-align:center">
        // //                             <span>Producto: </span>
        // //                             <li style="list-style:none;" >Nombre: ${product.title}</li>
        // //                             <li style="list-style:none;" >ID: ${product.id}</li>
        // //                             <li style="list-style:none;" >Categoría: ${product.category}</li>
        // //                             <li style="list-style:none;" >Cantidad: ${product.quantity} unidades</li>
        // //                             <li style="list-style:none;" >Precio: $${product.price}</li>
        // //                             <li style="list-style:none;" >Subtotal: $${product.price*product.quantity}</li>
        // //                         </ul>
        // //                     `).join('')}
        // //                 </div>
        // //             </div>
        // //             <div style="text-align:center; width: 100%;">
        // //                 <p>Total: $${amount}</p>
        // //             </div>

        // //         </div>
        // //     `
        // // }).catch(err=>console.log(err));
        // //SUPONGO QUE ACÁ SE REDIRECCIONA AL CHECKOUT O ESTO FORMA PARTE DEL CHECKOUT
        // if(outOfStock.length){
        //     return res.status(200).json({message:'Algunos productos no cuentan con stock suficiente', productsOutOfStock:outOfStock})
        // }else{
        //     return res.status(200).json({message:'Se realizó la compra satisfactoriamente', purchasedProducts})
        // }