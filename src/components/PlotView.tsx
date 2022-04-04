import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { PlotLineElement } from './PlotLineElement'
import { PlotAreaElement } from './PlotAreaElement'
import log from 'loglevel';
import { fin } from 'openfin-adapter/src/mock';

import store, { setInstrumentDataMap } from '../store';
import { ChartViewOptions, getBroadcastChannel } from '../common';

import '../index.css';

window.addEventListener("DOMContentLoaded",  async () => {
    ReactDOM.render(
        <Provider store={store}>
            <App /> 
        </Provider>,
        document.getElementById('root'));

    getBroadcastChannel().onmessage = (event) => {
        log.debug('broadcastChannel.onmessag', event);
        store.dispatch(setInstrumentDataMap(event.data));
    }    
});

log.setLevel('debug');

const App: React.FC = () => {
    const [chartOptions, setChartOptions] = React.useState<ChartViewOptions>();

    React.useEffect(() => {
            const retrieveData = async() => {
                // @ts-ignore
                const opt = await fin.me.getOptions();
                setChartOptions(opt.customData);
            }
            retrieveData();
    }, []);

    if (chartOptions) {
        if (chartOptions.chartType === 'line') {
            return (
                <PlotLineElement key={chartOptions.metric} title={chartOptions.metric} metric={chartOptions.metric}></PlotLineElement>
            )
        }
        else if (chartOptions.chartType === 'area') {
            return (
                <PlotAreaElement key={chartOptions.metric} title={chartOptions.metric} metric={chartOptions.metric} stacking={chartOptions.stacking} ></PlotAreaElement>
            )
        } else {
            return (<div></div>);
        }
    } else {
        return (<div></div>);
    }
}

export default App;