import {fileURLToPath} from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import passport from 'passport';
import config from './config/config.js';
import CustomError from "./services/errors/CustomError.js";
import { errorTypes } from "./services/errors/enums.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const generateHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10));
export const validateHash = (password, user) => bcrypt.compareSync(password, user.password);

export const generateJWT=(user)=>jwt.sign({user}, config.PRIVATE_KEY, {expiresIn: '24h'})

export const passportCall=(strategy)=>{
    return async function(req, res, next){
        passport.authenticate(strategy, function(err, user, info, status){
            if(err) return next(err);
            if(!user){
                next(CustomError.createError({
                    name:"Error de credenciales",
                    cause: info.message ? info.message : info.toString(),
                    code: errorTypes.INVALID_ARGS_ERROR
                }))
            }
            req.user=user
            return next()
        })(req, res, next)
    }
}

export const allowedFetchOrigins = ['127.0.0.1:5500', 'natural-icy-market.netlify.app'];