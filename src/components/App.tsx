import { configureAmplify, isAuthenticated } from '../auth'
import { Login } from './Login';
import { PlotLineElement } from './PlotLineElement'
import { PlotAreaElement } from './PlotAreaElement'
import React from 'react';
import { useSelector } from 'react-redux';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

import { fin } from 'openfin-adapter/src/mock';
import { getCurrentSync, WorkspacePlatformModule } from '@openfin/workspace-platform';

import { broadcastPlotData, ChartViewOptions } from '../common';
import { getAvailableMetrics, initApiClient, getTimeSeries, dataJoin, loadSecurityByInstrument, getInstrumentFigure, transformJoinedData, MetricName } from '../datastore';

import store, { setInstrumentDataMap, selectISIN } from '../store';

log.setLevel('debug');

const cognito: ICognitoUserPoolData = {
    UserPoolId: "us-east-1_tMDWlFQl2",
    ClientId: "66nsoe7f4fd1f2n6kaaghrjim0"
}
configureAmplify(cognito);

const getDateRange = () => {
    const start = new Date();
    const end   = new Date();
    start.setDate(start.getDate() - 30);
    return [start.getFullYear()  + "-" + (start.getMonth()+1) + "-" + start.getDate(),
            end.getFullYear()  + "-" + (end.getMonth()+1) + "-" + end.getDate()]
}


async function launchView(options: ChartViewOptions ) {
    let { metric, chartType, targetIdentity, stacking } = options;
    const platform: WorkspacePlatformModule = getCurrentSync();
    const viewOptions = { url: 'http://localhost:8081/plotview.html',
                        customData: { metric, chartType, stacking }
                        };

    log.debug('createView', viewOptions);
    if (!targetIdentity) {
        // @ts-ignore
        const w = await fin.me.getCurrentWindow();
        targetIdentity = w.identity;
    }
    // @ts-ignore
    return platform.createView(viewOptions, targetIdentity);
}

let viewsInitialized = false;
let viewsCreated = 0;
const initViews = async(isin: string) => {
    if (!viewsInitialized) {
        viewsInitialized = true;
        const w = await (fin.me as OpenFin.View).getCurrentWindow();
        await w.addListener('view-attached', e => {
            log.debug('view-attached', e);
            viewsCreated += 1;
            if (viewsCreated == 5) {
                retrieveData(isin);
            }
                });
        await launchView({ metric: MetricName.FillProbability, chartType: 'line' } );
        await launchView({ metric: MetricName.TWALiquidityAroundBBO, chartType: 'line' } );
        await launchView({ metric: MetricName.TimeAtEBBO, chartType: 'line'} );
        await launchView({ metric: MetricName.TradeNotional, chartType: 'area'} );
        await launchView({ metric: MetricName.TradeNotional, chartType: 'area', stacking: 'percent'} );
    }
    if (viewsCreated == 5) {
        retrieveData(isin);
    }
}

const retrieveData = async(isin: string) => {
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
    const plot = transformJoinedData(joined, metrics.map(m => m.field));
    log.debug('plot', plot);
    store.dispatch(setInstrumentDataMap(plot));
    broadcastPlotData(plot);
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