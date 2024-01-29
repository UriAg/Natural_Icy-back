import CustomError from "../services/errors/CustomError.js";
import { errorTypes } from "../services/errors/enums.js";
import { generateHash, generateJWT, validateHash } from "../utils.js";
import jwt from 'jsonwebtoken'
import transporter from '../services/contact.service.js'
import userService from '../services/users.service.js'
import crypto from 'crypto'
import config from "../config/config.js";


async function sendVerifyEmail(req, res, next){
    try {
        res.setHeader('Content-Type','application/json');
        const {
            name,
            last_name,
            email,
            password,
            repeatedPassword
        } = req.body;
        
        if(req.headers.authorization){
            CustomError.createError({
                name:"Error enviando mail de registro",
                cause: "Ya hay una sesión activa, por favor deslogueese",
                code: errorTypes.AUTHORIZATION_ERROR
            })
        }
        
        if ( !name || !last_name || !email || !password || !repeatedPassword){
            CustomError.createError({
                name: "Error enviando mail de registro",
                cause: "Alguno de los campos está incompleto",
                code: errorTypes.INVALID_ARGS_ERROR,
            });
        }
        
        const existingUser = await userService.getUserByEmail(email)
        
        if(existingUser){
            CustomError.createError({
                name: "Error enviando mail de registro",
                cause: "El correo ya está asociado a una cuenta",
                code: errorTypes.INVALID_ARGS_ERROR,
            });
        }
        
        if (password !== repeatedPassword){
            CustomError.createError({
                name: "Error enviando mail de registro",
                cause: "Las contraseñas no coinciden",
                code: errorTypes.INVALID_ARGS_ERROR,
            });
        }

        const token = crypto.createHash('sha256').update(email + password).digest('hex').toString();

        const userToken = generateJWT({
            name,
            last_name,
            email,
            role: 'USER',
            password,
            token:{
                first_data: email,
                second_data: password
            }
        })

        const validateLink = `${config.CONFIRM_REGISTER_LINK}?ht=${token}&ut=${userToken}`

        await transporter.sendMail({
            to: email,
            subject: 'Email de confirmación',
            html:`
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: 'Roboto';">
                <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <p>Haz click en el enlace para validar tu cuenta en Natural Icy Market</p>
                    <a href="${validateLink}" style="text-decoration: none; padding: 10px 20px; font-size: 16px; background-color: #4CAF50; color: #fff; border: none; border-radius: 4px; cursor: pointer;"
                        onmouseover="this.style.backgroundColor='#45a049'" onmouseout="this.style.backgroundColor='#4CAF50'">
                        Confirmar correo
                    </a>
                </div>
            </body>
            `
        }).catch(err=>console.log(err));

        return res.status(200).json({payload:'Se envió un correo de confirmación al usuario'});
    } catch (error) {
        next(error)
    }
}

async function registerComplete(req, res, next){
    try{
        res.setHeader('Content-Type','application/json');
        const {token, userToken} = req.body
        const userTokenDecoded = jwt.verify(userToken, config.PRIVATE_KEY)
        
        if(!userTokenDecoded){
            CustomError.createError({
                name: "Error validando el correo",
                cause: "El token propuesto no coincide",
                code: errorTypes.INVALID_ARGS_ERROR,
            });
        }
        const recreatedToken = crypto.createHash('sha256').update(userTokenDecoded.user.token.first_data + userTokenDecoded.user.token.second_data).digest('hex').toString();
        
        if(token !== recreatedToken){
            CustomError.createError({
                name: "Error validando el correo",
                cause: "No hay similitud en los tokens",
                code: errorTypes.INVALID_ARGS_ERROR,
            });
        }
        
        const userExists = await userService.getUserByEmail(userTokenDecoded.user.email)
        
        if(userExists){
            CustomError.createError({
                name: "Error validando el correo",
                cause: "El correo ya se encuentra asociado a una cuenta",
                code: errorTypes.INVALID_ARGS_ERROR,
            });
        }
        
        const createdUser = await userService.createUser({
            name: userTokenDecoded.user.name,
            last_name: userTokenDecoded.user.last_name,
            email: userTokenDecoded.user.email,
            role: userTokenDecoded.user.role,
            purchases:[],
            password: generateHash(userTokenDecoded.user.password),
            token:{info:"", timestamp:0}
        })
        
        req.user = createdUser
        return res.status(200).json({payload:`Usuario: ${req.user.email}, registrado correctamente`, userEmail:req.user.email})
    }catch (err){
        next(err)
    }
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
        console.log(req.user)
        let token = generateJWT(req.user)

        return res.status(200).json({payload:`Logueado correctamente`, generateTokenCookie: token, userRole:req.user.role})
    }catch(error){
        next(error)
    }
}

