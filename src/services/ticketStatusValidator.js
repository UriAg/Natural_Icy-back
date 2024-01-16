import ticketService from "./ticket.service.js";
import userService from "./users.service.js";

export async function ticketExpirationValidation(){
    try {
        
        const tickets = await ticketService.getAllTickets();
        
        if(tickets.length){
            const expiredTicketsIds = [];

            for(let ticket of tickets){
                if(!ticket.isPaid){
                    if(expiredTicket(ticket.createdAt)){
                        expiredTicketsIds.push(ticket._id)
                    }
                }
            }
            
            if(expiredTicketsIds.length >= 1){
                const ticketMatchingSearch = { 'purchases.payment_id': { $in: expiredTicketsIds } };
                const deleteMatchingTickets = { $pull: { purchases: { payment_id: { $in: expiredTicketsIds } } } };
                const ticketDeletingCriterion = { _id: { $in: expiredTicketsIds } };

                await ticketService.deleteManyTickets(ticketDeletingCriterion);
                await userService.updateManyUsers(ticketMatchingSearch, deleteMatchingTickets);
            }

        }

    } catch (error) {
        console.log(error)
        ticketExpirationValidation()
    }
}

function expiredTicket(ticketCreationDate) {
    const weekInMiliseconds = 7 * 24 * 60 * 60 * 1000;
    const actualDate = new Date();

    const difference = actualDate - ticketCreationDate;

    return difference >= weekInMiliseconds;
}