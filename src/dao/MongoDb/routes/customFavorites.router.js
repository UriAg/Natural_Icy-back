import { MyRouter } from "./Schema/router.js";
import { passportCall } from "../../../utils.js";
import favoritesController from "../../../controllers/favoritesController.js";

class CustomFavoritesRouter extends MyRouter{
    init(){

        this.get('/', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), favoritesController.getFavorites)

        this.post('/:pid', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), favoritesController.addProductToFavorites)

        this.delete('/product/:pid', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), favoritesController.deleteProductFromFavorites)

        this.get('*', ['PUBLIC'], favoritesController.notFound)
    }
}

export default CustomFavoritesRouter;