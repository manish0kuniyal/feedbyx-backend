import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true // Free, Pro, Business
  },

  monthlyPrice: {
    type: Number,
    required: true // in INR
  },

  yearlyPrice: {
    type: Number,
    required: true 
  },

  features: {
    // Form Limits
    maxForms: { type: Number, default: 1 },
    maxResponsesPerForm: { type: Number, default: 100 },

    // Analytics
    analyticsBasic: { type: Boolean, default: true },
    analyticsLocation: { type: Boolean, default: false },
    analyticsAdvanced: { type: Boolean, default: false },

    // AI
    aiEnabled: { type: Boolean, default: false },
    aiMonthlyLimit: { type: Number, default: 0 },

    // Export
    exportCSV: { type: Boolean, default: false }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Plan", planSchema);
