import Subscription from "../models/subscriptions.js";
import Plan from "../models/plan.js";

export async function getUserPlan(userId) {
  try {
    const now = new Date();

    const activeSub = await Subscription.findOne({
      userId,
      status: "active",
      endDate: { $gt: now }
    }).populate("planId");

    // If user has active paid plan
    if (activeSub && activeSub.planId) {
      return activeSub.planId;
    }

    // Otherwise return Free plan
    const freePlan = await Plan.findOne({ name: "Free" });

    if (!freePlan) {
      throw new Error("Free plan not found in database");
    }

    return freePlan;

  } catch (error) {
    console.error("getUserPlan error:", error);
    throw error;
  }
}