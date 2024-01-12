import { MyRouter } from "./Schema/router.js";
import { passportCall } from "../../../utils.js";
import checkoutController from "../../../controllers/checkoutController.js";

class CustomCheckoutRouter extends MyRouter{
    init(){
        this.post('/createPreference', ['USER', 'ADMIN', 'CREATOR'], passportCall('jwt'), checkoutController.createPreference)

        this.post('/notify', ['PUBLIC'], checkoutController.getNotification)

        this.get('*', ['PUBLIC'], checkoutController.notFound)
    }
}

export default CustomCheckoutRouter;