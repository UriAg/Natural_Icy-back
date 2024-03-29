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
import userService from '../services/users.service.js';
const client = new MercadoPagoConfig({ accessToken: config.ACCESS_TOKEN});
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
        let purchasedTicket;
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

            let productToPurchase = {
                id: productStock._id.toString(),
                title: productStock.title,
                currency_id: 'ARS',
                description: productStock.description,
                category_id: productStock.category,
                quantity: parseInt(product.quantity, 10),
                unit_price: parseFloat(productStock.price)
            }
            if(!productStock.isAvailable || parseInt(productStock.stock, 10)<parseInt(product.quantity, 10)){
                outOfStock.push(productToPurchase);
            }else{
                productsWithStock.push(productToPurchase);           
            }
            
        }
        productsWithStock.map(product=>{
            total_amount+=(parseFloat(product.unit_price)*parseInt(product.quantity))
        })
        
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
                success: config.SUCCESS_PAY,
                failure: config.FAILURE_PAY,
                failure: config.FAILURE_PAY,
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
                apartment: address.apartment ? address.apartment : false,
                aditional_info: address.aditional_info ? address.aditional_info : false,
                zip_code: parseInt(address.zip_code, 10)
            };
            // preferenceQuery['shipments'] = {
                //     cost: 1,
            //     mode: "not_specified",
            // };
            purchasedTicket = await ticketService.createTicket({
                products: preferenceQuery.items,
                total_amount,
                payer: preferenceQuery.payer,
                shipment: true,
                code: random_code.toString(),
                isPaid: false
            }) 
        }else{
            purchasedTicket = await ticketService.createTicket({
                products: preferenceQuery.items,
                total_amount,
                payer: preferenceQuery.payer,
                shipment: false,
                code: random_code.toString(),
                isPaid: false
            }) 
            
        }
        await userService.updateUser(
            {email: req.user.email},
            { $push: { purchases: {payment_id: purchasedTicket._id} } })

        preference.create({body:preferenceQuery})
        .then(async function (response) {   
            return res.status(200).json({
                id: response.id
        });
        }).catch(async function (error) {
            await ticketService.deleteTicket({code: random_code.toString()});
            await userService.updateUser(
                { email: req.user.email },
                { $pull: { purchases: {payment_id: purchasedTicket._id} } })
            return res.status(200).json({payload:'No se concretó la compra', error})
        });
    }catch(error) {
        next(error);
    }
}

