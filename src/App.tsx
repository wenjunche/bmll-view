import { configureAmplify, isAuthenticated } from './auth'
import { Login } from './components/Login';
import { PlotElement } from './components/PlotElement'
import { PlotLineElement, PlotLineElementProps } from './components/PlotLineElement'
import React from 'react';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

import { fin } from 'openfin-adapter/src/mock';
import { getCurrentSync, WorkspacePlatformModule } from '@openfin/workspace-platform';

import { getAvailableMetrics, initApiClient, InstrumentFigure, getTimeSeries, dataJoin, loadSecurityByInstrument, getInstrumentFigure, transformJoinedData } from './datastore';

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

async function launchView(figure?:InstrumentFigure, targetIdentity?: OpenFin.Identity){
    if (figure) {
        const platform: WorkspacePlatformModule = getCurrentSync();
        const viewOptions = { url: 'http://localhost:8081/plotview.html',
                            customData: { figure: figure}
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

const retrieveData = async():Promise<InstrumentFigure | undefined> => {
    await initApiClient();

    const pyListing = await loadSecurityByInstrument({ISIN: 'GB00BH4HKS39', OPOL: 'XLON'});
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
        launchView(getInstrumentFigure(plot, 'FillProbability|1'));
        launchView(getInstrumentFigure(plot, 'TWALiquidityAroundBBO|10bpsNotional'));
        launchView(getInstrumentFigure(plot, 'TimeAtEBBO|Percentage'));
        return getInstrumentFigure(plot, 'Spread|RelTWA');
    }
    return undefined;
}


const App: React.FC = () => {
    const [isAuth, setIsAuth] = React.useState<boolean>(false);
    const [figure, setFigure] = React.useState<InstrumentFigure>();

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
                    setFigure(firstFigure);
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
    } else if (figure) {
        return (
            <PlotLineElement key={figure.metric} figure={figure.data} title={figure.metric} ></PlotLineElement>
        )
    } else {
        return (<div></div>);
    }
}

export default App;