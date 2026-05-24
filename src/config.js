require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
  PORT: process.env.PORT || 3001,
  HOST: process.env.HOST || '0.0.0.0'
};
