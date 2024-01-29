import passport from "passport";
import local from 'passport-local';
import { generateHash, validateHash } from "../utils.js";
import passportJWT from 'passport-jwt'
import config from "./config.js";
import userService from "../services/users.service.js";
import CustomError from "../services/errors/CustomError.js";
import { errorTypes } from "../services/errors/enums.js";

const findToken=(req)=>{
    if(!req.headers.authorization){
        CustomError.createError({
            name:"No se envió un token de acceso",
            cause: "Token inexistente o inválido, por favor logueese nuevamente",
            code: errorTypes.AUTHENTICATION_ERROR
        })
    }
    return req.headers.authorization.split(' ')[1];

}

export const initPassport = async ()=>{

    passport.use('jwt', new passportJWT.Strategy(
        {
            jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([findToken]),
            secretOrKey: config.PRIVATE_KEY,
            credentials: true
        },
        (jwtContent, done)=>{
            try {
                return done(null, jwtContent.user)
            } catch (error) {
                return done(error)
            }
        }
    ))

    // passport.use('register', new local.Strategy(
    //     async (req, done)=>{
    //         try{
    //             console.log('a')
    //             const {token, userToken} = req.body
    //             console.log('b')
    //             const userTokenDecoded = jwt.verify(userToken, config.PRIVATE_KEY)
    //             console.log('c')
                
    //             if(!userTokenDecoded) return done(null, false, {error:`El token proveído no es válido`})
                
    //             console.log('d')
    //             const recreatedToken = crypto.createHash('sha256').update(userTokenDecoded.token.first_data + userTokenDecoded.token.second_data).digest('hex').toString();
    //             console.log('e')
                
    //             if(token !== recreatedToken){
    //                 return done(null, false, {error:`No se pudo autenticar la similitud de tokens`})
    //             }
    //             console.log('f')
                
    //             const userExists = await userService.getUserByEmail(userTokenDecoded.email)
    //             console.log('g')
                
    //             if(userExists) return done(null, false, {error:`El correo ya está asociado a una cuenta`})
                
    //             console.log('h')
    //             const createdUser = await userService.createUser({
    //                 name: userTokenDecoded.name,
    //                 last_name: userTokenDecoded.last_name,
    //                 email: userTokenDecoded.email,
    //                 role: userTokenDecoded.role,
    //                 purchases:[],
    //                 password: generateHash(userTokenDecoded.password),
    //                 token:{info:"", timestamp:0}
    //             })
                
    //             console.log('i')
    //             return done(null, createdUser);
    //         }catch (err){
    //             return done(err)
    //         }
    //     }
    // ))

    passport.use('login', new local.Strategy(
        {
            usernameField: 'email',
        },
        async (username, password, done)=>{
            try{

                if(!username || !password) return done(null, false, {message:`Campos incompletos, por favor rellene la información`})

                const userExists = await userService.getUserByEmail(username);
                
                if(!userExists) return done(null, false, {message:`Usuario: ${username}, no existe`});

                let equalPass = validateHash(password, userExists);
                if(!equalPass) return done(null, false, {message:`Las contraseñas no coinciden`})

                let userResponse = {
                    name: userExists.name,
                    last_name: userExists.last_name,
                    role: userExists.role,
                    email:userExists.email,
                    _id: userExists._id,
                }

                return done(null, userResponse)

            }catch (err){
                return done(err)
            }
        }
    ))

    passport.serializeUser((user, done)=>{
        return done(null, user._id)
    })

    passport.deserializeUser(async (id, done)=>{
        const user = await userService.getUserById(id)
        return done(null, user)
    })
}