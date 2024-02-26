//@ts-check
const mongoose = require("mongoose");

const TIME_SHEET_TEMPLATE_SCHEMA = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    days: [
        {
            day: String,
            date: String,
            type: {
              type: String
            },
            normal_worked_hours: Number,
            total_hours: Number   
        }
    ]
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }    
  }
);

const timeSheetTemplatesCollectionName = "timesheetTemplates";

const TimesheetTemplate = mongoose.model("TimeSheetTemplate", TIME_SHEET_TEMPLATE_SCHEMA, timeSheetTemplatesCollectionName);
module.exports = TimesheetTemplate;
module.exports.timeSheetTemplatesCollectionName = timeSheetTemplatesCollectionName;