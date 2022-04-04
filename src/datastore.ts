import {
    ApiClient,
    AsyncAuthTokenProvider,
    Instrument,
    Listing,
    ListingMetric,
    MetricMetadata,
    dataframeInnerJoin
} from '@bmll/dd-api';

import { getToken } from './auth';
import log from 'loglevel';

export enum MetricName {
    FillProbability = 'FillProbability|1',
    TWALiquidityAroundBBO = 'TWALiquidityAroundBBO|10bpsNotional',
    TimeAtEBBO = 'TimeAtEBBO|Percentage',
    TradeNotional = 'TradeNotional|Lit',
    SpreadRelTWA = 'Spread|RelTWA',
}

import { HighChartsDataPoint, HighChartsFigure,InstrumentFigure }  from './common';

export type HighChartsDataMap = Record<string, HighChartsFigure>;  // MIC => TradingViewFigure
export type InstrumentDataMap = Record<string, HighChartsDataMap>; // Metric => TradomgViewDataMap

const excludedMics = new Set(['XEQT', 'BOTC', 'SGMX', 'SGMU']);

const handleAxiosError = async (error: Error) => {
    log.error('handling Axios Error', error)
    throw error;
};

let apiclient: ApiClient;

export const initApiClient = async(environment = 'prod') => {
    if (!apiclient) {
        apiclient = new ApiClient({ environment }, handleAxiosError);
        await apiclient.login(new AsyncAuthTokenProvider(getToken));
    }
}

export const loadSecurityBySymbol = async(symbol: string, isPrimary = false): Promise<Listing[]> => {
    const [ticker, mic] = symbol.split(':');
    log.info('loadSecurityByTickerOrMic | symbol=' + symbol);
    const query = { MIC: [mic], Ticker: [ticker] };
    const objectType = isPrimary ? 'Listing' : 'Instrument';
    const listings = await apiclient.reference.query<Listing>({ ...query, objectType }, false);
    const filteredListings = isPrimary ? listings.filter((d) => d.IsPrimary) : listings;
    return filteredListings;
}

export type PartInstrument =  Partial<Instrument>;
export const loadSecurityByInstrument = async(instrument: PartInstrument): Promise<Listing[]> => {
    const query = { ISIN: [instrument.ISIN], OPOL: [instrument.OPOL] };
    const listings = await apiclient.reference.query<Listing>({ ...query }, false);
    return listings.filter(d => !excludedMics.has(d.MIC))
}


export const getListings = async (instruments: Instrument): Promise<Listing[]> => {
    return apiclient.reference.query<Listing>(
        {
            objectIds: [instruments.InstrumentId],
            objectType: 'Instrument',
        },
        false,
    );
}

export const getSecurityMetrics = async (
    listing: Listing,
    dates: string[],
    metricFrequency = 'D'
): Promise<HighChartsFigure> => {
    const metricNames = ["TradeNotional|Lit"];
    const [startDate, endDate] = dates;

    const listingIds: number[] = [listing.ListingId];
    const metricQuery = metricNames.map((field) => {
        const [metric, suffix] = field.split('|');
        return { metric, suffix };
    });
    const metrics = { $or: metricQuery } as Record<string, any>;    
    log.info({
        message: 'getSecurityMetrics',
        objectId: listingIds,
        startDate,
        endDate,
        metric: metrics,
    });

    const series = await apiclient.timeseries.query({
        objectId: listingIds,
        startDate,
        endDate,
        metric: metrics,
        frequency: metricFrequency,
        pivot: false,
        orient: 'records',
        // @ts-ignore
        isoformat: true,
    });

    return {
        symbol: listing.symbol,
        data: dataTransform(series)
    }
}

export const getAllSecurityMetrics = async (listing: Listing[], dates: string[]): Promise<Array<HighChartsFigure>> => {
    const requests: Array<Promise<HighChartsFigure>> = [];
    listing.forEach(value => {
        if (value.IsAlive) {
            requests.push(getSecurityMetrics(value, dates));
        }
    });
    const list: Array<HighChartsFigure> = await Promise.all(requests);
    const result: Array<HighChartsFigure> = [];
    list.forEach(item => {
        if (checkMetrics(item)) {
            result.push(item)
        }
    });
    return result;
}

interface MetricFilter {
    field?: string;
    metric?: string;
    suffix?: Array<string>;
    frequency?: string;
    level?: string | number
}

const filterMetricMetadata = (m: MetricMetadata, f: MetricFilter): boolean => {
    let field:boolean = true;
    if (f.field) {
        const [mmetric, msuffix] = m.field.split('|');
        field = mmetric === f.field;
    }
    const metric:boolean = !f.metric || f.metric === m.metric;
    const suffix:boolean = !f.suffix || (!!m.suffix && f.suffix.includes(m.suffix));
    const frequency:boolean = !f.frequency || f.frequency === m.frequency;
    const level:boolean = (f.level === undefined) || (!!m.tags && !!m.tags.Level && m.tags.Level === f.level);
    return field && metric && suffix && frequency && level;
}

export const getAvailableMetrics = async(filter: Array<MetricFilter>) => {
    const all = await apiclient.timeseries.getAvailableMetrics();
    console.log('allmetrics', all)
    return all.filter(m => {
        return filter.some(f => filterMetricMetadata(m, f));
    });
}

