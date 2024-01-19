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
    purchases:[
        {
            payment_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'tickets' }
        },
    ],
    password:String,
    token:{
        info:String,
        timestamp:Number
    }
}, {
    timestamps:true
}))

export default usersModel; 