import { v4 as uuidv4 } from 'uuid';
import transporter from "../services/contact.service.js";
import productsService from "../services/products.service.js";
import ticketService from "../services/ticket.service.js";
import config from '../config/config.js';
import { errorTypes } from '../services/errors/enums.js';
import { isValidObjectId } from 'mongoose';
import CustomError from '../services/errors/CustomError.js';
import { MercadoPagoConfig, Preference } from 'mercadopago'
import axios from 'axios'
const client = new MercadoPagoConfig({ accessToken: config.ACCESS_TOKEN, options: { timeout: 5000 } });
const preference = new Preference(client);

async function createPreference(req, res, next){
    try {
        res.setHeader('Content-Type','application/json');
        if(!req.body.orderData || !req.body.orderData.length){
            CustomError.createError({
                name: "Error buscando productos",
                cause: 'No se proporcionaron identificadores',
                code: errorTypes.INVALID_ARGS_ERROR,
            });
        }

        let outOfStock = [];
        let productsWithStock = [];
        let total_amount = 0
        const random_code = uuidv4();
        let address;
        req.body.address ? address = req.body.address : address = false
        let phone;
        req.body.phone ? phone = req.body.phone : phone = false
        const purchasedProducts = req.body.orderData;

        for(const product of purchasedProducts){
            if(!isValidObjectId(product.id)){
                CustomError.createError({
                    name: "Error procesando compra",
                    cause: `El ID: '${product.id} no es un id válidos'`,
                    code: errorTypes.INVALID_ARGS_ERROR,
                });
            }

            const productStock = await productsService.getProductById(product.id);

            if(!productStock){
                CustomError.createError({
                    name: "Error procesando compra",
                    cause: `No se encontro el producto con ID: '${product.id}'`,
                    code: errorTypes.NOT_FOUND_ERROR,
                });
            }

            total_amount+=parseFloat(productStock.price);

            let productToPurchase = {
                id: productStock._id.toString(),
                title: productStock.title,
                currency_id: 'ARS',
                description: productStock.description,
                category_id: productStock.category,
                quantity: parseInt(product.quantity, 10),
                unit_price: parseFloat(productStock.price)
            }
            if(parseInt(productStock.stock, 10)<parseInt(product.quantity, 10)){
                outOfStock.push(productToPurchase);
            }else{
                productsWithStock.push(productToPurchase);           
            }
            
        }
        
        let preferenceQuery = {
            items: productsWithStock,
            payer: {
                name: req.user.name,
                last_name: req.user.last_name,
                email: req.user.email,
                phone:{
                    area_code: parseInt(phone.area_code, 10),
                    number: parseInt(phone.number, 10)
                }
            },
            binary_mode: true,
            back_urls: {
                success: "http://127.0.0.1:5500/src/public/index-local/index.html/src/public/index-prueba-local/index.html",
                failure: "http://127.0.0.1:5500/src/public/index-local/index.html/src/public/index-prueba-local/index.html",
            },
            auto_return: 'approved',
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 1
            },
            statement_descriptor: 'Natural Icy Market',
            external_reference: random_code.toString()
        };

        if (address) {
            preferenceQuery.payer['address'] = {
                street_name: address.street_name,
                street_number: parseInt(address.street_number, 10),
                apartment: address.apartment,
                aditional_info: address.aditional_info,
                zip_code: parseInt(address.zip_code, 10)
            };
            preferenceQuery['shipments'] = {
                cost: 1,
                mode: "not_specified",
            };
            await ticketService.createTicket({
                products: preferenceQuery.items,
                total_amount,
                payer: preferenceQuery.payer,
                shipment: true,
                code: random_code.toString()
            }) 
        }else{
            await ticketService.createTicket({
                products: preferenceQuery.items,
                total_amount,
                payer: preferenceQuery.payer,
                shipment: false,
                code: random_code.toString()
            }) 

        }

        preference.create({body:preferenceQuery})
        .then(async function (response) {   

            return res.status(200).json({
                id: response.id
            });
        }).catch(async function (error) {
            await ticketService.deleteTicket({code: random_code.toString()});
        });
      
    }catch(error) {
        next(error);
    }
}

