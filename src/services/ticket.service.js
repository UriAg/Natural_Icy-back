import MongoDaoTicket from "../dao/MongoDb/mongoDaoTicket.js"

class TicketService{
    constructor(dao){
        this.dao=new dao()
    }

    async getAllTickets(filter){
        return await this.dao.getAll(filter)
    }

    async getTicket(filter){
        return await this.dao.getOne(filter)
    }

    async createTicket(ticket){
        return await this.dao.create(ticket)
    }

    async updateTicket(filter, update){
        return await this.dao.updateTicket(filter, update)
    }

    async deleteTicket(filter){
        return await this.dao.delete(filter)
    }

    async deleteManyTickets(filter){
        return await this.dao.deleteMany(filter)
    }

}

const ticketService = new TicketService(MongoDaoTicket)

export default ticketService  