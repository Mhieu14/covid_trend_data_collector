const mongoose = require('mongoose');

const { Schema } = mongoose;

const dataCovid = Schema({
  country_code_2: String,
  country_code_3: String,
  date_statistic: Date,
  total_cases: Number,
  new_cases: Number,
  total_cases_per_million: Number,
  new_cases_per_million: Number,
  stringency_index: Number,
}, { timestamps: false, collection: 'data_covid' });

module.exports = mongoose.model('data_covid', dataCovid);
