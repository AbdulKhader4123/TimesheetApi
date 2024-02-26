const express = require("express");
const router = express.Router();

const controller = require("../controllers/timesheet-template");

module.exports = function () {
  router.get("/", controller.getTimeSheetTemplates);

  router.get("/:id", controller.getTimeSheetTemplate);

  router.post("/", controller.postTimeSheetTemplate);

  router.put("/:id", controller.updateTimeSheetTemplate);

  router.delete("/:id", controller.deleteTimeSheetTemplate);
  
  return router;
};
