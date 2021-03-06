const _ = require('lodash');
const googleTrends = require('google-trends-api');
const countries = require('./countries/countries_3_digit')
const listKeywords = require('./keywords')

const QUEUE = require('./queues/create.queue');

const dotenv = require('dotenv');
const { join } = require('path');
const mongoose = require('mongoose')
const { connectMongo } = require('./dbconnect')
const CountryModel = require('./country.model')
const TrendModel = require('./datatrend.model')

dotenv.config({
    path: join(__dirname, '.env'),
});

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
    try {
        await CountryModel.updateOne({Code_2: countryCode}, {Crawled: 1})
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
            // await delay(1000)

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
        for(let countChuckModel = 0; countChuckModel < listChunks.length; countChuckModel++) {
            // QUEUE.queueInsertMongo.add({ list_data: item }, { attempts: 1, backoff: 1000, removeOnComplete: true });
            await TrendModel.insertMany(listChunks[countChuckModel]);
        }
        return 1
    } catch (error) {
        await CountryModel.updateOne({Code_2: countryCode}, {Crawled: 0})
        console.log(error);
        return null
    }
    
    
}

const delay = millis => new Promise((resolve, reject) => {
    setTimeout(_ => resolve(), millis)
  });

  const getDataGlobal = async () => {
    while (1) {
        const item = await CountryModel.findOne({Crawled: 0}).lean()
        if(_.isEmpty(item)) return
        console.log(item);
        const code2 = item.Code_2;
        const result = await requestByCountry(code2)
        if(!result) return
    }

}

async function bootstrap() {
    await connectMongo()
}

bootstrap
getDataGlobal();
// testFunc()