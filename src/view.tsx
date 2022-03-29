import React from 'react';
import ReactDOM from 'react-dom';

import { PlotLineElement } from './components/PlotLineElement'
import log from 'loglevel';
import { fin } from 'openfin-adapter/src/mock';

import { TradingViewFigure,InstrumentFigure } from './datastore';
import './index.css';

window.addEventListener("DOMContentLoaded",  async () => {
    ReactDOM.render(<App />, document.getElementById('root'));
});

log.setLevel('debug');

const App: React.FC = () => {
    const [figure, setFigure] = React.useState<InstrumentFigure>();

    React.useEffect(() => {
            const retrieveData = async() => {
                // @ts-ignore
                const opt = await fin.me.getOptions();
                setFigure(opt.customData.figure);
            }
            retrieveData();
    }, []);

    if (figure && figure.data.length > 0) {
        return (
            <PlotLineElement key={figure.metric} figure={figure.data} title={figure.metric}></PlotLineElement>
        )
    } else {
        return (<div></div>);
    }
}

export default App;