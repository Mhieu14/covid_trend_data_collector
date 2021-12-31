const _ = require('lodash');
const googleTrends = require('google-trends-api');
const countries = require('./countries/countries_3_digit')
const listKeywords = require('./keywords')

const QUEUE = require('./queues/create.queue');

const listYear = [2020, 2021]
const mapCountries = new Map(_.map(countries, (item) => [item.Code_2, item]));

// const boottrap = async () => {
//     for (let i = 0; i < countries.length; i++) {
//         const country = countries[i]
//     }
// }

const testFunc = async () => {
    let result = await googleTrends.interestOverTime({
        keyword: ['cases of covid19', 'corona', 'coronavirus', 'coronavirus cases', 'coronavirus covid19'], 
        startTime: new Date('2020-12-01T00:00:00.000Z'),
        endTime: new Date('2020-12-31T00:00:00.000Z'),
        timezone: 0,
        geo: 'AL',
    });
    result = JSON.parse(result)
    console.log(result['default']);
    console.log(_.get(result, 'default.timelineData'));
    console.log(countries.length);
    return
}

const requestByCountry = async (countryCode) => {
    const thisCountry = mapCountries.get(countryCode)

    const listChunkKeyWord = _.chunk(listKeywords, 5)
    const listDataQueue = []

    for (let chunkCount = 0; chunkCount < listChunkKeyWord.length; chunkCount ++) {
        chunkKeyWord = listChunkKeyWord[chunkCount]
        const listParams = [];

        _.forEach(listYear, year => {
            for(let month = 0; month < 12; month++) {
                const startTime = new Date(year, month, 1);
                const endTime = new Date(year, month + 1, 0);
                const param = {
                    keyword: chunkKeyWord, 
                    startTime: startTime,
                    endTime: endTime,
                    timezone: 0,
                    geo: countryCode,
                }
                listParams.push(param)
            }
        })

        const listReq = [];
        _.forEach(listParams, param => {
            listReq.push(googleTrends.interestOverTime(param))
        })

        const listRes = await Promise.all(listReq)
        await delay(1000)

        _.forEach(listRes, itemRes => {
            const objRes = JSON.parse(itemRes)
            console.log('res processing ...');
            const listTimelineData = _.get(objRes, 'default.timelineData')
            _.forEach(listTimelineData, item => {
                const dateStatistics = new Date(parseInt(item.time + '000', 10))
                const listValue = item.value
                for(let i = 0; i < chunkKeyWord.length; i++) {
                    listDataQueue.push({
                        country_code_2: thisCountry.Code_2,
                        country_code_3: thisCountry.Code_3,
                        date_statistic: dateStatistics,
                        key_word: chunkKeyWord[i],
                        value: listValue[i],
                    })
                }
            })
        })
    }
    
    
    console.log('process done model count: ', listDataQueue.length);
    const listChunks = _.chunk(listDataQueue, 5000);
    _.forEach(listChunks, item => {
        QUEUE.queueInsertMongo.add({ list_data: item }, { attempts: 1, backoff: 1000, removeOnComplete: true });
    })
    
}

const delay = millis => new Promise((resolve, reject) => {
    setTimeout(_ => resolve(), millis)
  });

const getDataGlobal = async () => {
    const listChecked = ['VN', 'US', 'AF', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ']
    for(let i = 0; i < countries.length; i++) {
        const item = countries[i]
        const code2 = item.Code_2;
        if (!_.includes(listChecked, code2)) {
            await requestByCountry(code2)
            await delay(20000)
        }
    }
}

getDataGlobal();
// testFunc()