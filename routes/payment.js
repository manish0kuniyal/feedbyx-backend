import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

import Plan from "../models/plan.js";
import Subscription from "../models/subscriptions.js";
import Payment from "../models/payment.js";

dotenv.config();

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
router.get("/seed", async (req, res) => {
  try {
    let freePlan = await Plan.findOne({ name: "Free" });
    let proPlan = await Plan.findOne({ name: "Pro" });

    if (!freePlan) {
      freePlan = await Plan.create({
        name: "Free",
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: {
          maxForms: 2,
          maxResponsesPerForm: 20,
          analyticsBasic: true,
          analyticsLocation: false,
          analyticsAdvanced: false,
          aiEnabled: false,
          aiMonthlyLimit: 0,
          exportCSV: false,
        },
      });
    }

    if (!proPlan) {
      proPlan = await Plan.create({
        name: "Pro",
        monthlyPrice: 5,
        yearlyPrice: 50,
        features: {
          maxForms: 1000,
          maxResponsesPerForm: 100000,
          analyticsBasic: true,
          analyticsLocation: true,
          analyticsAdvanced: true,
          aiEnabled: true,
          aiMonthlyLimit: 1000,
          exportCSV: true,
        },
      });
    }

    const plans = await Plan.find();

    res.json({
      message: "Plans seeded successfully",
      plans
    });

  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ error: "Seed failed" });
  }
});
/* ===============================
   CREATE ORDER
=============================== */

router.post("/create-order", async (req, res) => {
  try {
    const { planId, billingCycle, userId } = req.body;

    if (!planId || !billingCycle || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const selectedPlan = await Plan.findById(planId);
    if (!selectedPlan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    let amount =
      billingCycle === "monthly"
        ? selectedPlan.monthlyPrice
        : selectedPlan.yearlyPrice;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    await Payment.create({
      userId,
      planId,
      billingCycle,
      razorpayOrderId: order.id,
      amount: amount * 100,
      status: "created",
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

/* ===============================
   VERIFY PAYMENT
=============================== */

router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false });
    }

    const paymentDoc = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!paymentDoc) {
      return res.status(404).json({ success: false });
    }

    paymentDoc.status = "captured";
    paymentDoc.razorpayPaymentId = razorpay_payment_id;
    paymentDoc.razorpaySignature = razorpay_signature;
    await paymentDoc.save();

    const now = new Date();
    let endDate = new Date();

    if (paymentDoc.billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = await Subscription.findOneAndUpdate(
      { userId: paymentDoc.userId },
      {
        userId: paymentDoc.userId,
        planId: paymentDoc.planId,
        billingCycle: paymentDoc.billingCycle,
        status: "active",
        startDate: now,
        endDate,
      },
      { upsert: true, new: true }
    );

    paymentDoc.subscriptionId = subscription._id;
    await paymentDoc.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ===============================
   DEBUG ROUTE
=============================== */

router.get("/debug", async (req, res) => {
  const plans = await Plan.find();
  const payments = await Payment.find();
  const subs = await Subscription.find();
  res.json({ plans, payments, subs });
});

export default router;
