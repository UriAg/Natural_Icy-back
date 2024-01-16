import ticketModel from './models/ticket.model.js';

class MongoDaoTicket{
    constructor(){}

    async getAll(filter={}){
        return await ticketModel.find(filter).lean();
    }

    async getOne(filter){
        return await ticketModel.findOne(filter).lean();
    }

    async create(ticket){
        return await ticketModel.create(ticket);
    }

    async updateTicket(filter, update){
        return await ticketModel.updateOne(filter, update);
    }

    async delete(id){
        return await ticketModel.deleteOne({_id:id});
    }

    async deleteMany(filter){
        return await ticketModel.deleteMany(filter);
    }

}

export default MongoDaoTicket;