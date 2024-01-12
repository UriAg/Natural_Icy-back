import { MyRouter } from "./Schema/router.js";
import { passportCall } from "../../../utils.js";
import cartController from "../../../controllers/cartController.js";

class CustomCartRouter extends MyRouter{
    init(){
        this.get('/purchase', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), cartController.purchaseCart)

        this.post('/selected', ['PUBLIC'], cartController.getCartProductsFromBD)

        this.get('*', ['PUBLIC'], cartController.notFound)
    }
}

export default CustomCartRouter;