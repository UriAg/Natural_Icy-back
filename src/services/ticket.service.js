import MongoDaoTicket from "../dao/MongoDb/mongoDaoTicket.js"

class TicketService{
    constructor(dao){
        this.dao=new dao()
    }

    async getTickets(filter){
        return await this.dao.get(filter)
    }

    async createTicket(ticket){
        return await this.dao.create(ticket)
    }

}

const ticketService = new TicketService(MongoDaoTicket)

export default ticketService  