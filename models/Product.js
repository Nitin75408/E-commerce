import mongoose from "mongoose";


const ProductSchema = new mongoose.Schema({
    userId : {type:String , required : true,ref:'user'},
      name :{type : String , required : true},
    description :{type : String , required : true},
     price :{type : Number , required : true},
    offerPrice:{type : Number , required : true},
    image :{type : Array , required : true},
    category :{type : String , required : true},
    date :{type : Number ,required:true},
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
})


ProductSchema.index({ userId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ date: -1 });



const Product = mongoose.models.product || mongoose.model('product',ProductSchema)
export default Product;