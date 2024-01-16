import express from 'express';
import { __dirname } from './utils.js';
import path from 'path';
import ConnectMongo from 'connect-mongo'
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { initPassport } from './config/passport.config.js';
import cors from 'cors'
import { ticketExpirationValidation } from './services/ticketStatusValidator.js';

import config from './config/config.js';
import handleErrors from './middlewares/errors/handleErrors.js';
import CustomSessionsRouter from './dao/MongoDb/routes/customSessions.router.js';
import CustomCartRouter from './dao/MongoDb/routes/customCart.router.js';
import CustomProductsRouter from './dao/MongoDb/routes/customProducts.router.js';
import CustomCheckoutRouter from './dao/MongoDb/routes/customCheckout.router.js';


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
    ttl: 86400
  }),
  cookie:{
    maxAge:86400000
  }
}))
initPassport()
app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser())
app.use(cors())

const weekInterval = 7 * 24 * 60 * 60 * 1000;
const customSessions = new CustomSessionsRouter()
const customCart = new CustomCartRouter()
const customProducts = new CustomProductsRouter()
const customCheckout = new CustomCheckoutRouter()

app.use('/api/products', customProducts.getRouter());
app.use('/api/carts', customCart.getRouter());
app.use('/api/sessions', customSessions.getRouter());
app.use('/api/checkout', customCheckout.getRouter());
app.use('*', (req, res)=>{return res.status(404).json({payload:'Bad request, 404 url not found'});});
app.use(handleErrors)


app.listen(config.PORT,async ()=>{
  console.log(`Server escuchando en puerto ${config.PORT}`);
  setInterval(()=>{
    ticketExpirationValidation()
  }, weekInterval)
});
