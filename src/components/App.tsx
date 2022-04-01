import { configureAmplify, isAuthenticated } from '../auth'
import { Login } from './Login';
import { PlotLineElement } from './PlotLineElement'
import { PlotAreaElement } from './PlotAreaElement'
import React from 'react';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

import { fin } from 'openfin-adapter/src/mock';
import { getCurrentSync, WorkspacePlatformModule } from '@openfin/workspace-platform';

import { ChartViewOptions } from 'common';
import { getAvailableMetrics, initApiClient, getTimeSeries, dataJoin, loadSecurityByInstrument, getInstrumentFigure, transformJoinedData } from '../datastore';

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
    let { figure, chartType, targetIdentity, stacking } = options;
    if (figure) {
        const platform: WorkspacePlatformModule = getCurrentSync();
        const viewOptions = { url: 'http://localhost:8081/plotview.html',
                            customData: { figure: figure, chartType, stacking }
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
}

const testISINs = ['GB00BH4HKS39', 'GB00B1XZS820', 'GB0006731235', 'GB00B02J6398', 'GB0000536739', 'GB0000456144'];

const retrieveData = async():Promise<ChartViewOptions | undefined> => {
    await initApiClient();

    const pyListing = await loadSecurityByInstrument({ISIN: 'GB0000456144', OPOL: 'XLON'});
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

    if (plot.size > 0) {
        launchView({ figure: getInstrumentFigure(plot, 'FillProbability|1'), chartType: 'line' } );
        launchView({ figure: getInstrumentFigure(plot, 'TWALiquidityAroundBBO|10bpsNotional'), chartType: 'line' } );
        launchView({ figure: getInstrumentFigure(plot, 'TimeAtEBBO|Percentage'), chartType: 'line'} );
        launchView({ figure: getInstrumentFigure(plot, 'TradeNotional|Lit'), chartType: 'area'} );
        launchView({ figure: getInstrumentFigure(plot, 'TradeNotional|Lit'), chartType: 'area', stacking: 'percent'} );
        return { figure: getInstrumentFigure(plot, 'Spread|RelTWA'), chartType: 'line' };
    }
    return undefined;
}


const App: React.FC = () => {
    const [isAuth, setIsAuth] = React.useState<boolean>(false);
    const [options, setOptions] = React.useState<ChartViewOptions>();

    React.useEffect(() => {
        const checkAuth = async() => {
            setIsAuth(await isAuthenticated());
        }
        checkAuth();
    }, []);

    React.useEffect(() => {
        if (isAuth) {
            const getFigure = async() => {
                const firstFigure = await retrieveData();
                if (firstFigure) {
                    setOptions(firstFigure);
                }
            }
            getFigure();
        }
    }, [isAuth]);

    const onLogin = (me) => {
        if (!!me) {
            log.debug('logged in', me);
            setIsAuth(true);
        }
    }

    if (!isAuth) {
        return (<Login onLogin={onLogin}></Login>);
    } else if (options?.figure) {
        if (options.chartType === 'line') {
            return (
                <PlotLineElement key={options.figure.metric} figure={options.figure.data} title={options.figure.metric} ></PlotLineElement>
            )
        } else if (options.chartType === 'area') {
            return (
                <PlotAreaElement key={options.figure.metric} figure={options.figure.data} title={options.figure.metric} stacking={options.stacking} ></PlotAreaElement>
            )
        } else {
            return (<div></div>);
        }
    } else {
        return (<div></div>);
    }
}

export default App;