import { errorTypes } from "../../services/errors/enums.js";
export default (error, req, res, next)=>{
    switch(error.code){
        case errorTypes.AUTHENTICATION_ERROR:
            res.status(AUTHENTICATION_ERROR).json({status:'Authentication error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.AUTHORIZATION_ERROR:
            res.status(AUTHORIZATION_ERROR).json({status:'Authorization error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.INVALID_ARGS_ERROR:
            res.status(INVALID_ARGS_ERROR).json({status:'Bad request error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.NOT_FOUND_ERROR:
            res.status(NOT_FOUND_ERROR).json({status:'Not found error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.SERVER_SIDE_ERROR:
            res.status(SERVER_SIDE_ERROR).json({status:'Server side error', error:error.name, description:error.description, code: error.code})
            break;
        default: 
            res.status(500).json({status:'Error', error:'Unhandled error'})
    }
  
}