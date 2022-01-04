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
const CovidModel = require('./datacovid.model')

dotenv.config({
    path: join(__dirname, '.env'),
});
mongoose.set('debug', true);

const listYear = [2020, 2021]
const mapCountries = new Map(_.map(countries, (item) => [item.Code_2, item]));
const mapCountries3 = new Map(_.map(countries, (item) => [item.Code_3, item]));

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
    
            // const listReq = [];
            for(let countParam = 0; countParam <listParams.length; countParam++) {
                const param = listParams[countParam]
                const itemRes = await googleTrends.interestOverTime(param);
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
                await delay(1000)
            }
        }
        
        
        console.log('process done model count: ', listDataQueue.length);
        const listChunks = _.chunk(listDataQueue, 1000);
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

async function bootstrap() {
    await connectMongo()
}

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

// const request = require('request')
const fs = require('fs');

const getKeys = (obj) => {
    const keys = [];
    for(let key in obj){
       keys.push(key);
    }
    return keys;
 }
 

const insertDataCovid = async () => {
    let rawdata = fs.readFileSync('owid-covid-data.json');
    let data = JSON.parse(rawdata);
    // console.log(getKeys(data));
    const dataInsert = []
    for (let key in data) {
        const country = mapCountries3.get(key)
        if(country) {
            const listDate = _.get(data, `${key}.data`)
            const code2 = country.Code_2
            _.forEach(listDate, item => {
                dataInsert.push({
                    country_code_2: code2,
                    country_code_3: key,
                    date_statistic: new Date(item.date),
                    total_cases: item.total_cases,
                    new_cases: item.new_cases,
                    total_cases_per_million: item.total_cases_per_million,
                    new_cases_per_million: item.new_cases_per_million,
                    stringency_index: item.stringency_index,
                })
            })
        }
        
    }
    const listChunks = _.chunk(dataInsert, 1000);
    for(let countChuckModel = 0; countChuckModel < listChunks.length; countChuckModel++) {
        // QUEUE.queueInsertMongo.add({ list_data: item }, { attempts: 1, backoff: 1000, removeOnComplete: true });
        await CovidModel.insertMany(listChunks[countChuckModel]);
    }
    return 1
}

const { convertArrayToCSV } = require('convert-array-to-csv');

const exportCsv = async () => {
    const dataObjects = await TrendModel.find().lean();
    const csvFromArrayOfObjects = convertArrayToCSV(dataObjects);
    fs.writeFile('./data.csv', csvFromArrayOfObjects, 'utf8', function (err) {
        if (err) {
            console.log('Some error occured - file either not saved or corrupted file saved.');
        } else{
            console.log('It\'s saved!');
        }
    });
}
 
bootstrap();
getDataGlobal();
// insertDataCovid()
// exportCsv();