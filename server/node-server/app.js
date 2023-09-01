import express from "express";
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import cors from "cors";
import alertRoute from "./routes/alert.js";
import homepage from './routes/homepage.js';

const port = 8000;
const app = express();
dotenv.config();

//middlewares
app.use(cors())
app.use(cookieParser())
app.use(express.json());

app.use(homepage, alertRoute)

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