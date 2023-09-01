import express from "express";
import { homepage } from "../controllers/homepage.js";

const home = express.Router();

home.get("/", homepage)

export default home