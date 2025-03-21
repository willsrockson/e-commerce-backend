import express from "express";
import {
  approveUser,
  declineID,
  getIdVerificationInfo,
  getUnverifiedUser,
  getUserVerificationRequest,
  getVerifiedStore,
} from "../../controllers/ADMIN/verificationController.js";
import { workspaceAuthMiddleware } from "../../middleware/workspaceMiddleware.js";
const router = express.Router();

router.get("/unverified", getUnverifiedUser);
router.get("/verified", getVerifiedStore);
router.get("/verificationRequests", getUserVerificationRequest);
router.get("/getSubmittedIdInformation/:id", getIdVerificationInfo);
router.post("/approveUser/:id", workspaceAuthMiddleware ,approveUser);
router.post("/rejectUser/:id", workspaceAuthMiddleware , declineID);

export default router;
