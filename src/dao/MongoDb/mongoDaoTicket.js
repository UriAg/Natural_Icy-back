import ticketModel from './models/ticket.model.js';

class MongoDaoTicket{
    constructor(){}

    async get(filter={}){
        return await ticketModel.find(filter).lean();
    }

    async create(ticket){
        return await ticketModel.create(ticket);
    }

}

export default MongoDaoTicket;