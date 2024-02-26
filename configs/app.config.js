const dotenv = require('dotenv')
dotenv.config()

const config = {
    API_SERVICE_PORT: process.env.API_SERVICE_PORT,
    API_SERVICE_HOST: process.env.API_SERVICE_HOST,
    ENV: process.env.ENV
}

module.exports = config
