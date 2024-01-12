import { configDotenv } from "dotenv";

configDotenv({override:true, path: './.env'})

const config = {
    PORT: process.env.PORT,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    MONGO_URL: process.env.MONGO_URL,
    DB_NAME: process.env.DB_NAME,
    PERSISTENCE: process.env.PERSISTENCE || "MONGO",
    MAIL_SERVICE: process.env.MAIL_SERVICE,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_ADMIN: process.env.MAIL_ADMIN,
    SERVER_MAIL: process.env.SERVER_MAIL,
    MAIL_PASS: process.env.MAIL_PASS,
    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    SECRET_KEY: process.env.SECRET_KEY
}

export default config