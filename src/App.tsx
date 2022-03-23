import { configureAmplify, isAuthenticated } from './auth'
import { Login } from './components/Login';
import { PlotElement } from './components/PlotElement'
import React from 'react';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

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

const App: React.FC = () => {
    const [isAuth, setIsAuth] = React.useState<boolean>(false);
    const [metric, setMetric] = React.useState<Array<TradingViewFigure>>([]);

    React.useEffect(() => {
        const checkAuth = async() => {
            setIsAuth(await isAuthenticated());
        }
        checkAuth();
    }, []);

    React.useEffect(() => {
        if (isAuth) {
            const retrieveData = async() => {
                await initApiClient();
                const listings = await loadSecurityBySymbol('VOD:XLON');
                log.debug('got listings', listings);
                const allMetric = await getAllSecurityMetrics(listings, ['2022-02-20', '2022-03-20']);
                log.debug('allMetric', allMetric);
                setMetric(allMetric);
            }
            retrieveData();
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
    } else if (metric.length > 0) {
        return (
            <div>
                {metric.map(m => (
                   <PlotElement key={m.symbol} figure={m}></PlotElement>
                ))}
            </div>
        )
    } else {
        return (<div></div>);
    }
}

export default App;