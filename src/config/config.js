import { configDotenv } from "dotenv";

configDotenv({override:true, path: './.env'})

const config = {
    PORT: process.env.PORT,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    MONGO_URL: process.env.MONGO_URL,
    DB_NAME: process.env.DB_NAME,
    MAIL_SERVICE: process.env.MAIL_SERVICE,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_ADMIN: process.env.MAIL_ADMIN,
    SERVER_MAIL: process.env.SERVER_MAIL,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    SECRET_KEY: process.env.SECRET_KEY,
    SUCCESS_PAY: process.env.SUCCESS_PAY,
    FAILURE_PAY: process.env.FAILURE_PAY,
    RECOVERY_LINK: process.env.RECOVERY_LINK,
    CONFIRM_REGISTER_LINK: process.env.CONFIRM_REGISTER_LINK
}

export default config