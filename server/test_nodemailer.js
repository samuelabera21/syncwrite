const nodemailer = require('nodemailer'); const t = nodemailer.createTransport({host: 'smtp.gmail.com', port: 587, family: 4}); console.log(t.transporter.options);  
