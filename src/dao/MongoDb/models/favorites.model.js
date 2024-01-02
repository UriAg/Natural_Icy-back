import mongoose from "mongoose";

const favoritesModel = mongoose.model('favorites', new mongoose.Schema({
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
        },
    ],
}));

export default favoritesModel;