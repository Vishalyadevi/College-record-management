import express from "express";
import  { getStaffByUserId} from "../controllers/staffController.js";

const router = express.Router();

router.get("/get-staff-by-user", getStaffByUserId);


export default router;