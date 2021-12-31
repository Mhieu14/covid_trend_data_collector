const mongoose = require('mongoose');

const { Schema } = mongoose;

const dataTrend = Schema({
  country_code_2: String,
  country_code_3: String,
  date_statistic: Date,
  key_word: String,
  value: { type: Number, default: 0 },
}, { timestamps: false, collection: 'data_trend' });

module.exports = mongoose.model('data_trend', dataTrend);
