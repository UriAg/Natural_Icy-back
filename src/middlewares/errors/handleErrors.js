import { errorTypes } from "../../services/errors/enums.js";
export default (error, req, res, next)=>{
    switch(error.code){
        case errorTypes.AUTHENTICATION_ERROR:
            res.status(error.code).json({status:'Authentication error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.AUTHORIZATION_ERROR:
            res.status(error.code).json({status:'Authorization error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.INVALID_ARGS_ERROR:
            res.status(error.code).json({status:'Bad request error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.NOT_FOUND_ERROR:
            res.status(error.code).json({status:'Not found error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.SERVER_SIDE_ERROR:
            res.status(error.code).json({status:'Server side error', error:error.name, description:error.description, code: error.code})
            break;
        default: 
            res.status(500).json({status:'Error', error:'Unhandled error'})
    }
  
}