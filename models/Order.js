import mongoose from "mongoose";

const orderSchema = new  mongoose.Schema({
    userId:{type:String , required:true,ref:'user'},
    items:[{
        product :{type : String , required:true,ref:'product'},
        quantity :{type : Number , required : true}
    }],
    amount : {type:Number , required : true},
    address : {type:String ,required :true,ref:'address'}, // ref should be the name you write in model not mongodb
    status:{type :String ,required:true,default:'Order Placed'},
    date : {type : Number,required:true}
})


orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ date: -1 });
orderSchema.index({ "items.product": 1 });


const Order = mongoose.models.order || mongoose.model('order',orderSchema);
export default Order;