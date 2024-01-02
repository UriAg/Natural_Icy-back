import passport from "passport";
import local from 'passport-local';
import { generateHash, validateHash } from "../utils.js";
import passportJWT from 'passport-jwt'
import config from "./config.js";
import userService from "../services/users.service.js";
import cartService from "../services/cart.service.js";
import favoritesService from "../services/favorites.service.js";
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

    passport.use('register', new local.Strategy(
        {
            usernameField: 'email',
            passReqToCallback: true,
        },
        async (req, username, password, done)=>{
            try{
                let {name, last_name, role, email } = req.body;
                if(!name || !last_name || !role || !email || !password) return done(null, false);
            
                const userExists = await userService.getUserByEmail(email)

                if(userExists) return done(null, false, {message:`Usuario: ${username}, previamente registrado`})
                
                let createdCart = await cartService.createCart()
                let createdFavorites = await favoritesService.createFavorites()

                const createdUser = await userService.createUser({
                    name: name,
                    last_name: last_name,
                    email: email,
                    role: role,
                    password: generateHash(password),
                    cart: createdCart._id,
                    favorites: createdFavorites._id,
                })
    
                return done(null, createdUser);
            }catch (err){
                return done(err)
            }
        }
    ))

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
                    cart: userExists.cart,
                    favorites: userExists.favorites
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