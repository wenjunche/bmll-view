import React from 'react';
import ReactDOM from 'react-dom';

import { PlotElement } from './components/PlotElement'
import log from 'loglevel';
import { fin } from 'openfin-adapter/src/mock';

import { TradingViewFigure } from './datastore';
import './index.css';

window.addEventListener("DOMContentLoaded",  async () => {
    ReactDOM.render(<App />, document.getElementById('root'));
});

log.setLevel('debug');

const App: React.FC = () => {
    const [figure, setFigure] = React.useState<TradingViewFigure>();

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
            <PlotElement key={figure.symbol} figure={figure}></PlotElement>
        )
    } else {
        return (<div></div>);
    }
}

export default App;