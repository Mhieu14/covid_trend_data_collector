const _ = require('lodash');
const QUEUE = require('./create.queue');
const TrendModel = require('../datatrend.model')
let count = 1

console.log('process_queue');

QUEUE.queueInsertMongo.process(1, async (job, done) => {
  try {
    console.log('queueInsertMongo');
    const { list_data: listData } = job.data;
    console.log('chunk ', count);
    count = count + 1;
    await TrendModel.insertMany(listData);
    done()
  } catch (error) {
    console.log(error);
    console.log('Error insert db');
  }
})