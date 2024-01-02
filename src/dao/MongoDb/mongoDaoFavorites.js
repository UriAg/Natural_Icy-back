import favoritesModel from './models/favorites.model.js'

class MongoDaoFavorites{
    constructor(){

    }

    async get(filter){
        return await favoritesModel.find(filter).lean();
    }

    async getOne(filter){
        return await favoritesModel.findOne(filter).lean();
    }

    async create(){
        return await favoritesModel.create({products:[]});
    }

    async updateOne(filter, update){
        return await favoritesModel.updateOne(filter, update);
    }

    async updateMany(filter, update){
        return await favoritesModel.updateMany(filter, update);
    }

    async paginate(filter={}, options={}){
        return await favoritesModel.paginate(filter, options);
    }

    async populate(id){
        return await favoritesModel
          .findOne({ _id: id })
          .populate('products.product')
          .lean()
    }
}

export default MongoDaoFavorites;