export const getTimeSeries = async (
    listing: Listing[],
    metric: MetricMetadata[],
    dates: string[]
): Promise<ListingMetric[]> => {
    const [startDate, endDate] = dates;
    const metricNames = metric.map((d) => {
        const [name, suffix] = d.field.split('|');
        return { metric: name, suffix };
    });
    const listingIds: number[] =  listing.map(l => l.ListingId);
    log.info({
        message: 'getTimeSeries',
        objectId: listingIds,
        startDate,
        endDate,
        metric: metricNames
    });

    return apiclient.timeseries.query({
        objectId: listingIds,
        startDate,
        endDate,
        // @ts-ignore
        metric: {$or: metricNames },
        frequency: 'D',
        pivot: true
    });
}

type JoinedListingMetric = Listing & ListingMetric;

export const dataJoin = (listing: Listing[], listingMetric: ListingMetric[]): Array<JoinedListingMetric> => {
    return dataframeInnerJoin(listingMetric, listing, 'ObjectId', 'ListingId') as Array<JoinedListingMetric>;
}

export const transformJoinedData = (listing: Array<JoinedListingMetric>, metricList: Array<string>):InstrumentDataMap => {
    const map: InstrumentDataMap = {};
    metricList.forEach(metric => {
        listing.forEach(item => {
            let metricFeature = map[metric];
            if (!metricFeature) {
                metricFeature = {};
                map[metric] = metricFeature;
            }
            let micFeature = metricFeature[item.MIC];
            if (!micFeature) {
                micFeature = { symbol: item.MIC, data: []};
                metricFeature[item.MIC] = micFeature;
            }
            micFeature.data.push([Date.parse(item.Date), item[metric] ]);
        });    
    });
    generateCompositeSeries(map, 'TWALiquidityAroundBBO|10bpsNotional',  ['TWALiquidityAroundBBO|Ask10bpsNotional', 'TWALiquidityAroundBBO|Bid10bpsNotional']);
    generateCompositeSeries(map, 'FillProbability|1',  ['FillProbability|Ask1', 'FillProbability|Bid1']);
    return map;
}

export const getInstrumentFigure = (map: InstrumentDataMap, metric: MetricName):InstrumentFigure => {
    const tvMap = map[metric];
    if (tvMap) {
        return { metric, data: Array.from(Object.values(tvMap)) };
    } else {
        return { metric, data: [] } ;
    }
}

const generateCompositeSeries = (map: InstrumentDataMap, targetMetric: string, sourceMetric: string[]) => {
    const [metric1, metric2] = sourceMetric;
    const source1 = map[metric1];
    const source2 = map[metric2];
    const tvMap:HighChartsDataMap = {};
    if (source1 && source2) {
        Object.keys(source1).forEach(mic => {
            const tvFigure1 = source1[mic];
            const tvFigure2 = source2[mic];
            if (tvFigure1 && tvFigure2) {
                const composite: HighChartsFigure = { symbol: mic, data: averageDataPoints(tvFigure1.data, tvFigure2.data) }
                tvMap[mic] = composite;
            }
        });
    }
    map[targetMetric] = tvMap;
}

const averageDataPoints = (list1: Array<HighChartsDataPoint>, list2: Array<HighChartsDataPoint>):Array<HighChartsDataPoint> => {
    const result:Array<HighChartsDataPoint> = [];
    return list1.map((point, index) => {
        // assuming HighChartsDataPoint is sorted by time
        return [ point[0], (point[1] + list2[index][1]) / 2 ];
    })
}

const checkMetrics = (figure: HighChartsFigure): boolean => {
    return figure.data.filter(item => item[1] > 0).length > 0;
}

const dataTransform = (dataInFigure: Array<ListingMetric>): Array<HighChartsDataPoint> => {
    const newData = dataInFigure.map(item => { 
        return [ Date.parse(item.Date), item['Value']] as HighChartsDataPoint;
     });
     log.debug('TV data', newData);
     return newData;
};

export const retrieveDataByIsin = async(isin: string):Promise<InstrumentDataMap> => {
    log.debug(`retrieveData ${isin}`);
    await initApiClient();

    const pyListing = await loadSecurityByInstrument({ISIN: isin, OPOL: 'XLON'});
    console.log('pyListing', pyListing);
    const metrics = await getAvailableMetrics([
            { field: 'TWALiquidityAroundBBO', frequency: 'D', suffix: ['Ask10bpsNotional', 'Bid10bpsNotional'] },
            { field: 'FillProbability',  frequency: 'D', level: 1 },
            { field: 'TimeAtEBBO', frequency: 'D', suffix: ['Percentage']},
            { field: 'Spread', frequency: 'D', suffix: ['RelTWA'] },
            { field: 'TradeNotional', frequency: 'D'}
        ]
        );
    console.log('metrics', metrics);
    const pySeries = await getTimeSeries(pyListing, metrics, ['2022-02-28', '2022-03-28']);
    log.debug('pySeries', pySeries);
    const joined = dataJoin(pyListing, pySeries);
    log.debug('joined', joined);
    const data = transformJoinedData(joined, metrics.map(m => m.field));
    log.debug('transformed', data);
    return data;
}
