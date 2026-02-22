import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true
  },

  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription"
  },

  billingCycle: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true
  },

  razorpayOrderId: {
    type: String,
    required: true
  },

  razorpayPaymentId: {
    type: String
  },

  razorpaySignature: {
    type: String
  },

  amount: {
    type: Number, // store in paise
    required: true
  },

  currency: {
    type: String,
    default: "INR"
  },

  status: {
    type: String,
    enum: ["created", "captured", "failed"],
    default: "created"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Payment", paymentSchema);
