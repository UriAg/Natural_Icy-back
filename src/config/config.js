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
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    ENVIRONMENT: process.env.ENVIRONMENT || 'production'
}

export default config