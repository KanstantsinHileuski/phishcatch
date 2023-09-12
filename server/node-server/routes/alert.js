import express from "express";
import { alert } from "../controllers/alert.js";

const alertRoute = express.Router();

alertRoute.post("/alert", alert)

export default alertRoute