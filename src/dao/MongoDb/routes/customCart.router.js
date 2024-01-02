import { MyRouter } from "./Schema/router.js";
import { passportCall } from "../../../utils.js";
import cartController from "../../../controllers/cartController.js";

class CustomCartRouter extends MyRouter{
    init(){
        
        this.get('/', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), cartController.getCart)

        this.get('/purchase', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), cartController.purchaseCart)

        this.post('/:pid/:pq', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), cartController.addProductToCart)

        this.delete('/product/:pid', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), cartController.deleteProductFromCart)

        this.get('*', ['PUBLIC'], cartController.notFound)
    }
}

export default CustomCartRouter;