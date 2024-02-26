//@ts-check
const mongoose = require("mongoose");

const TIME_SHEET_SCHEMA = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TimesheetTemplate",
        required: true,
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
            total_hours: Number,
            sick: Number,
            overtime: Number,
            planned_leave: Number,
            remarks: String
        }
    ],
    status: {
      type: String,
      default: 'draft'
    },
    comments:[
        {
            user: String,
            timestamp: Date,
            text: String
        }
    ],
    history:[
        {
            user: String,
            status: String,
            timestamp:Date
        }
    ],
    created_by: String,
    email: String,
    approver: String,
    reviewer: String,
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }    
  }
);

const timeSheetsCollectionName = "timesheets";

const Timesheets = mongoose.model("TimeSheets", TIME_SHEET_SCHEMA, timeSheetsCollectionName);
module.exports = Timesheets;
module.exports.timeSheetsCollectionName = timeSheetsCollectionName;