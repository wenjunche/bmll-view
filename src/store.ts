import { configureStore, createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';

import { getInstrumentFigure, InstrumentDataMap, MetricName } from './datastore'
import { InstrumentFigure, FDC3Instrument } from './common'

interface InstrumentDataState {
    isin: string;
    instrument: FDC3Instrument;
    map: InstrumentDataMap;
}

export interface InstrumentDataRootState {
    plotData: InstrumentDataState;
}

export const plotStateSlice = createSlice({
    name: 'plotData',
    initialState: {
        isin: '',
        instrument: undefined,
        map: {},
    },
    reducers: {
        setISIN: (state, action) => {
            log.debug(`store setISIN ${action.payload}`);
            state.isin = action.payload;
            state.map = {};
        },
        setInstrument: (state, action) => {
            log.debug(`store setInstrument ${action.payload}`);
            state.instrument = action.payload;
            state.map = {};
        },
        setInstrumentDataMap: (state, action) => {
            state.map = action.payload;
        },
    }
});

export const { setISIN, setInstrument, setInstrumentDataMap } = plotStateSlice.actions;

export const selectISIN = (state: InstrumentDataRootState): string => state.plotData.isin;

export const selectInstrument = (state: InstrumentDataRootState): FDC3Instrument => state.plotData.instrument;

export const selectFillProbability = (state: InstrumentDataRootState): InstrumentFigure => {
    return getInstrumentFigure(state.plotData.map, MetricName.FillProbability);
}

export const selectSpreadRelTWA = (state: InstrumentDataRootState): InstrumentFigure => {
    return getInstrumentFigure(state.plotData.map, MetricName.SpreadRelTWA);
}

export const getSelector = (metric:string) => {
    switch (metric) {
        case MetricName.SpreadRelTWA: 
            return selectSpreadRelTWA;
        case MetricName.FillProbability: 
            return selectFillProbability;
        default:
            return selectFillProbability;
    }
}

const store = configureStore({
    reducer: {
        plotData: plotStateSlice.reducer
    }
});

export default store