const _ = require('lodash');
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

statisticZeroValue()