import { configureAmplify, isAuthenticated } from './auth'
import { Login } from './components/Login';
import { PlotElement } from './components/PlotElement'
import React from 'react';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

import { fin } from 'openfin-adapter/src/mock';
import { BrowserCreateWindowRequest, BrowserWindowModule, getCurrentSync, Page, PageWithUpdatableRuntimeAttribs, WorkspacePlatformModule, PageLayout } from '@openfin/workspace-platform';

import { initApiClient, loadSecurityBySymbol, getAllSecurityMetrics, TradingViewFigure } from './datastore';

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

async function launchView(figure:TradingViewFigure, targetIdentity?: OpenFin.Identity){
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

const retrieveData = async() => {
    await initApiClient();
    const listings = await loadSecurityBySymbol('VOD:XLON');
    log.debug('got listings', listings);
    const allMetric = await getAllSecurityMetrics(listings, ['2022-02-20', '2022-03-20']);
    log.debug('allMetric', allMetric);
    if (allMetric.length > 0) {
        allMetric.forEach((figure, index) => {
            if (index > 0) {
                launchView(figure);
            }
        });
        return allMetric[0];
    }
}

const App: React.FC = () => {
    const [isAuth, setIsAuth] = React.useState<boolean>(false);
    const [figure, setFigure] = React.useState<TradingViewFigure>();

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
            <PlotElement key={figure.symbol} figure={figure}></PlotElement>
        )
    } else {
        return (<div></div>);
    }
}

export default App;