import express from "express";
import { alert } from "../controllers/alert.js";

const alertRoute = express.Router();

alertRoute.get("/alert", alert)

export default alertRoute