import mongoose from 'mongoose'
import usersModel from './models/users.model.js'
import config from '../../config/config.js'

const connect = async() =>{
    try {
        await mongoose.connect(config.MONGO_URL,{dbName:config.DB_NAME})
        console.log('Connected to database')
    } catch (error) {
        console.log('Connecting error with database', error)
    }
  }
  
connect();

class MongoDaoUsers{
    constructor(){

    }

    async get(filter={}){
        return await usersModel.find(filter).lean();
    }

    async getOne(filter={}){
        return await usersModel.findOne(filter).lean();
    }

    async updateOne(filter, update){
        return await usersModel.updateOne(filter, update).lean();
    }

    async updateMany(filter, update){
        return await usersModel.updateMany(filter, update).lean();
    }

    async create(user){
        return await usersModel.create(user);
    }
}

export default MongoDaoUsers;