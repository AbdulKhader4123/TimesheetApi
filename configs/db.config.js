const dotenv = require('dotenv');
dotenv.config();

const config = {
    DATABASE: process.env.DATABASE,
    MONGODB_URL: process.env.MONGODB_URL,
    MONGODB_USER: process.env.MONGODB_USER,
    MONGODB_PASS: process.env.MONGODB_PASS,
}

module.exports = config;
