import mongoose from "mongoose";

const cartModel = mongoose.model('carts', new mongoose.Schema({
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
            quantity: Number,
        },
    ],
}));

export default cartModel;