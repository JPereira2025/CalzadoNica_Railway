require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
  PORT: process.env.PORT || 3001,
  HOST: process.env.HOST || '0.0.0.0'
  ,
  EMAIL: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'no-reply@example.com'
  }
};
