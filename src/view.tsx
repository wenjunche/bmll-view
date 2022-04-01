import React from 'react';
import ReactDOM from 'react-dom';

import { PlotLineElement } from './components/PlotLineElement'
import { PlotAreaElement } from './components/PlotAreaElement'
import log from 'loglevel';
import { fin } from 'openfin-adapter/src/mock';

import { InstrumentFigure, ChartViewOptions } from './common';
import './index.css';

window.addEventListener("DOMContentLoaded",  async () => {
    ReactDOM.render(<App />, document.getElementById('root'));
});

log.setLevel('debug');

const App: React.FC = () => {
    const [figure, setFigure] = React.useState<InstrumentFigure>();
    const [chartOptions, setChartOptions] = React.useState<ChartViewOptions>();

    React.useEffect(() => {
            const retrieveData = async() => {
                // @ts-ignore
                const opt = await fin.me.getOptions();
                setFigure(opt.customData.figure);
                setChartOptions(opt.customData);
            }
            retrieveData();
    }, []);

    if (chartOptions && figure && figure.data.length > 0) {
        if (chartOptions.chartType === 'line') {
            return (
                <PlotLineElement key={figure.metric} figure={figure.data} title={figure.metric} ></PlotLineElement>
            )
        }
        else if (chartOptions.chartType === 'area') {
            return (
                <PlotAreaElement key={figure.metric} figure={figure.data} title={figure.metric} stacking={chartOptions.stacking} ></PlotAreaElement>
            )
        } else {
            return (<div></div>);
        }
    } else {
        return (<div></div>);
    }
}

export default App;