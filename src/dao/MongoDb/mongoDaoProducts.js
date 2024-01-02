import productsModel from './models/products.model.js'

class MongoDaoProducts{
    constructor(){

    }

    async get(filter={}){
        return await productsModel.find(filter).lean();
    }

    async getOne(filter={}){
        return await productsModel.findOne(filter).lean();
    }

    async updateOne(filter, update){
        return await productsModel.updateOne(filter, update).lean();
    }

    async create(product){
        return await productsModel.create(product);
    }

    async createMany(products){
        return await productsModel.insertMany(products)
    }

    async deleteOne(filter={}){
        return await productsModel.deleteOne(filter);
    }

    async paginate(filter={}, options={}){
        return await productsModel.paginate(filter, options);
    }
}

export default MongoDaoProducts;