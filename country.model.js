const mongoose = require('mongoose');

const { Schema } = mongoose;

const country = Schema({
    Name: String,
    Code_2: String,
    Code_3: String,
    Code_num: String,
    Crawled: { type: Number, default: 0 }
  }, { timestamps: false, collection: 'country' });

module.exports = mongoose.model('country', country);
