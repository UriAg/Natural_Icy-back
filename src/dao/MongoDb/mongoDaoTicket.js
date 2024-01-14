import ticketModel from './models/ticket.model.js';

class MongoDaoTicket{
    constructor(){}

    async getOne(filter){
        return await ticketModel.findOne(filter).lean();
    }

    async create(ticket){
        return await ticketModel.create(ticket);
    }

    async delete(ticket){
        return await ticketModel.deleteOne(ticket);
    }

}

export default MongoDaoTicket;