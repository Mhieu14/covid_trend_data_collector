const _ = require('lodash');
const fs = require('fs');
const TrendModel = require('../datatrend.model')

const statisticZeroValue = async () => {
  const listZero = await TrendModel.find({value: 0, country_code_2: 'US'});
  const listKeys = []
  const mapZero = new Map()
  _.forEach(listZero, item => {
      const itemKeyWord = _.get(item, 'key_word')
      const listItemByKeyWord = mapZero.get(itemKeyWord)
      if (_.isEmpty(listItemByKeyWord)) {
          mapZero.set(itemKeyWord, [item])
          listKeys.push(itemKeyWord)
      } else {
          listItemByKeyWord.push(item)
      }
  })

  _.forEach(listKeys, item => {
      const listItemByKeyWord = mapZero.get(item);
      console.log(item, ' - ', listItemByKeyWord.length);
  })
}

// statisticZeroValue()

function ConvertToCSV(objArray) {
  var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
  var str = '';

  for (var i = 0; i < array.length; i++) {
      var line = '';
      for (var index in array[i]) {
          if (line != '') line += ','

          line += array[i][index];
      }

      str += line + '\r\n';
  }

  return str;
}

const saveFile = async () => {
  const dataMongo = await TrendModel.find({});
  const dataToWrite = _.map(dataMongo, item => ({
    country_code_2: item.country_code_2,
    country_code_3: item.country_code_3,
    date_statistic: item.date_statistic,
    key_word: item.key_word,
    value: item.value
  }))
  const jsonFile = JSON.stringify(dataToWrite);
  fs.writeFile('./data.json', jsonFile, 'utf8', function (err) {
    if (err) {
      console.log('Some error occured - file either not saved or corrupted file saved.');
    } else{
      console.log('It\'s saved!');
    }
  });
}

saveFile()

