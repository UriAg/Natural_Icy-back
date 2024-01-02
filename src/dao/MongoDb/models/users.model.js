import mongoose from "mongoose";

const usersModel = mongoose.model('users', new mongoose.Schema({
    name:String,
    last_name:String,
    email:{
        type:String,
        unique:true
    },
    role: {
        type:String,
        default:'USER'
    },
    password:String,
    cart:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'carts'
    },
    favorites:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'favorites'
    },
}, {
    timestamps:true
}))

export default usersModel; 