import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import styled from 'styled-components';
import { fin } from 'openfin-adapter/src/mock';
import { FDC3 } from '../common';
import { launchView } from '../common';
import { MetricName } from '../datastore';

import '../index.css';


window.addEventListener("DOMContentLoaded",  async () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        const root = createRoot(rootElement);
        root.render(<IsinDropdown />);
    }

    const w = await (fin.me as OpenFin.View).getCurrentWindow();
    const layout = fin.Platform.Layout.wrapSync(w.identity);
    await layout.applyPreset({ presetType: 'grid' });
    await launchPartnerApp();
});

// const testISINs = ['GB00BH4HKS39', 'GB00B1XZS820', 'GB0006731235', 'GB00B02J6398', 'GB0000536739', 'GB0000456144'];
const testSecurities = [
    {"type":FDC3.LegacyContextType,"name":"Vodafone Group Plc","id":{"ticker":"VOD","ISIN":"GB00BH4HKS39"}},
    {"type":FDC3.LegacyContextType,"name":"Anglo American plc","id":{"ticker":"AAL","ISIN":"GB00B1XZS820"}},
    {"type":FDC3.LegacyContextType,"name":"Associated British Foods plc","id":{"ticker":"ABF","ISIN":"GB0006731235"}},
    {"type":FDC3.LegacyContextType,"name":"Admiral Group plc","id":{"ticker":"ADM","ISIN":"GB00B02J6398"}},
    {"type":FDC3.LegacyContextType,"name":"Ashtead Group plc","id":{"ticker":"AHT","ISIN":"GB0000536739"}},
    {"type":FDC3.LegacyContextType,"name":"Antofagasta plc","id":{"ticker":"ANTO","ISIN":"GB0000456144"}}
]

const launchPartnerApp = async() => {
//    await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com/news-headlines/?envComm=true'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com/market-watch/?envComm=true'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://mobile-test-phi.vercel.app/app/hello_interop.html'} );
    await launchView({ metric: MetricName.Custom, url: 'https://fdc3.finos.org/toolbox/fdc3-workbench/'} );
}

export const IsinDropdown: React.FC = () => {
    const isinSelectRef = useRef<HTMLSelectElement>();
    const fdc3ApiRef = useRef<HTMLSelectElement>();

    const onClickHandler = () => {
        if (isinSelectRef?.current && fdc3ApiRef?.current) {
            console.log(isinSelectRef.current.value);
            const context = testSecurities.filter(v => v.id.ISIN === isinSelectRef.current?.value)[0]
            // @ts-ignore
            // fdc3.raiseIntent(FDC3.IntentName, context);
            // fdc3ApiRef.current.innerText = `fdc3.raiseIntent(${FDC3.IntentName}, ${JSON.stringify(context)})`;
            // @ts-ignore
            fdc3.broadcast(context);
            fdc3ApiRef.current.innerText = `fdc3.broadcast(${JSON.stringify(context)})`;
        }
    }

    return (<SelectContainer>
        <SelectComponent ref={isinSelectRef}>
            { testSecurities.map(sec => (
                    <option key={sec.id.ISIN} value={sec.id.ISIN}>{sec.id.ISIN}</option>
                ))
            }
        </SelectComponent>
        <Button onClick={onClickHandler} >
            View Charts
        </Button>
        <FDC3APIInfo ref={fdc3ApiRef}/>
    </SelectContainer>);
}

const SelectContainer = styled.div`
    position: absolute;
    top: 20%;
    left: 20%;    
    
`;

const SelectComponent = styled.select`
    appearance: none;
    cursor: pointer;
    width: 120px;
`;

const Button = styled.button`
    cursor: pointer;
    border-radius: 2px;
    border: 0;
    box-sizing: border-box;
`;

const FDC3APIInfo = styled.div`    
`;
