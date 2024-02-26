// @ts-check

const db = require("../models");
const TimesheetTemplate = db.timesheetTemplate;

const { hasRequiredDelegatedPermissions } = require("../auth/permissionUtils");

const authConfig = require("../configs/authConfig");

exports.getTimeSheetTemplate = async(req, res, next) => {
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
      const template = await TimesheetTemplate.findOne({_id: req.params.id})
      if(template){
        res.status(200).send(template);
      }
      else{
        res.status(404).send({
          "status": "error",
          "message": "Template not found",
          });
      }
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};

exports.getTimeSheetTemplates = async (req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.read
    )
  ) {
    try {
      // const limit = parseInt(req.query.limit) || 10;
      // const offset = parseInt(req.query.offset) || 1;
      // delete req.query.limit;
      // delete req.query.offset;
      // const filter = req.query || {};
      const templates = await TimesheetTemplate.find({
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
      }, {_id:1, name: 1})
      // .skip(limit * offset - limit)
      // .limit(limit)
      .sort({ year: -1, month: -1})
      // const totalCount = await TimesheetTemplate.countDocuments(filter);
      res.status(200).send(templates);
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};

exports.postTimeSheetTemplate = async (req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.write
    )
  ) {
    try {
        const templateExists = await TimesheetTemplate.findOne({name: req.body.name},{_id:1,name:1});
        if (templateExists){
          return res.status(409).send({
            "status": "error",
            "message": "Template for selected month Already exists.",
            "data": {
              "existingTemplateId": templateExists._id,
              "existingTemplateName": templateExists.name,
            }
          });
        } 
        const timesheetTemplate = await TimesheetTemplate.create({...req.body});
        if (timesheetTemplate == null) return res.sendStatus(400);
        res.send(timesheetTemplate)
      } catch (error) {
        next(error);
      }
  } else
    next(
      new Error("User or application does not have the required permissions")
    );
};

exports.updateTimeSheetTemplate = (req, res, next) => {
  if (
    hasRequiredDelegatedPermissions(
      req.authInfo,
      authConfig.protectedRoutes.timeSheetList.delegatedPermissions.write
    )
  ) {
    try {
      const id = req.params.id;
      const owner = req.authInfo["oid"];

      db.get("timesheets")
        .filter({ owner: owner })
        .find({ id: id })
        .assign(req.body)
        .write();

      res.status(200).json({ message: "success" });
    } catch (error) {
      next(error);
    }
  } else {
    next(new Error("User does not have the required permissions"));
  }
};

exports.deleteTimeSheetTemplate = (req, res, next) => {
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
