const express = require("express");
const router = express.Router();

const controller = require("../controllers/timesheet");

module.exports = function () {
  router.get("/approvals", controller.getTimeSheetsForApprovals);

  router.get("/", controller.getTimeSheets);

  router.get("/:id", controller.getTimeSheet);

  router.post("/", controller.postTimeSheet);

  router.put("/approvals/:id", controller.approveTimeSheet);


  router.put("/:id", controller.updateTimeSheet);

  router.delete("/:id", controller.deleteTimeSheet);
  

  return router;
};
