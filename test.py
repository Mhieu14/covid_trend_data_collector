from pytrends.request import TrendReq

pytrends = TrendReq(hl='en-US', tz=360)

kw_list = ["Blockchain"]
result = pytrends.build_payload(['Coronavirus'], timeframe='2020-02-01 2020-03-01', geo='US')
df = pytrends.interest_over_time()
print(df)
