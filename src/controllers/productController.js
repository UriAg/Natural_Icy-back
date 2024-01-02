import cartService from "../services/cart.service.js";
import CustomError from "../services/errors/CustomError.js";
import { IdNotFoundProductError, argsProductError, invalidIdProductError } from "../services/errors/productErrors.js";
import { errorTypes } from "../services/errors/enums.js";
import productsService from "../services/products.service.js";
import { isValidObjectId } from "mongoose";
import path from 'path';
import { promises as fsPromises } from 'fs';
import { __dirname } from "../utils.js";
import favoritesService from "../services/favorites.service.js";

async function getProductsFromBD(req, res, next){
    try{
        res.setHeader('Content-Type', 'application/json');
        const products = await productsService.getProducts();
        
        if(!products) return res.status(200).json({payload: 'No se enconraron productos', products})
        
        return res.status(200).json({products})
    }catch(error){
        next(error)
    }
}

async function uploadProductToDB(req, res, next){
    try{  
        res.setHeader('Content-Type','multipart/form-data');
        const {
            title,
            description,
            labels,
            code,
            price,
            stock,
            category
        } = req.body;
        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock, 10);
        const labelsArray = labels.split(',');
        
        let stringData = [title, description, code, category];
        let numberData = [parsedPrice, parsedStock];
        
        let thumbnail = req.files
        if(!title || !description || !code || !price || !thumbnail || !req.files  || !req.files.length || !stock || !category){
            CustomError.createError({
                name:'Error creando producto',
                cause: argsProductError({title, description, labelsArray, code, parsedPrice, thumbnail, parsedStock, category}),
                code: errorTypes.INVALID_ARGS_ERROR 
            })
        }
        
        if(!stringData.every((element) => typeof(element) === "string") || !numberData.every((element) => typeof(element) === "number") || !labelsArray.every((element) => typeof(element) === "string")){
            CustomError.createError({
                name:'Error creando producto',
                cause: argsProductError({title, description, labelsArray, code, parsedPrice, thumbnail, parsedStock, category}),
                code: errorTypes.INVALID_ARGS_ERROR 
            })
        }
        
        const isExistingCode = await productsService.getProductBy({code: code});
        if(isExistingCode){
            throw CustomError.createError({
                name:'Error creando producto',
                cause: "Otro producto ya posee ese codigo de identificación",
                code: errorTypes.INVALID_ARGS_ERROR 
            })
        }
        
        const imageUrls = [];
        for (const image of req.files) {
            imageUrls.push(image.filename.replace(/\//g, ''));
        }
        
        let newProduct = await productsService.createProduct({
            title,
            description,
            labels: labelsArray,
            code,
            price: parsedPrice,
            isAvailable: true,
            thumbnail: imageUrls,
            stock: parsedStock,
            category
        })

        return res.status(201).json({ message:'Producto creado satisfactoriamente', product: newProduct});
    }catch(error){
        if(req.files.length){
            for (const imageUrl of req.files) {
                const imagePath = path.join(__dirname, '/public/images/products', imageUrl.filename);
                try {
                    await fsPromises.unlink(imagePath);
                } catch (error) {
                    CustomError.createError({
                        name:'Error al eliminar imagen de producto',
                        cause:"Error en el procesamiento de fileSystem: multer",
                        code: errorTypes.SERVER_SIDE_ERROR
                    })
                }
            }
        }
        next(error)
    }
}

async function editProductFromDB(req, res, next){
    try {
        res.setHeader('Content-Type','multipart/form-data');
        const pid = req.params.pid;
        if(!isValidObjectId(pid)){
            CustomError.createError({
                name:'Error buscando producto',
                cause: invalidIdProductError(pid),
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }
        
        const productToUpdate = await productsService.getProductById(pid)
        
        if (!productToUpdate) {
            CustomError.createError({
                name:"Error buscando producto",
                cause: IdNotFoundProductError(pid),
                code: errorTypes.NOT_FOUND_ERROR 
            })
        }
        
        const {
            title,
            description,
            labels,
            price,
            stock,
            category
        } = req.body;
        
        const convertedPrice = parseFloat(price);
        const convertedStock = parseInt(stock, 10);
        const labelsArray = labels.split(',');
        let thumbnail = req.files;

        let stringData = [title, description, category];
        let numberData = [convertedPrice, convertedStock];

        if(!title || !description || !price || !thumbnail || !req.files || !req.files.length || !stock || !category){
            CustomError.createError({
                name:'Error creando producto',
                cause: argsProductError({title, description, labelsArray, code:"NO EDIT", convertedPrice, thumbnail, convertedStock, category}),
                code: errorTypes.INVALID_ARGS_ERROR 
            })
        }
    
        if(!stringData.every((element) => typeof(element) === "string") || !numberData.every((element) => typeof(element) === "number") || !labelsArray.every((element) => typeof(element) === "string")){
            CustomError.createError({
                name:'Error creando producto',
                cause: argsProductError({title, description, labelsArray, code:"NO EDIT", convertedPrice, thumbnail, convertedStock, category}),
                code: errorTypes.INVALID_ARGS_ERROR 
            })
        }

        for (const imageUrl of productToUpdate.thumbnail) {
            const imagePath = path.join(__dirname, '/public/images/products/', imageUrl);
            try {
                await fsPromises.unlink(imagePath);
            } catch (error) {
                CustomError.createError({
                    name:'Error al eliminar imagen de producto',
                    cause:"Error en el procesamiento de fileSystem: multer",
                    code: errorTypes.SERVER_SIDE_ERROR
                })
            }
        }

        const imageUrls = [];
        for (const image of req.files) {
        //   const imageUrl = '/public/images/products' + image.filename;
          imageUrls.push(image.filename);
        }

        await productsService.updateOne({_id: pid}, {
            $set:{
                title,
                description,
                labels: labelsArray,
                price: convertedPrice,
                thumbnail: imageUrls,
                stock: convertedStock,
                category
            }
        })

        return res.status(201).json({message:'Se modificó el producto satisfactoriamente', product: productToUpdate });
    } catch (error) {

        if(req.files.length){
            for (const imageUrl of req.files) {
                const imagePath = path.join(__dirname, '/public/images/products/', imageUrl.filename);
                try {
                    await fsPromises.unlink(imagePath);
                } catch (error) {
                    CustomError.createError({
                        name:'Error al eliminar imagen de producto',
                        cause:"Error en el procesamiento de fileSystem: multer",
                        code: errorTypes.SERVER_SIDE_ERROR
                    })
                }
            }
        }

        next(error);
    }
}

async function deleteProductFromDB(req, res, next){
    try {
        res.setHeader('Content-Type','application/json');
        if(!req.params.pid){
            CustomError.createError({
                name:'Error buscando producto',
                cause: 'No se especificó un ID',
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }

        const pid = req.params.pid
        if(!isValidObjectId(pid)){
            CustomError.createError({
                name:'Error buscando producto',
                cause: invalidIdProductError(pid),
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }

        const productToDelete = await productsService.getProductById(pid);
        
        if (!productToDelete) {
            CustomError.createError({
                name:"Error buscando producto",
                cause: IdNotFoundProductError(pid),
                code: errorTypes.NOT_FOUND_ERROR 
            })
        }

        for (const imageUrl of productToDelete.thumbnail) {

            const imagePath = path.join(__dirname, '/public/images/products/', imageUrl);
            try {
                await fsPromises.unlink(imagePath);
            } catch (error) {
                CustomError.createError({
                    name:'Error al eliminar imagen de producto',
                    cause:"Error en el procesamiento de fileSystem: multer",
                    code: errorTypes.SERVER_SIDE_ERROR
                })           
            }
        }

        await productsService.deleteProduct(pid);

        const isProductOnCarts = await cartService.getAllCarts({products:{$elemMatch:{product:pid}}})
        if(isProductOnCarts && isProductOnCarts.length){
            await cartService.updateCarts(
                { products: { $elemMatch: { product: pid } } },
                { $pull: { products: { product: pid } } }
            );
        }

        const isProductOnFavorites = await favoritesService.getAllFavorites({products:{$elemMatch:{product:pid}}})
        if(isProductOnFavorites && isProductOnFavorites.length){
            await favoritesService.updateFavorites(
                { products: { $elemMatch: { product: pid } } },
                { $pull: { products: { product: pid } } }
            );
        }

        let products = await productsService.getProducts();

        return res.status(200).json({ message:'Producto eliminado', productDeleted: productToDelete, products: products });
    } catch (error) {
        next(error);
    }
}

function notFound(req,res){
    res.setHeader('Content-Type','application/json');
    return res.status(404).send('Bad request, 404 not found');
}

export default { getProductsFromBD, uploadProductToDB, editProductFromDB, deleteProductFromDB, notFound }