async function getNotification(req, res, next){
try {
    res.setHeader('Content-Type','application/json');
    const paymentData = req.body;
    const orderState = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentData.data.id}`, {
        method: 'GET',
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.ACCESS_TOKEN}`
        }
    });
    
    // const signature = req.headers['x-signature'];
    // if (!client.validateWebhookSignature(JSON.stringify(paymentData), signature)) {
    //     CustomError.createError({
    //         name: "Error creando el ticket",
    //         cause: `Firma de webhook no válida`,
    //         code: errorTypes.AUTHENTICATION_ERROR,
    //     });
    // }
    if (paymentData && paymentData.action === 'payment.created' && orderState && orderState.data.status === 'approved') {
        
        const ticketResponse = await ticketService.getTicket({code: orderState.data.external_reference.toString()});
        await ticketService.updateTicket({code: orderState.data.external_reference.toString()},
        {$set: {isPaid: true}})
        let clientPhoneReplaced;
        if(ticketResponse.payer.phone){
            clientPhoneReplaced = `${ticketResponse.payer.phone.area_code.toString()}${ticketResponse.payer.phone.number.toString().replace(/\s/g, '')}`
        }

        await transporter.sendMail({
            to: config.MAIL_ADMIN,
            subject: 'Orden de venta',
            html:`
            <body style="background-color: #f2f2f2; margin: 0; padding: 0; font-family: 'Roboto';">

                <div style="width: 80%; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h1 style="color: #333; text-align: center;">¡Se ha registrado una venta!</h1>
                    <span style="display: inline-block; color: #333; text-align: center; width: 100%;">Código de operación: ${paymentData.data.id}</span>
            
                    <div>
                        <h2 style="color: #555;">Comprador</h2>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 10px;"><b>Nombre: </b>${ticketResponse.payer.name} ${ticketResponse.payer.last_name}</li>
                            <li style="margin-bottom: 10px;"><b>Email: </b>${ticketResponse.payer.email}</li>
                            
                            ${ticketResponse.shipment !== false ? `
                                <li style="margin-bottom: 10px;"><b>Nombre de calle: </b>${ticketResponse.payer.address.street_name}</li>
                                <li style="margin-bottom: 10px;"><b>Número de domicilio: </b>${ticketResponse.payer.address.street_number}</li>
                                <li style="margin-bottom: 10px;"><b>Envío: </b>Si</li>
                                
                                ${ticketResponse.payer.address.apartment !== 'false'? `
                                    <li style="margin-bottom: 10px;"><b>Número de departamento: </b>${ticketResponse.payer.address.apartment}</li>
                                `
                                :
                                ``}
                                <li style="margin-bottom: 10px;"><b>C.P.: </b>${ticketResponse.payer.address.zip_code}</li>
                                
                                ${ticketResponse.payer.phone && `
                                    <li style="margin-bottom: 10px;"><b>Número de teléfono: </b><a href="https://api.whatsapp.com/send?phone=${clientPhoneReplaced}&text=¡Hola%20${ticketResponse.payer.name}!" target="_blank">${ticketResponse.payer.phone.area_code} ${ticketResponse.payer.phone.number}</a></li>
                                `}
                                
                            ` : `
                                <li style="margin-bottom: 10px;"><b>Envío: </b>No</li>

                                ${ticketResponse.payer.phone && `
                                    <li style="margin-bottom: 10px;"><b>Número de teléfono: </b><a href="https://api.whatsapp.com/send?phone=${clientPhoneReplaced}&text=¡Hola%20${ticketResponse.payer.name}!" target="_blank">${ticketResponse.payer.phone.area_code} ${ticketResponse.payer.phone.number}</a></li>
                                `}
                            `}
                        </ul>
                    </div>
            
                    <div>
                        <h2 style="color: #555;">Productos</h2>
                        ${ticketResponse.products.map(product => `
                            <div style="background-color: #ebebeb; margin: 10px 0; padding: 10px; text-align: center;">
                                <ul style="list-style: none; padding: 0;">
                                    <li style="margin-bottom: 10px;"><b>Nombre: </b>${product.title}</li>
                                    <li style="margin-bottom: 10px;"><b>ID: </b>${product.id}</li>
                                    <li style="margin-bottom: 10px;"><b>Categoría: </b>${product.category_id}</li>
                                    <li style="margin-bottom: 10px;"><b>Cantidad: </b>${product.quantity} unidades</li>
                                    <li style="margin-bottom: 10px;"><b>Precio: </b>$${product.unit_price}</li>
                                    <li style="margin-bottom: 10px;"><b>Subtotal: </b>$${product.unit_price * product.quantity}</li>
                                </ul>
                            </div>
                        `).join('')}
                    </div>
            
                    ${ticketResponse.shipment !== false && ticketResponse.payer.address.aditional_info !== 'false' ? `
                        <div style="margin-top: 20px;">
                            <h2 style="color: #555;">Información adicional de envío</h2>
                            <p>${ticketResponse.payer.address.aditional_info}</p>
                        </div>
                    `
                    :
                    ``}
            
                    <div style="text-align:center; margin-top: 20px;">
                        <p style="font-size: 1.5em"><b>Precio final: </b>$${ticketResponse.total_amount}</p>
                        ${ticketResponse.shipment !== false ? 
                            `<span style="display: inline-block; color: #333; text-align: center; width: 100%;">(El precio final no incluye envío)</span>`
                        :
                        ''}
                    </div>
                </div>
        
            </body>
        
            `
        }).catch(err=>console.log(err));
        await transporter.sendMail({
            to: ticketResponse.payer.email,
            subject: 'Orden de compra',
            html:`
            <body style="background-color: #f2f2f2; margin: 0; padding: 0; font-family: 'Roboto';">

                <div style="width: 80%; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h1 style="color: #333; text-align: center;">Resumen de tu compra</h1>
                    <span style="display: inline-block; color: #333; text-align: center; width: 100%;">Código de operación: ${paymentData.data.id}</span>
            
                    <div>
                        <h2 style="color: #555;">Contacto</h2>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 10px;"><b>Soporte: </b><a href="https://api.whatsapp.com/send?phone=+5491136456177&text=¡Hola!,%20soy%20${ticketResponse.payer.name}%20${ticketResponse.payer.last_name}" target="_blank">+54 9 11 3645-6177</a></li>
                            <span style="color: #333; width: 100%;">Nos vamos a contactar con vos para acordar la entrega del producto</span>
                        </ul>
                        <h2 style="color: #555;">Detalles de la compra</h2>
                        <ul style="list-style: none; padding: 0;">
                            ${ticketResponse.shipment !== false ? `

                                <li style="margin-bottom: 10px;"><b>Opción de retiro: </b>Envío a domicilio</li>
                                <li style="margin-bottom: 10px;"><b>Nombre de calle: </b>${ticketResponse.payer.address.street_name}</li>
                                <li style="margin-bottom: 10px;"><b>Número de domicilio: </b>${ticketResponse.payer.address.street_number}</li>
                                
                                ${ticketResponse.payer.address.apartment !== 'false'? `
                                    <li style="margin-bottom: 10px;"><b>Número de departamento: </b>${ticketResponse.payer.address.apartment}</li>
                                `
                                :
                                ``}
                                <li style="margin-bottom: 10px;"><b>C.P.: </b>${ticketResponse.payer.address.zip_code}</li>

                                
                            ` : `
                                <li style="margin-bottom: 10px;"><b>Opción de retiro: </b>Retiro en local</li>
                                <li style="margin-bottom: 10px;"><b>Dirección del local: </b>Calle falsa 1234</li>
                                <li style="margin-bottom: 10px;"><b>Horario de atención: </b>Lunes a viernes de 9hs a 13hs</li>
                                <span style="color: #333; width: 100%;"><b>¡Muy importante!</b> presentarse con la orden de compra</span>
                            `}
                        </ul>
                    </div>
            
                    <div>
                        <h2 style="color: #555;">Los productos que compraste</h2>
                        ${ticketResponse.products.map(product => `
                            <div style="background-color: #ebebeb; margin: 10px 0; padding: 10px; text-align: center;">
                                <ul style="list-style: none; padding: 0;">
                                    <li style="margin-bottom: 10px;"><b>Nombre: </b>${product.title}</li>
                                    <li style="margin-bottom: 10px;"><b>ID: </b>${product.id}</li>
                                    <li style="margin-bottom: 10px;"><b>Categoría: </b>${product.category_id}</li>
                                    <li style="margin-bottom: 10px;"><b>Cantidad: </b>${product.quantity} unidades</li>
                                    <li style="margin-bottom: 10px;"><b>Precio: </b>$${product.unit_price}</li>
                                    <li style="margin-bottom: 10px;"><b>Subtotal: </b>$${product.unit_price * product.quantity}</li>
                                </ul>
                            </div>
                        `).join('')}
                    </div>
            
                    ${ticketResponse.shipment !== false && ticketResponse.payer.address.aditional_info !== 'false' ? `
                        <div style="margin-top: 20px;">
                            <h2 style="color: #555;">Información adicional de envío</h2>
                            <p>${ticketResponse.payer.address.aditional_info}</p>
                        </div>
                    `
                    :
                    ``}
            
                    <div style="text-align:center; margin-top: 20px;">
                        <p style="font-size: 1.5em"><b>Precio final: </b>$${ticketResponse.total_amount}</p>
                        ${ticketResponse.shipment !== false ? 
                            `<span style="display: inline-block; color: #333; text-align: center; width: 100%;">(El precio final no incluye envío)</span>`
                        :
                        ''}
                    </div>
                </div>
        
            </body>
        
            `
        }).catch(err=>console.log(err));

        ticketResponse.products.map(async product=>{
            await productsService.updateOne(
                {_id:product.id},
                {$inc: { stock: - product.quantity }}
            )
            const productUpdated = await productsService.getProductById(product.id)
            if(productUpdated.stock <= 0){
                await productsService.updateOne(
                    {_id:product.id},
                    {$set: { isAvailable: false }}
                )
            }
        })

        return res.status(200).json({payload: 'Se envió el ticket satisfactoriamente'})
    }
    
    if (orderState && orderState.data.status === 'rejected' ) {
        await ticketService.deleteTicket({code: paymentData.data.external_reference});
        return res.status(200).json({payload: 'Se canceló la compra del ticket'})
    }
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



        