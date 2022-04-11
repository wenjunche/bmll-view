import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { PlotLineElement } from './PlotLineElement'
import { PlotAreaElement } from './PlotAreaElement'
import log from 'loglevel';
import { fin } from 'openfin-adapter/src/mock';

import store, { setInstrumentDataMap } from '../store';
import { ChartViewOptions, getBroadcastChannel, connectChannel } from '../common';

import '../index.css';

window.addEventListener("DOMContentLoaded",  async () => {
    getBroadcastChannel().onmessage = (event) => {
        log.debug('broadcastChannel.onmessag', event);
        store.dispatch(setInstrumentDataMap(event.data));
    }

    const rootElement = document.getElementById('root');
    if (rootElement) {
        const root = createRoot(rootElement);
        root.render(
            <Provider store={store}>
                <App /> 
            </Provider>
        );
    }

    await connectChannel();
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