async function forgotPass(req,res){
    try{
        res.setHeader('Content-Type','application/json');
        const userEmail = req.body.email;
        
        let existingUser = await userService.getUserByEmail(userEmail);
        if(!existingUser){
            CustomError.createError({
                name:"Error al modificar contraseña",
                cause: "No se encontró una cuenta asociada a ese email",
                code: errorTypes.NOT_FOUND_ERROR
            })
        }

        const timestamp = Date.now();
        const token = crypto.createHash('sha256').update(userEmail + timestamp).digest('hex').toString();

        const filter = { email: userEmail };
        const update = { $set: { token: {info:token, timestamp:timestamp} } };
        
        await userService.updateUser(filter, update);
        const resetLink = `${config.RECOVERY_LINK}?token=${token}&email=${userEmail}`;
             
        await transporter.sendMail({
            to: userEmail,
            subject: 'Email de verificación',
            html:`
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: 'Roboto';">
                <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <p>Haz click en el enlace para validar tu cuenta en Natural Icy Market</p>
                    <a href="${resetLink}" style="text-decoration: none; padding: 10px 20px; font-size: 16px; background-color: #4CAF50; color: #fff; border: none; border-radius: 4px; cursor: pointer;"
                        onmouseover="this.style.backgroundColor='#45a049'" onmouseout="this.style.backgroundColor='#4CAF50'">
                        Cambiar contraseña
                    </a>
                </div>
            </body>
            `
        }).catch(err=>console.log(err));

        return res.status(200).json({payload:'Se envió un correo de recuperación al usuario'});
    }catch(error){
        next(error)
    }
}

async function changePassword(req,res, next){
    try{
        const { password, repeatedPassword, token, email } = req.body;
        // const email = req.params.email
        let user = await userService.getUserByEmail(email);

        if(token !== user.token.info){
            CustomError.createError({
                name:"Error al procesar token",
                cause: "El token expiró o ya se utilizó, Por favor genere otro",
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }

        const tokenTimestamp = user.token.timestamp;
        const actualDate = Date.now();
        const limitTokenLife = 24 * 60 * 60 * 1000;
        
        if (actualDate - tokenTimestamp > limitTokenLife) {
            const filter = { email: email };
            const update = { $set: { token: {info:"", timestamp:0} } };
            await userService.updateUser(filter, update);
            CustomError.createError({
                name:"Error al procesar token",
                cause: "El token recibido expiró, por favor genere otro",
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }

        if(!password || !repeatedPassword){
            CustomError.createError({
                name:"Error al modificar contraseña",
                cause: "Al menos un campo está incompleto",
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }
        if(password !== repeatedPassword){
            CustomError.createError({
                name:"Error al modificar contraseña",
                cause: "Las contraseñas no coinciden",
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }
        
        let equalPass = validateHash(password, user);
        if(equalPass){
            CustomError.createError({
                name:"Error al modificar contraseña",
                cause: "La nueva contraseña no puede ser igual a la anterior",
                code: errorTypes.INVALID_ARGS_ERROR
            })
        }
        let hashedPass = generateHash(password)
    
        const filter = { email: email };
        const update = { $set: { password: hashedPass, token:{info:"", timestamp:0} } };
        await userService.updateUser(filter, update);
        return res.status(200).json({payload:'Se modificó la contraseña correctamente'});
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

export default { sendVerifyEmail, registerComplete, generateLogin, forgotPass, changePassword, generateLogout, notFound }