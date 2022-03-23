import { configureAmplify } from './auth'
import { Login } from './components/Login';
import React from 'react';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

import { initApiClient, loadSecurityBySymbol, getSecurityMetrics } from './datastore';

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
const onLogin = async(me) => {
    log.info('logged in as', me);
    await initApiClient();
    const listings = await loadSecurityBySymbol('VOD:XLON');
    log.debug('got listings', listings);
    // const listings2 = await getListings(listings[0]);
    // log.debug('got listings2', listings2);
    const listingMetric = await getSecurityMetrics(listings[0], ['2022-02-20', '2022-03-20']);
    log.debug('listingMetric', listingMetric);
}

const App: React.FC = () => {
    return (<Login onLogin={onLogin}></Login>);
}

export default App;