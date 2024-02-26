const passportConfig = {
    credentials: {
        tenantID: process.env.TENANT_ID,
        clientID: process.env.CLIENT_ID
    },
    metadata: {
        authority: "login.microsoftonline.com",
        discovery: ".well-known/openid-configuration",
        version: "v2.0"
    },
    settings: {
        validateIssuer: true,
        passReqToCallback: true,
        loggingLevel: "info",
        loggingNoPII: true,
    },
    protectedRoutes: {
        timeSheetList: {
            endpoint: "/api/timeSheetList",
            delegatedPermissions: {
                read: ["TimeSheetList.Read", "TimeSheetList.ReadWrite"],
                write: ["TimeSheetList.ReadWrite"]
            },
            applicationPermissions: {
                read: ["TimeSheetList.Read.All", "TimeSheetList.ReadWrite.All"],
                write: ["TimeSheetList.ReadWrite.All"]
            }
        }
    }
}

module.exports = passportConfig;
