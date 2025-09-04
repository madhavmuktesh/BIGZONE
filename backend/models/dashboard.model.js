import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
    name:{type:mongoose.Schema.Types.ObjectId, ref:'User'}
});

export const Dashboard = mongoose.model('Dashboard',dashboardSchema);