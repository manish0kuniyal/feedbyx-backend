import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "User"
  },

  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true
  },

  billingCycle: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true
  },

  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active"
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Subscription", subscriptionSchema);
