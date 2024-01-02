import { v4 as uuidv4 } from 'uuid';
import transporter from "../services/contact.service.js";
import productsService from "../services/products.service.js";
import cartService from "../services/cart.service.js";
import ticketService from "../services/ticket.service.js";
import config from '../config/config.js';
import { errorTypes } from '../services/errors/enums.js';
import { isValidObjectId } from 'mongoose';
import CustomError from '../services/errors/CustomError.js';
import { IdNotFoundCartError, IdNotFoundProductError, invalidIdProductError, invalidQuantityProductError } from '../services/errors/productErrors.js';

async function getCart(req, res, next){
    try{
        res.setHeader('Content-Type','application/json');
        const cid = req.user.cart;
        if(!isValidObjectId(cid)){
            CustomError.createError({
                name:'Error buscando el ID proporcionado',
                cause: invalidIdProductError(cid),
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }
        
        const existingCart = await cartService.getOneCart({_id: cid});
        
        if(!existingCart){
            CustomError.createError({
                name:'No se encontro el carrito',
                cause: 'El ID no es correcto o no está asociado a ningun carrito',
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }

        const populatedCart = await cartService.populateCart(cid)

        if(!populatedCart.products.length) return res.status(200).json({payload:'No se encontraron productos en carrito', products:[]})
        return res.status(200).json({products: populatedCart.products})
    }catch(error){
        next(error)
    }
}

async function addProductToCart(req, res, next){
    try {
        res.setHeader('Content-Type','application/json');
        const { pid, pq } = req.params;

        const parsedQuantity = parseInt(pq, 10)
        if(!isValidObjectId(pid)){
            CustomError.createError({
                name:'Error encontrando el ID especificado',
                cause: invalidIdProductError(pid),
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }
        
        if(typeof parsedQuantity !== "number"){
            CustomError.createError({
                name:'Error con el argumento de cantidad',
                cause: invalidQuantityProductError(parsedQuantity),
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }
        
        const existingProduct = await cartService.getOneCart({_id: req.user.cart, products: { $elemMatch: { product: pid } } })
        
        if(existingProduct){

            const productOnCart = await cartService.getOneCart({_id: req.user.cart})
            const productToAdd = await productsService.getProductById(pid);

            productOnCart.products.map(product=>{
                if(product.product.equals(pid)){
                    const quantitySelected = product.quantity + parsedQuantity;
                    if(productToAdd.stock < quantitySelected){
                        CustomError.createError({
                            name:'Error al agregar producto al carrito',
                            cause: `El stock es insuficiente; requerido: ${quantitySelected}, stock: ${productToAdd.stock}`,
                            code: errorTypes.INVALID_ARGS_ERROR
                        })
                    }
                }
            })
            const filter = {
                _id: req.user.cart, products: { $elemMatch: { product: pid } }
            }
            
            const update = {
                $inc: { 'products.$.quantity': parsedQuantity }
            };
            
            await cartService.updateCart(filter, update);
            const productAdded = await productsService.getProductById(pid)
            return res.status(201).json({message: 'Cantidad añadida al carrito', productAdded});
        }else{
            
            const update = {
                $push: { products: {product: pid, quantity: parsedQuantity} }
            };
            
            await cartService.updateCart({ _id: req.user.cart }, update);
            const addedProduct = await productsService.getProductById(pid);
            return res.status(201).json({message: 'Producto añadido al carrito', addedProduct});
        }
    
    } catch (error) {
        next(error);
    }
}

async function purchaseCart(req, res, next){
    try {
        res.setHeader('Content-Type','application/json');
        let outOfStock = [];
        let purchasedProducts = [];

        let productsOnCart = await cartService.getCartById(req.user.cart)
        let amount = 0;
        for(const product of productsOnCart.products){
            const productStock = await productsService.getProductById(product.product);
            let productToPurchase = {
                id: productStock._id,
                title: productStock.title,
                code: productStock.code,
                price: productStock.price,
                quantity: product.quantity,
                category: productStock.category
            }
            if(product.quantity>productStock.stock){
                outOfStock.push(productToPurchase);
            }else{
                purchasedProducts.push(productToPurchase);

                const updateProduct = await productsService.updateOne(
                    {_id:product.product},
                    {$inc: { 'stock': - product.quantity }}
                )

                if(updateProduct.stock <= 0){
                    await productsService.updateOne(
                        {_id:product.product},
                        {$set: { 'isAvailable': false }}
                    )
                }
                
                
                purchasedProducts.map(product=>{
                    amount+=(product.price*product.quantity);
                    cartService.updateCart(
                        { _id: req.user.cart },
                        { $pull: { products: { product: product.id } } }
                    );
                })

                await ticketService.createTicket({
                    products: purchasedProducts,
                    amount,
                    purchaser: req.user.email,
                    code: uuidv4()
                })                
            }
            
        }

        // await transporter.transporter.sendMail({
        //     from: config.MAIL_USER,
        //     to: req.user.email,
        //     subject: 'Ticket de compra',
        //     html:`
        //         <div style="width:100%; text-align:center;">
                
        //             <h1>¡Muchas gracias por tu compra!</h1>
        //             <p>A continuación te enviamos los detalles de tu compra</p>

        //             <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%;">
        //                 <div style="display:flex; align-items:center; justify-content:center; width:100%">
        //                     ${purchasedProducts.map(product => `
        //                         <ul style="background-color: #ebebeb; margin:0.5em; padding:0; width:100%; text-align:center">
        //                             <span>Producto: </span>
        //                             <li style="list-style:none;" >Nombre: ${product.title}</li>
        //                             <li style="list-style:none;" >ID: ${product.id}</li>
        //                             <li style="list-style:none;" >Categoría: ${product.category}</li>
        //                             <li style="list-style:none;" >Cantidad: ${product.quantity} unidades</li>
        //                             <li style="list-style:none;" >Precio: $${product.price}</li>
        //                             <li style="list-style:none;" >Subtotal: $${product.price*product.quantity}</li>
        //                         </ul>
        //                     `).join('')}
        //                 </div>
        //             </div>
        //             <div style="text-align:center; width: 100%;">
        //                 <p>Total: $${amount}</p>
        //             </div>

        //         </div>
        //     `
        // }).catch(err=>console.log(err));
        //SUPONGO QUE ACÁ SE REDIRECCIONA AL CHECKOUT O ESTO FORMA PARTE DEL CHECKOUT
        if(outOfStock.length){
            return res.status(200).json({message:'Algunos productos no cuentan con stock suficiente', productsOutOfStock:outOfStock})
        }else{
            return res.status(200).json({message:'Se realizó la compra satisfactoriamente', purchasedProducts})
        }
        
    }catch(error) {
        next(error);
    }
}

async function deleteProductFromCart(req, res, next){
    try {
        res.setHeader('Content-Type','application/json');
        const pid = req.params.pid;

        if(!isValidObjectId(pid)){
            CustomError.createError({
                name:'Error buscando el ID proporcionado',
                cause: invalidIdProductError(pid),
                code: errorTypes.INVALID_ARGS_ERROR 
            })
        }
        
        const existingProduct = await productsService.getProductById(pid);
        
        if (!existingProduct) {
            CustomError.createError({
                name:"Error encontrando el producto",
                cause: IdNotFoundProductError(pid),
                code: errorTypes.NOT_FOUND_ERROR 
            })
        }
        
        const cart = await cartService.getCartById(req.user.cart);
        
        if (!cart) {
            CustomError.createError({
                name:"Error buscando el carrito",
                cause: IdNotFoundCartError(pid),
                code: errorTypes.NOT_FOUND_ERROR 
            })
        }
       
        await cartService.updateCart({_id: req.user.cart}, {$pull: {products: {product: pid}}});
        const newProductList = await cartService.populateCart(req.user.cart)
  
        return res.status(200).json({ message:'Se eliminó el producto satisfactoriamente', cart: newProductList});
    } catch (error) {
        next(error);
    }    
}

function notFound(req, res){
    res.setHeader('Content-Type','application/json');
    return res.status(404).send('Bad request, 404 not found');
}

export default { getCart, addProductToCart, deleteProductFromCart, purchaseCart, notFound }