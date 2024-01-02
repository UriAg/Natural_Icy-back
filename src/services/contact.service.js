import nodemailer from 'nodemailer';
import config from '../config/config.js';

const transporter = nodemailer.createTransport({
    service: config.MAIL_SERVICE,
    port: config.MAIL_PORT,
    auth:{
        user: config.MAIL_USER,
        pass: config.MAIL_PASS
    }
})

const send=async(from, to, subject, message)=>{
    return transporter.sendMail({
        from,
        to,
        subject,
        html:`
            <p>${message}</p>
        `
    }).catch(err=>console.log(err));
        
}
export default { send, transporter}