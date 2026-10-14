import mongoose, {Schema} from "mongoose";

const categorySchema = new Schema({
    id: {
        type:Number,
        required:true
    },
    name: {
        type:Number,
        required: true,
        minlength:[3 , "Name must contain at least  3 characters"]
        maxlength:[15, "Name cannot exceed more than 15 characters"]
    }
})

export const Category = mongoose.model("Category", categorySchema)