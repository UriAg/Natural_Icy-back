import { MyRouter } from "./Schema/router.js";
import { passportCall } from "../../../utils.js";
import productController from "../../../controllers/productController.js";
import uploadImage from "../../../services/uploadImages.js";

class CustomProductsRouter extends MyRouter{
    init(){

        this.get('/', ['PUBLIC'], productController.getProductsFromBD)

        this.post('/', ['ADMIN', 'CREATOR'], passportCall('jwt'), uploadImage.array('thumbnail', 5), productController.uploadProductToDB)

        this.put('/:pid', ['ADMIN', 'CREATOR'], passportCall('jwt'), uploadImage.array('thumbnail', 5), productController.editProductFromDB)

        this.delete('/:pid', ['ADMIN', 'CREATOR'], passportCall('jwt'), productController.deleteProductFromDB)

        this.get('*', ['PUBLIC'], passportCall('jwt'), productController.notFound)
    }
}

export default CustomProductsRouter;