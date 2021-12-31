const Queue = require('bull');

const redisConfig = {
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
};

exports.queueInsertMongo = new Queue('queue_insert_mongo', {
  redis: redisConfig,
});