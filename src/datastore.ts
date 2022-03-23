import {
    ApiClient,
    AsyncAuthTokenProvider,
    Instrument,
    Listing,
    ListingMetric
} from '@bmll/dd-api';

import { getToken } from './auth';
import log from 'loglevel';

export interface TradingViewData {
    time: string;
    value: number;
}

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
): Promise<TradingViewData[]> => {
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

    return dataTransform(series);
}

export const getAllSecurityMetrics = async (listing: Listing[], dates: string[]): Promise<Array<TradingViewData[]>> => {
    const requests: Array<Promise<TradingViewData[]>> = [];
    listing.forEach(value => {
        if (value.IsAlive) {
            requests.push(getSecurityMetrics(value, dates));
        }
    });
    const list: Array<TradingViewData[]> = await Promise.all(requests);
    const result: Array<TradingViewData[]> = [];
    list.forEach(item => {
        if (checkMetrics(item)) {
            result.push(item)
        }
    });
    return result;
}

const checkMetrics = (listing: TradingViewData[]): boolean => {
    return listing.filter(item => item.value > 0).length > 0;
}

const dataTransform = (dataInFigure: Array<ListingMetric>): Array<TradingViewData> => {
    const newData = dataInFigure.map(item => { 
        return {time: item.Date, value: item['Value']};
     });
     log.debug('TV data', newData);
     return newData;
};
