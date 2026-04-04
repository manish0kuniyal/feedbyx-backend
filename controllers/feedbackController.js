import Feedback from "../models/feedback.js";
import Form from "../models/form.js";
import axios from "axios";
import { getUserPlan } from "../utils/getUserPlan.js";

async function resolveIpToLabel(ip) {
  if (!ip) return null;
  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`;
    const r = await axios.get(url, { timeout: 4000 });
    const d = r.data;
    if (d?.status === "success") {
      const parts = [d.city, d.regionName, d.country].filter(Boolean);
      return parts.join(", ") || "Unknown";
    }
  } catch {}
  return "Unknown";
}

export const saveFeedback = async (req, res) => {
  try {
    const { formId, formName, responses, metadata } = req.body;
    if (!formId || !formName || !responses) {
      return res.status(400).json({ success: false, error: "formId, formName and responses are required" });
    }

    const ip =
      (req.headers["x-forwarded-for"] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)[0] ||
      req.socket?.remoteAddress ||
      req.ip ||
      "";

    const form = await Form.findOne({ customId: formId });
    if (!form) return res.status(404).json({ success: false, error: "Form not found" });
    if (form.paused) return res.status(403).json({ success: false, error: "Form is paused" });

    const plan = await getUserPlan(form.userId);

    if (form.feedbackCount >= plan.features.maxResponsesPerForm) {
      return res.status(403).json({
        success: false,
        error: "Response limit reached. Upgrade your plan.",
      });
    }

    const safeMeta = {
      utm: metadata?.utm || {},
      referrer: metadata?.referrer || "",
      pageUrl: metadata?.pageUrl || "",
      userAgent: metadata?.userAgent || "",
      locationLabel: metadata?.locationLabel || "",
      clientTs: metadata?.clientTs ? new Date(metadata.clientTs) : undefined,
    };

    if (!safeMeta.locationLabel && ip) {
      safeMeta.locationLabel = await resolveIpToLabel(ip);
    }

    const timeOnPage = Number(metadata?.timeOnPage || 0);

    const newFeedback = await Feedback.create({
      formId,
      formName,
      responses,
      metadata: safeMeta,
      timeOnPage,
      clientIp: ip,
    });

    await Form.updateOne(
      { _id: form._id },
      { $inc: { feedbackCount: 1, totalTimeSpent: timeOnPage } }
    );

    return res.status(201).json({ success: true, data: newFeedback });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
export const getFeedbacks = async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.json({ feedbacksByForm: {} });

    const plan = await getUserPlan(uid);

    const userForms = await Form.find({ userId: uid }).lean();
    const formIds = userForms.map((f) => f.customId);

    const feedbacks = await Feedback.find({
      formId: { $in: formIds },
    }).lean();

    const feedbacksByForm = {};

    feedbacks.forEach((fb) => {
      const id = fb.formId.toString();
      if (!feedbacksByForm[id]) feedbacksByForm[id] = [];
      feedbacksByForm[id].push(fb);
    });

    return res.json({
      success: true,
      feedbacksByForm,
      featureAccess: {
        analyticsLocation: plan.features.analyticsLocation,
        analyticsAdvanced: plan.features.analyticsAdvanced,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};