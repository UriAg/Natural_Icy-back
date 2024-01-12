import mongoose from 'mongoose'

const ticketModel = mongoose.model('tickets', new mongoose.Schema({
    products: [
        {
            id: mongoose.Schema.Types.ObjectId,
            title: String,
            currency_id: String,
            description: String,
            category_id: String,
            quantity: Number,
            unit_price: Number
        },
    ],
    total_amount: Number,
    payer: {
        name: String,
        last_name: String,
        email: String,
        address: {
            street_name: String,
            street_number: Number,
            apartment: String,
            aditional_info: String,
            zip_code: Number
        },
        phone:{
            area_code: Number,
            number: Number
        }
    },
    shipment: Boolean,
    code: String
},{timestamps:true}))

export default ticketModel;