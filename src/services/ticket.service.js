import MongoDaoTicket from "../dao/MongoDb/mongoDaoTicket.js"

class TicketService{
    constructor(dao){
        this.dao=new dao()
    }

    async getTicket(filter){
        return await this.dao.getOne(filter)
    }

    async createTicket(ticket){
        return await this.dao.create(ticket)
    }

    async deleteTicket(ticket){
        return await this.dao.delete(ticket)
    }

}

const ticketService = new TicketService(MongoDaoTicket)

export default ticketService  