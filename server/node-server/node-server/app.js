import express from "express";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import cors from "cors";
import alertRoute from "./routes/alert.js";
import homepage from './routes/homepage.js';

const port = 8000;
const app = express();
dotenv.config();

const corsOptions = {
  origin: 'https://phishjail-api-gateway-82gpumlr.ew.gateway.dev',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 201,
  allowedHeaders: 'Content-Type,Authorization',
};

//middlewares
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json());

app.use(homepage, alertRoute)

app.get('/status', (req, res) => {
  res.status(201).json({ status: "healthy" });
});

app.use((err, req, res) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});