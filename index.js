
import express from 'express'
import serverless from 'serverless-http'
import cors from 'cors'
import authRouter from "./routes/auth.js"
import feedbackRouter from "./routes/feedback.js";
import formsRouter from "./routes/form.js";
import usersRouter from "./routes/user.js";
import cookieParser from 'cookie-parser';
// import paymentRoutes from  "./routes/payment.js"
import connectDB from "./utils/dbconnect.js"

import dotenv from "dotenv";

// import chatRoute from "./routes/chat.js"

dotenv.config();

let dbInitPromise;

function initDB() {
  if (!dbInitPromise) {
    dbInitPromise = connectDB();
  }
  return dbInitPromise;
}

initDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://dev.feedbyx.com",
  "https://main.d3jt2wtqx08knj.amplifyapp.com",
  "https://api.feedbyx.com"  // Add this
];
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Add this error handler BEFORE your 404 handler
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.status(err.status || 500).json({ message: err.message });
});
// app.use(
//   cors({
//     origin: ["http://localhost:3000","https://api.feedbyx.com", "http://localhost:5173","https://dev.feedbyx.com","https://main.d3jt2wtqx08knj.amplifyapp.com"],
//     credentials: true,
//   methods: ["GET","HEAD","PUT","PATCH","POST","DELETE","OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

app.use((req, res, next) => {
  console.log("---- INCOMING REQUEST ----");
  console.log("method:", req.method);
  console.log("url:", req.originalUrl);
  console.log("origin:", req.headers.origin);
  console.log("cookies:", req.headers.cookie || "NO COOKIES");
  console.log("--------------------------");
  next();
});



const port=5000

// app.use(async (req, res, next) => {
//   try {
//       await connectDB();
//     next();
//   } catch (err) {
//     console.error("DB connection failed during request", err);
//     res.status(503).json({ message: "Database unavailable" });
//   }
// });


const STAGE = process.env.STAGE || 'prod';
app.use((req, res, next) => {
  if (req.url === `/${STAGE}`) {
    req.url = '/';
  } else if (req.url.startsWith(`/${STAGE}/`)) {
    req.url = req.url.replace(new RegExp('^/' + STAGE), '') || '/';
  }
  next();
});

app.get('/', (req, res) => {
  res.json({ message: '...Express live ✔🔥 ' });
});



app.use("/api/auth", authRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/forms", formsRouter);
app.use("/api/users", usersRouter);
// app.use("/api",chatRoute)
// app.use("/api/payment", paymentRoutes);



app.get('/_debug', (req, res) => {
  res.json({
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url,
    method: req.method,
    headers: req.headers
  });
});



app.use((req, res) => {
  res.status(404).json({
    message: 'Express 404',
    debug: { path: req.path, originalUrl: req.originalUrl, url: req.url, method: req.method }
  });
});

export const handler = serverless(app);

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () =>
    console.log(`Local server on http://localhost:${port}`)
  );
}
