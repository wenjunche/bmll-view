import { configureStore, createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';

import { getInstrumentFigure, InstrumentDataMap, MetricName } from './datastore'
import { InstrumentFigure, FDC3Instrument, InstrumentPackage } from './common'

interface InstrumentDataState {
    instrument: FDC3Instrument;
    package: InstrumentPackage;
}

export interface InstrumentDataRootState {
    plotData: InstrumentDataState;
}

export const plotStateSlice = createSlice({
    name: 'plotData',
    initialState: {
        instrument: undefined,
        package: { map: {}, instrument: undefined },
    },
    reducers: {
        setInstrument: (state, action) => {
            log.debug(`store setInstrument ${action.payload}`);
            state.instrument = action.payload;
            state.package = { map: {}, instrument: action.payload };
        },
        setInstrumentPackage: (state, action) => {
            state.package = action.payload;
        },
    }
});

export const { setInstrument, setInstrumentPackage } = plotStateSlice.actions;

export const selectInstrument = (state: InstrumentDataRootState): FDC3Instrument => state.plotData.instrument;

const selectFillProbability = (state: InstrumentDataRootState): InstrumentFigure => {
    return getInstrumentFigure(state.plotData.package.map, MetricName.FillProbability, state.plotData.package.instrument);
}

const selectSpreadRelTWA = (state: InstrumentDataRootState): InstrumentFigure => {
    return getInstrumentFigure(state.plotData.package.map, MetricName.SpreadRelTWA, state.plotData.package.instrument);
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