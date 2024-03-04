const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  app_env: process.env.APP_ENV,
  local_port: process.env.LOCAL_PORT,
  dev_port: process.env.DEV_PORT,
  local_url: process.env.LOCAL_URL,
  dev_url: process.env.DEV_URL,
  react_local_url: process.env.REACT_LOCAL_URL,
  react_dev_url: process.env.REACT_DEV_URL,
  connectionString: process.env.CONNECTION_STRING,
  uploadDir: process.env.UPLOAD_DIR,
  secret:process.env.SECRET,
  mail_host: process.env.MAIL_HOST,
  mail_port: process.env.MAIL_PORT,
  mail_auth_user: process.env.MAIL_AUTH_USER,
  mail_auth_pass: process.env.MAIL_AUTH_PASS,
  mail_is_secure: process.env.MAIL_IS_SECURE,
  mail_from_email: process.env.MAIL_FROM_EMAIL,
};




