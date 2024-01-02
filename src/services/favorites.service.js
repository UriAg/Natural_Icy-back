import MongoDaoFavorites from "../dao/MongoDb/mongoDaoFavorites.js"

class FavoritesService{
    constructor(dao){
        this.dao=new dao()
    }

    async getFavorites(filter){
        return await this.dao.getOne(filter)
    }

    async getAllFavorites(filter){
        return await this.dao.get(filter)
    }

    async getFavoritesById(id){
        return await this.dao.getOne({_id:id})
    }

    async populateFavorites(id, populatePath){
        return await this.dao.populate(id, populatePath)
    }

    async createFavorites(){
        return await this.dao.create({})
    }

    async updateFavorite(filter, update){
        return await this.dao.updateOne(filter, update)
    }

    async updateFavorites(filter, update){
        return await this.dao.updateMany(filter, update)
    }
    
    // async updateCarts(filter, update){
    //     return await this.dao.updateMany(filter, update)
    // }

}

const favoritesService = new FavoritesService(MongoDaoFavorites)

export default favoritesService  