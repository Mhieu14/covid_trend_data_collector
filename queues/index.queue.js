const dotenv = require('dotenv');
const { join } = require('path');
const mongoose = require('mongoose')
const { connectMongo } = require('../dbconnect')

dotenv.config({
  path: join(__dirname, '../.env'),
});
mongoose.set('debug', true);

async function bootstrap() {
  await connectMongo()
  // eslint-disable-next-line global-require
  require('./process.queue');
  // require('./statistic');
}

bootstrap();
