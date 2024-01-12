// import MongoDaoCart from "../dao/MongoDb/mongoDaoCart.js"

// class CartService{
//     constructor(dao){
//         this.dao=new dao()
//     }

//     async getOneCart(filter){
//         return await this.dao.getOne(filter)
//     }

//     async getAllCarts(filter){
//         return await this.dao.get(filter)
//     }

//     async getCartById(id){
//         return await this.dao.getOne({_id:id})
//     }

//     async populateCart(id, populatePath){
//         return await this.dao.populate(id, populatePath)
//     }

//     async createCart(){
//         return await this.dao.create({})
//     }

//     async updateCart(filter, update){
//         return await this.dao.updateOne(filter, update)
//     }

//     async updateCarts(filter, update){
//         return await this.dao.updateMany(filter, update)
//     }

// }

// const cartService = new CartService(MongoDaoCart)

// export default cartService  