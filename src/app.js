import express from 'express';
import { __dirname } from './utils.js';
import path from 'path';
import ConnectMongo from 'connect-mongo'
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { initPassport } from './config/passport.config.js';
import cors from 'cors'

import config from './config/config.js';
import handleErrors from './middlewares/errors/handleErrors.js';
import CustomSessionsRouter from './dao/MongoDb/routes/customSessions.router.js';
import CustomCartRouter from './dao/MongoDb/routes/customCart.router.js';
import CustomProductsRouter from './dao/MongoDb/routes/customProducts.router.js';
import CustomFavoritesRouter from './dao/MongoDb/routes/customFavorites.router.js';
import { missingToken } from './services/errors/productErrors.js';
import CustomError from './services/errors/CustomError.js';
import { errorTypes } from './services/errors/enums.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, '/public/images/products')));
app.use(session({
  secret:config.PRIVATE_KEY,
  resave:true,
  saveUninitialized:true,
  store: ConnectMongo.create({
    mongoUrl:`${config.MONGO_URL}&dbName=${config.DB_NAME}`,
    ttl: 3600
  }),
  cookie:{
    maxAge:1000*3600
  }
}))
initPassport()
app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser())
app.use(cors())

const customSessions = new CustomSessionsRouter()
const customCart = new CustomCartRouter()
const customProducts = new CustomProductsRouter()
const customFavorites = new CustomFavoritesRouter()

const auth = (req, res, next)=>{
  if(req.cookies.tokenCookie){
    next()
  }else{
    next(CustomError.createError({
      name:'Product creation error',
      cause: missingToken(),
      code: errorTypes.AUTHORIZATION_ERROR 
    }))
  }
}

app.use('/api/products', customProducts.getRouter());
app.use('/api/carts', customCart.getRouter());
app.use('/api/favorites', customFavorites.getRouter());
app.use('/api/sessions', customSessions.getRouter());
app.use('*', (req, res)=>{return res.status(404).send('Bad request, 404 not found');});
app.use(handleErrors)

app.listen(config.PORT,()=>{
    console.log(`Server escuchando en puerto ${config.PORT}`);
});
