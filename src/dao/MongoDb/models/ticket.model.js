import mongoose from 'mongoose'

const ticketModel = mongoose.model('tickets', new mongoose.Schema({
    products: [
        {
            id: mongoose.Schema.Types.ObjectId,
            title: String,
            code: String,
            price: Number,
            quantity: Number,
            category: String
        },
    ],
    amount: Number,
    purchaser: String,
    code: String
},{timestamps:true}))

export default ticketModel;