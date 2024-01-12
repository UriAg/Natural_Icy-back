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
}, {
    timestamps:true
}))

export default usersModel; 