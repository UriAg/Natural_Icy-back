import { errorTypes } from "../../services/errors/enums.js";
export default (error, req, res, next)=>{
    switch(error.code){
        case errorTypes.AUTHENTICATION_ERROR:
            res.json({status:'Authentication error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.AUTHORIZATION_ERROR:
            res.json({status:'Authorization error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.INVALID_ARGS_ERROR:
            res.json({status:'Bad request error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.NOT_FOUND_ERROR:
            res.json({status:'Not found error', error:error.name, description:error.description, code: error.code})
            break;
        case errorTypes.SERVER_SIDE_ERROR:
            res.json({status:'Server side error', error:error.name, description:error.description, code: error.code})
            break;
        default: 
            res.json({status:'Error', error:'Unhandled error'})
    }
  
}