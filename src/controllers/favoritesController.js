import productsService from "../services/products.service.js";
import { errorTypes } from '../services/errors/enums.js';
import { isValidObjectId } from 'mongoose';
import CustomError from '../services/errors/CustomError.js';
import { IdNotFoundFavoritesError, IdNotFoundProductError, invalidIdProductError } from '../services/errors/productErrors.js';
import favoritesService from "../services/favorites.service.js";

async function getFavorites(req, res, next){
    try{
        res.setHeader('Content-Type','application/json');
        const fid = req.user.favorites;
        if(!isValidObjectId(fid)){
            CustomError.createError({
                name:'Error buscando el ID proporcionado',
                cause: 'El ID proporcionado no está asociado a ninguna sección de favoritos',
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }
        
        const existingFavorites = await favoritesService.getFavorites({_id: fid});
        
        if(!existingFavorites){
            CustomError.createError({
                name:'No se encontro la sección de favoritos personal',
                cause: 'El ID no es correcto o no está asociado a ninguna sección',
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }

        const populatedFavorites = await favoritesService.populateFavorites(fid)

        if(!populatedFavorites.products.length) return res.status(200).json({payload:'No se encontraron productos en favoritos', products:[]})
        return res.status(200).json({products: populatedFavorites.products})
    }catch(error){
        next(error)
    }
}

async function addProductToFavorites(req, res, next){
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

        const existingProduct = await favoritesService.getFavorites({_id: req.user.favorites, products: { $elemMatch: { product: pid } } })
        
        if(existingProduct){
            return res.status(400).json({message:'El producto ya se encuentra en favoritos', product: existingProduct.products});
        }else{
            const update = {
                $push: { products: {product: pid} }
            };
            
            await favoritesService.updateFavorite({ _id: req.user.favorites }, update);
            const addedProduct = await productsService.getProductById(pid)
            return res.status(201).json({message: 'Producto añadido a favoritos', addedProduct});
        }
    
    } catch (error) {
        next(error);
    }
}

async function deleteProductFromFavorites(req, res, next){
    try {
        res.setHeader('Content-Type','application/json');
        const pid = req.params.pid;
        if(!isValidObjectId(pid)){
            CustomError.createError({
                name:'Error buscando el ID proporcionado',
                cause: IdNotFoundProductError(pid),
                code: errorTypes.INVALID_ARGS_ERROR 
            })
        }
        
        const favorites = await favoritesService.getFavoritesById(req.user.favorites);
        
        if (!favorites) {
            CustomError.createError({
                name:"Error buscando la sección personal de favoritos",
                cause: IdNotFoundFavoritesError(pid),
                code: errorTypes.NOT_FOUND_ERROR 
            })
        }
        
        const existingProduct = await favoritesService.getFavorites({_id: req.user.favorites, products: { $elemMatch: { product: pid } } });
        
        if (!existingProduct) {
            CustomError.createError({
                name:"Error encontrando el producto",
                cause: invalidIdProductError(pid),
                code: errorTypes.NOT_FOUND_ERROR 
            })
        }
        
        const modifiedFavorites = await favoritesService.updateFavorite({_id: req.user.favorites}, {$pull: {products: {product: pid}}});

        return res.status(200).json({ message:'Se eliminó el producto satisfactoriamente', favorites: modifiedFavorites});
    } catch (error) {
        next(error);
    }    
}

function notFound(req, res){
    res.setHeader('Content-Type','application/json');
    return res.status(404).send('Bad request, 404 not found');
}

export default { getFavorites, addProductToFavorites, deleteProductFromFavorites, notFound }