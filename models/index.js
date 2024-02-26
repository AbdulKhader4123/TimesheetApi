// @ts-check

const mongoose = require('mongoose');

const db = {};
db.mongoose = mongoose;

db.timesheetTemplate = require('./timesheet-template.model');
db.timesheet = require('./timesheet.model');


module.exports = db;