async function getNotification(req, res, next){
try {
    console.log('a')
    res.setHeader('Content-Type','application/json');
    const paymentData = req.body;
    const orderState = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentData.data.id}`, {
        method: 'GET',
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.ACCESS_TOKEN}`
        }
    });
    console.log('b')
    // const signature = req.headers['x-signature'];
    // if (!client.validateWebhookSignature(JSON.stringify(paymentData), signature)) {
    //     CustomError.createError({
    //         name: "Error creando el ticket",
    //         cause: `Firma de webhook no válida`,
    //         code: errorTypes.AUTHENTICATION_ERROR,
    //     });
    // }
    console.log('c')
    console.log(paymentData)
    console.log('########################################################')
    console.log(orderState.data.status)
    // if (paymentData && paymentData.action === 'payment.updated' && paymentData.data && paymentData.data.status === 'approved') {
    //     console.log('if a')
        
    //     const ticketResponse = await ticketService.getTicket({code: paymentData.external_reference});
        
    //     console.log('if b')
    //     await transporter.transporter.sendMail({
    //         from: config.SERVER_MAIL,
    //         to: config.MAIL_ADMIN,
    //         subject: 'Orden de compra',
    //         html:`
    //         <body style="font-family: 'Arial', sans-serif; background-color: #f2f2f2; margin: 0; padding: 0;">

    //             <div style="width: 80%; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
    //                 <h1 style="color: #333; text-align: center;">¡Se ha registrado una venta!</h1>
            
    //                 <div>
    //                     <h2 style="color: #555;">Comprador</h2>
    //                     <ul style="list-style: none; padding: 0;">
    //                         <li style="margin-bottom: 10px;"><b>Nombre: </b>${ticketResponse.payer.name} ${ticketResponse.payer.last_name}</li>
    //                         <li style="margin-bottom: 10px;"><b>Email: </b>${ticketResponse.payer.email}</li>
                            
    //                         ${ticketResponse.shipment ? `
    //                             <li style="margin-bottom: 10px;"><b>Nombre de calle: </b>${ticketResponse.payer.address.street_name}</li>
    //                             <li style="margin-bottom: 10px;"><b>Numero de domicilio: </b>${ticketResponse.payer.address.street_number}</li>
    //                             <li style="margin-bottom: 10px;"><b>Envío: </b>Si</li>
                                
    //                             ${ticketResponse.payer.address.apartment && `
    //                                 <li style="margin-bottom: 10px;"><b>Numero de departamento: </b>${ticketResponse.payer.address.apartment}</li>
    //                             `}
                                
    //                             ${ticketResponse.payer.phone && `
    //                                 <li style="margin-bottom: 10px;"><b>Numero de teléfono: </b>${ticketResponse.payer.phone.area_code} ${ticketResponse.payer.phone.number}</li>
    //                             `}
                                
    //                         ` : `
    //                             <li style="margin-bottom: 10px;"><b>Envío: </b>No</li>

    //                             ${ticketResponse.payer.phone && `
    //                                 <li style="margin-bottom: 10px;"><b>Numero de teléfono: </b>${ticketResponse.payer.phone.area_code} ${ticketResponse.payer.phone.number}</li>
    //                             `}
    //                         `}
    //                     </ul>
    //                 </div>
            
    //                 <div>
    //                     <h2 style="color: #555;">Productos</h2>
    //                     ${ticketResponse.products.map(product => `
    //                         <div style="background-color: #ebebeb; margin: 10px 0; padding: 10px; text-align: center;">
    //                             <ul style="list-style: none; padding: 0;">
    //                                 <li style="margin-bottom: 10px;"><b>Nombre: </b>${product.title}</li>
    //                                 <li style="margin-bottom: 10px;"><b>ID: </b>${product.id}</li>
    //                                 <li style="margin-bottom: 10px;"><b>Categoría: </b>${product.category_id}</li>
    //                                 <li style="margin-bottom: 10px;"><b>Cantidad: </b>${product.quantity} unidades</li>
    //                                 <li style="margin-bottom: 10px;"><b>Precio: </b>$${product.unit_price}</li>
    //                                 <li style="margin-bottom: 10px;"><b>Subtotal: </b>$${product.unit_price * product.quantity}</li>
    //                             </ul>
    //                         </div>
    //                     `).join('')}
    //                 </div>
            
    //                 ${ticketResponse.shipment && ticketResponse.payer.address.aditional_info && `
    //                     <div style="margin-top: 20px;">
    //                         <h2>Información adicional de envío</h2>
    //                         <p>${ticketResponse.payer.address.aditional_info}</p>
    //                     </div>
    //                 `}
            
    //                 <div style="text-align:center; margin-top: 20px;">
    //                     <p><b>Precio final: </b>$${ticketResponse.total_amount}</p>
    //                 </div>
    //             </div>
        
    //         </body>
        
    //         `
    //     }).catch(err=>console.log(err));
    //     console.log('if c')
        
    //     return res.status(200).json({payload: 'Se envió el ticket satisfactoriamente'})
    // }
    // console.log('d')

    // if (paymentData && paymentData.action === 'rejected') {
    //     console.log('se eliminó')
    //     await ticketService.deleteTicket({code: paymentData.data.external_reference});
    //     return res.status(200).json({payload: 'Se canceló la compra del ticket'})
    // }
    return res.status(200).json({payload: 'hubo un error'})
}catch(error){
    next(error)
}

}

function notFound(req, res){
    res.setHeader('Content-Type','application/json');
    return res.status(404).json({payload:'Bad request, 404 url not found'});
}

export default { createPreference, getNotification, notFound }



        