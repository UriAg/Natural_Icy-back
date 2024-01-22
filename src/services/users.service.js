import MongoDaoUsers from "../dao/MongoDb/mongoDaoUsers.js";
import { __dirname } from "../utils.js";
class UserService{
    constructor(dao){
        this.dao=new dao();
    }

    async getUsers(){
        return await this.dao.get();
    }

    async getUserByEmail(email){
        return await this.dao.getOne({email: email});
    }

    async getUserById(id){
        return await this.dao.getOne({_id: id});
    }

    async getUserByFilter(filter){
        return await this.dao.getOne(filter);
    }

    async updateUser(filter, update){
        return await this.dao.updateOne(filter, update);
    }

    async updateManyUsers(filter, update){
        return await this.dao.updateMany(filter, update);
    }

    async createUser(user){
        return await this.dao.create(user);
    }

}

const userService = new UserService(MongoDaoUsers);

export default userService;