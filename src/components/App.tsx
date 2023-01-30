import { configureAmplify, isAuthenticated } from '../auth'
import { Login } from './Login';
import { PlotLineElement } from './PlotLineElement'
import { PlotAreaElement } from './PlotAreaElement'
import React from 'react';
import { useSelector } from 'react-redux';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

import { broadcastPlotData, FDC3Instrument, launchView, listenChannelConnection, getChartTitle, InstrumentPackage, FDC3 } from '../common';
import { MetricName, retrieveDataByIsin, InstrumentDataMap, retrieveDataByTicker } from '../datastore';

import store, { setInstrumentPackage, selectInstrument } from '../store';

log.setLevel('warn');

const cognito: ICognitoUserPoolData = {
    UserPoolId: "us-east-1_tMDWlFQl2",
    ClientId: "66nsoe7f4fd1f2n6kaaghrjim0"
}
configureAmplify(cognito);

let viewsInitialized = false;
let viewsCreated = 0, channeClientConnected = 0;
const initViews = async(instrument: FDC3Instrument) => {
    if (!viewsInitialized) {
        viewsInitialized = true;
        const w = await (fin.me as OpenFin.View).getCurrentWindow();
        await w.addListener('view-attached', e => {
            log.debug('view-attached', e);
            viewsCreated += 1;
            if (viewsCreated === 5) {
                log.debug('applyPreset grid');
                const layout = fin.Platform.Layout.wrapSync(w.identity);
                layout.applyPreset({ presetType: 'grid' });
            }
        });
        listenChannelConnection((identity) => {
            log.debug('channel client connected', identity);
            channeClientConnected += 1;
            if (channeClientConnected === 5) {
                retrieveData(instrument);
            }
        });
        await launchView({ metric: MetricName.FillProbability, chartType: 'line', instrument } );
        await launchView({ metric: MetricName.TWALiquidityAroundBBO, chartType: 'line', instrument } );
        await launchView({ metric: MetricName.TimeAtEBBO, chartType: 'line', instrument} );
        await launchView({ metric: MetricName.TradeNotional, chartType: 'area', instrument} );
        await launchView({ metric: MetricName.TradeNotional, chartType: 'area', stacking: 'percent', instrument} );

    }
    if (channeClientConnected === 5) {
        retrieveData(instrument);
    }
}

const retrieveData = async(instrument: FDC3Instrument) => {
    broadcastPlotData({ instrument, map: {}});  // reset views with empty data
    let data:InstrumentDataMap = {};
    if (instrument.id.ISIN && instrument.id.MIC === FDC3.XLON) {
        data = await retrieveDataByIsin(instrument.id.ISIN);
    }
    else if (instrument.id.ticker) {
        data = await retrieveDataByTicker(instrument);
    }
    const pack: InstrumentPackage = { instrument, map: data};
    store.dispatch(setInstrumentPackage(pack));
    broadcastPlotData(pack);
}


const App: React.FC = () => {
    const [isAuth, setIsAuth] = React.useState<boolean>(false);
    const instrument = useSelector(selectInstrument);

    React.useEffect(() => {
        const checkAuth = async() => {
            setIsAuth(await isAuthenticated());
        }
        checkAuth();
    }, []);

    React.useEffect(() => {
        if (isAuth && instrument) {
            const getFigure = async() => {
                await initViews(instrument);
            }
            getFigure();
        }
    }, [isAuth, instrument]);

    const onLogin = (me) => {
        if (!!me) {
            log.debug('logged in', me);
            setIsAuth(true);
        }
    }

    if (!isAuth) {
        return (<Login onLogin={onLogin}></Login>);
    } else if (instrument) {
        return (
            <PlotLineElement key={MetricName.SpreadRelTWA} metric={MetricName.SpreadRelTWA} ></PlotLineElement>
        )
    } else {
        return (<div></div>);
    }
}

export default App;