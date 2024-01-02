import CustomError from "../services/errors/CustomError.js";
import { errorTypes } from "../services/errors/enums.js";
import { generateJWT } from "../utils.js";

function registerComplete(req, res, next){
    res.setHeader('Content-Type','application/json');
    return res.status(200).json({payload:`Usuario: ${req.user.email}, registrado correctamente`, userEmail:req.user.email})
}

async function generateLogin(req, res, next){
    try{
        res.setHeader('Content-Type','application/json');
        if(req.headers.authorization){
            CustomError.createError({
                name:"Error al loguear",
                cause: "Ya hay una sesión activa",
                code: errorTypes.AUTHORIZATION_ERROR
            })
        }
        let token = generateJWT(req.user)

        return res.status(200).json({payload:`Logueado correctamente`, generateTokenCookie: token})
    }catch(error){
        next(error)
    }
}

async function generateLogout(req,res, next){
    try{
        res.setHeader('Content-Type','application/json');
        if(!req.headers.authorization){
            CustomError.createError({
                name:"No se encontro una sesión activa",
                cause: "No se encontró un token activo",
                code: errorTypes.AUTHENTICATION_ERROR
            })
        }
        await res.clearCookie('tokenCookie')
        return res.status(200).json({payload:"Se ha cerrado la sessión correctamente"})
    }catch(error){
        next(error)
    }
}

function notFound(req,res){
    res.setHeader('Content-Type','application/json');
    return res.status(404).send('Bad request, 404 not found');
}

export default { registerComplete, generateLogin, generateLogout, notFound }