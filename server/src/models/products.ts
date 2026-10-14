import mongoose, {Schema} from "mongoose";

const productSchema = new Schema ( {
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required:true,
        maxlength: [100, "Product name cannot exceed more than 100 characters"]
    },
    price : {
        type: Number,
        required: true,
        maxlength: [20 , "Price cannot be procedded beyond 20 decimals"]
    },
    sku: {
        type: Number, 
        required: true,
        minlength:[10, "SKU cannot be below 10 characters"],
        maxlength: [50 , "SKU cannot exceed more than 50 characters"]
    },
    quantity:{
        type: Number,
        minlength: [1 , "Product quantity is zero / empty"]
    },
    category_id:{
        type: Schema.Types.ObjectId,
        ref:"Category",
        required:true
    }
})

export const Product = mongoose.model("Product", productSchema)