import { MyRouter } from "./Schema/router.js";
import { passportCall } from "../../../utils.js";
import sessionController from "../../../controllers/sessionController.js";

class CustomSessionsRouter extends MyRouter{
    init(){
        this.post('/register', ['PUBLIC'], passportCall('register'), sessionController.registerComplete)

        this.post('/login', ['PUBLIC'], passportCall('login'), sessionController.generateLogin)

        this.get('/logout', ['PUBLIC'], sessionController.generateLogout)

        this.get('*', ['PUBLIC'], sessionController.notFound)
    }
}

export default CustomSessionsRouter;