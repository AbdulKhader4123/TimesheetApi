// @ts-check

const db = require("../models");
const Timesheet = db.timesheet;
const TimesheetTemplate = db.timesheetTemplate;

const { hasRequiredDelegatedPermissions } = require("../auth/permissionUtils");

const authConfig = require("../configs/authConfig");

exports.getTimeSheet = async (req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.read
    )
  ) {
    try {
      /**
       * The 'oid' (object id) is the only claim that should be used to uniquely identify
       * a user in an Azure AD tenant. The token might have one or more of the following claim,
       * that might seem like a unique identifier, but is not and should not be used as such,
       * especially for systems which act as system of record (SOR):
       *
       * - upn (user principal name): might be unique amongst the active set of users in a tenant but
       * tend to get reassigned to new employees as employees leave the organization and
       * others take their place or might change to reflect a personal change like marriage.
       *
       * - email: might be unique amongst the active set of users in a tenant but tend to get
       * reassigned to new employees as employees leave the organization and others take their place.
       */
      const owner = req.authInfo["oid"];
      const user_email = req.authInfo["preferred_username"];
      const timesheet = await Timesheet.findOne({_id: req.params.id})
      if(!timesheet){
        res.status(404).send({
          "status": "error",
          "message": "Timesheet not found",
          });
      }
      const isApproverReviewer = user_email === timesheet?.approver || user_email === timesheet?.reviewer;
      if(timesheet?.created_by !== owner && !isApproverReviewer){
        return res.status(403).send({
          "status": "error",
          "message": "Access to Timesheet Forbidden",
        });
      }

      res.status(200).send(timesheet);
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};

exports.getTimeSheets = async(req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.read
    )
  ) {
    try {
      const timesheets = await Timesheet.find({
        "created_by": req.authInfo["oid"],
        "$and": [
          {
            "$or": [
              {
                "year": {
                  "$gt": req.query.fromYear
                }
              },
              {
                "year": req.query.fromYear,
                "month": {
                  "$gte": req.query.fromMonth
                }
              }
            ]
          },
          {
            "$or": [
              {
                "year": {
                  "$lt": req.query.toYear
                }
              },
              {
                "year": req.query.toYear,
                "month": {
                  "$lte": req.query.toMonth
                }
              }
            ]
          }
        ]
      }, {_id:1, name: 1, status: 1, approver: 1, reviewer: 1})
      .sort({ year: -1, month: -1})
      res.status(200).send(timesheets);
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};

exports.postTimeSheet = async(req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.write
    )
  ) {
    try{
      const templateExists = await TimesheetTemplate.findOne({_id: req.body.templateId});
      if (!templateExists){
        return res.status(400).send({
          "status": "error",
          "message": "Invalid Template",
        });
      } 
      const timesheetExists = await Timesheet.findOne({templateId: req.body.templateId},{_id:1,name:1});
      if (timesheetExists){
        return res.status(409).send({
          "status": "error",
          "message": "Timesheet for selected Template Already exists.",
          "data": {
            "existingTimesheetId": timesheetExists._id,
            "existingTimesheetName": timesheetExists.name,
          }
        });
      } 
      const newTimesheet = await Timesheet.create({
        month: templateExists.month, year: templateExists.year,
        name: templateExists.name, templateId: templateExists._id, days: templateExists.days,
        created_by: req.authInfo["oid"],
        email: req.authInfo["preferred_username"]
      });
      if (newTimesheet == null) return res.sendStatus(400);
      res.send(newTimesheet)
    } catch (error) {
      next(error);
    }
  } else
    next(
      new Error("User or application does not have the required permissions")
    );
};

exports.updateTimeSheet = async(req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.write
    )
  ) {
    try{
      const timesheet = await Timesheet.findOne({_id: req.params.id});
      if (!timesheet){
        res.status(400).send({
          "status": "error",
          "message": "Unable to update, Timesheet not found",
        });
      } 
      const owner = req.authInfo["oid"];
      let updateStatus = {};
      if(req.body.status === "draft"  || req.body.status === "submitted"){
          if(owner === timesheet?.created_by){
            updateStatus = { status: req.body.status}
          }
      }
      let validators = {};

      if(req.body.approver && timesheet?.approver && req.body.approver.trim() !== timesheet?.approver){
        validators['approver'] = req.body.approver.trim();
        if(timesheet.status === "approved"){
          if(req.body.approver.trim() === req.body.reviewer?.trim()){
            updateStatus = { status: "submitted"}
          }
        }
      }
      if(req.body.reviewer && timesheet?.reviewer && req.body.reviewer.trim() !== timesheet?.reviewer){
        validators['reviewer'] = req.body.reviewer.trim();
        updateStatus = { status: 'submitted'};
      }

      if(
        (req.body.approver?.trim() === timesheet?.approver && req.body.reviewer?.trim() === timesheet?.reviewer) || 
        (req.body.approver?.trim() && req.body.reviewer?.trim())  
      ){
        updateStatus = { status: 'submitted'};
      }

      const updatedTimesheet = await Timesheet.findOneAndUpdate({_id: req.params.id},{
          $set: {
            ...updateStatus,
            ...validators,
            ...(req.body.days ? 
              { 
                days: req.body.days,
                status: 'draft'
              } : {}),
          },
      },{returnOriginal: false});
      res.send(updatedTimesheet)
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};

exports.approveTimeSheet = async(req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.write
    )
  ) {
    try{
      const timesheet = await Timesheet.findOne({_id: req.params.id});
      if (!timesheet){
        res.status(400).send({
          "status": "error",
          "message": "Unable to update, Timesheet not found",
        });
      } 
      const user_email = req.authInfo["preferred_username"];
      let updateStatus = {};
      if(req.body.status === "approved"  && timesheet?.approver === user_email){
        updateStatus = { status: req.body.status}
      }
      else if(req.body.status === "reviewed"  && timesheet?.reviewer === user_email){
        updateStatus = { status: req.body.status}
      }
      else if(req.body.status === "rejected" && (user_email === timesheet?.approver || user_email === timesheet?.reviewer)){
        updateStatus = { status: req.body.status}
      }
      const history = {
        user: user_email,
        status: req.body.status,
        timestamp: Date.now(),
      }
      const comment = {
        user: user_email,
        timestamp: Date.now(),
        text: req.body.comments
      }
      const updatedTimesheet = await Timesheet.findOneAndUpdate({_id: req.params.id},{
          $set: {
            ...updateStatus
          },
          $push:{
            ...(req.body.comments ? 
              { 
                comments: comment,
              } : {}),
                history: history
          }
      },{returnOriginal: false});
      res.send(updatedTimesheet)
    } catch (error) {
      console.log(error)
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};

exports.deleteTimeSheet = (req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.write
    )
  ) {
    try {
      const id = req.params.id;
      const owner = req.authInfo["oid"];

      db.get("timesheets").remove({ owner: owner, id: id }).write();

      res.status(200).json({ message: "success" });
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};

exports.getTimeSheetsForApprovals = async(req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.read
    )
  ) {
    try {
      const user_email = req.authInfo["preferred_username"];
      const timesheets = await Timesheet.find({
        "$or": [
          {
              "approver": user_email
          },
          {
            "reviewer": user_email
          }
        ],
        status: {
          $ne: "draft"
        }
      }, {_id:1, name: 1, approver: 1, reviewer: 1, email: 1, status: 1})
      .sort({ updated_at: -1})
      res.status(200).send(timesheets);
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};
