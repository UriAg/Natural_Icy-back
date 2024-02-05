import { MyRouter } from "./Schema/router.js";
import { passportCall } from "../../../utils.js";
import productController from "../../../controllers/productController.js";
import uploadImage from "../../../services/uploadImages.js";

class CustomProductsRouter extends MyRouter{
    init(){

        this.get('/every', ['PUBLIC'], productController.getProducts)

        this.get('/withStock', ['PUBLIC'], productController.getProductsWithStockFromBD)

        this.get('/withoutStock', ['PUBLIC'], productController.getProductsWithoutStockFromBD)

        this.get('/:productId', ['PUBLIC'], productController.getOneProductFromBD)

        this.post('/selected', ['PUBLIC'], productController.getFavoritesProductsFromBD)

        this.post('/', ['ADMIN', 'CREATOR'], passportCall('jwt'), uploadImage.array('thumbnail', 5), productController.uploadProductToDB)

        this.put('/:productId', ['ADMIN', 'CREATOR'], passportCall('jwt'), uploadImage.array('thumbnail', 5), productController.editProductFromDB)
        
        // this.put('/:productId/images', ['ADMIN', 'CREATOR'], passportCall('jwt'), uploadImage.array('thumbnail', 5), productController.addProductImagesFromDB)
        
        // this.delete('/:productId/images', ['ADMIN', 'CREATOR'], passportCall('jwt'), productController.deleteProductImageFromDB)
        
        this.delete('/:productId', ['ADMIN', 'CREATOR'], passportCall('jwt'), productController.deleteProductFromDB)

        this.get('*', ['PUBLIC'], passportCall('jwt'), productController.notFound)
    }
}

export default CustomProductsRouter;