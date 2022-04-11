import { configureAmplify, isAuthenticated } from '../auth'
import { Login } from './Login';
import { PlotLineElement } from './PlotLineElement'
import { PlotAreaElement } from './PlotAreaElement'
import React from 'react';
import { useSelector } from 'react-redux';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

import { fin } from 'openfin-adapter/src/mock';

import { broadcastPlotData, launchView, listenChannelConnection } from '../common';
import { MetricName, retrieveDataByIsin } from '../datastore';

import store, { setInstrumentDataMap, selectISIN } from '../store';

log.setLevel('debug');

const cognito: ICognitoUserPoolData = {
    UserPoolId: "us-east-1_tMDWlFQl2",
    ClientId: "66nsoe7f4fd1f2n6kaaghrjim0"
}
configureAmplify(cognito);

let viewsInitialized = false;
let viewsCreated = 0, channeClientConnected = 0;
const initViews = async(isin: string) => {
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
                retrieveData(isin);
            }
        });
        await launchView({ metric: MetricName.FillProbability, chartType: 'line' } );
        await launchView({ metric: MetricName.TWALiquidityAroundBBO, chartType: 'line' } );
        await launchView({ metric: MetricName.TimeAtEBBO, chartType: 'line'} );
        await launchView({ metric: MetricName.TradeNotional, chartType: 'area'} );
        await launchView({ metric: MetricName.TradeNotional, chartType: 'area', stacking: 'percent'} );

    }
    if (channeClientConnected === 5) {
        retrieveData(isin);
    }
}

const retrieveData = async(isin: string) => {
    const data = await retrieveDataByIsin(isin);
    store.dispatch(setInstrumentDataMap(data));
    broadcastPlotData(data);
}


const App: React.FC = () => {
    const [isAuth, setIsAuth] = React.useState<boolean>(false);
    const isin = useSelector(selectISIN);

    React.useEffect(() => {
        const checkAuth = async() => {
            setIsAuth(await isAuthenticated());
        }
        checkAuth();
    }, []);

    React.useEffect(() => {
        if (isAuth && isin !== '') {
            const getFigure = async() => {
                await initViews(isin);
            }
            getFigure();
        }
    }, [isAuth, isin]);

    const onLogin = (me) => {
        if (!!me) {
            log.debug('logged in', me);
            setIsAuth(true);
        }
    }

    if (!isAuth) {
        return (<Login onLogin={onLogin}></Login>);
    } else {
        return (
            <PlotLineElement key={MetricName.SpreadRelTWA} title={MetricName.SpreadRelTWA} metric={MetricName.SpreadRelTWA} ></PlotLineElement>
        )
    }
}

export default App;