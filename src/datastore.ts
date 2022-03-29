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

export interface TradingViewDataPoint {
    time: string;
    value: number;
}

export interface TradingViewFigure {
    symbol: string;  // MIC
    data: Array<TradingViewDataPoint>
}

export interface InstrumentFigure {
    metric: string;
    data: Array<TradingViewFigure>;
}

const excludedMics = new Set(['XEQT', 'BOTC', 'SGMX', 'SGMU']);

const handleAxiosError = async (error: Error) => {
    log.error('handling Axios Error', error)
    throw error;
};

let apiclient: ApiClient;

export const initApiClient = async(environment = 'prod') => {
    apiclient = new ApiClient({ environment }, handleAxiosError);
    await apiclient.login(new AsyncAuthTokenProvider(getToken));
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
): Promise<TradingViewFigure> => {
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

export const getAllSecurityMetrics = async (listing: Listing[], dates: string[]): Promise<Array<TradingViewFigure>> => {
    const requests: Array<Promise<TradingViewFigure>> = [];
    listing.forEach(value => {
        if (value.IsAlive) {
            requests.push(getSecurityMetrics(value, dates));
        }
    });
    const list: Array<TradingViewFigure> = await Promise.all(requests);
    const result: Array<TradingViewFigure> = [];
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
    if (m.field === 'TWALiquidityAroundBBO|Ask10bpsOrders') {
        console.log(' ');
    }
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

    const series = await apiclient.timeseries.query({
        objectId: listingIds,
        startDate,
        endDate,
        // @ts-ignore
        metric: {$or: metricNames },
        frequency: 'D',
        pivot: true
    });

    return series;

    // return {
    //     symbol: listing.symbol,
    //     data: dataTransform(series)
    // }
}

type JoinedListingMetric = Listing & ListingMetric;

export const dataJoin = (listing: Listing[], listingMetric: ListingMetric[]): Array<JoinedListingMetric> => {
    return dataframeInnerJoin(listingMetric, listing, 'ObjectId', 'ListingId') as Array<JoinedListingMetric>;
}

export const transformJoinedData = (listing: Array<JoinedListingMetric>, metricList: Array<string>):Array<InstrumentFigure> => {
    const map: Map<string, Map<string, TradingViewFigure>> = new Map();
    metricList.forEach(metric => {
        listing.forEach(item => {
            let metricFeature = map.get(metric);
            if (!metricFeature) {
                metricFeature = new Map();
                map.set(metric, metricFeature);
            }
            let micFeature = metricFeature.get(item.MIC);
            if (!micFeature) {
                micFeature = { symbol: item.MIC, data: []};
                metricFeature.set(item.MIC, micFeature);
            }
            micFeature.data.push({ time: item.Date, value: item[metric] })
        });    
    });
    const result:Array<InstrumentFigure> = [];
    map.forEach((value, key) => {
        result.push( { metric: key, data: Array.from(value.values()) } );
    });
    return result;
}

const checkMetrics = (figure: TradingViewFigure): boolean => {
    return figure.data.filter(item => item.value > 0).length > 0;
}

const dataTransform = (dataInFigure: Array<ListingMetric>): Array<TradingViewDataPoint> => {
    const newData = dataInFigure.map(item => { 
        return {time: item.Date, value: item['Value']};
     });
     log.debug('TV data', newData);
     return newData;
};
