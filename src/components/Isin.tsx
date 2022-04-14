import React, { useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellClickedEvent, GridReadyEvent, FirstDataRenderedEvent } from 'ag-grid-community';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

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
    await launchFactSet();
});

const securities = [
    { name: 'VODAFONE GROUP PLC', isin: 'GB00BH4HKS39'}, 
    { name: 'ANGLO AMERICAN PLC', isin: 'GB00B1XZS820'}, 
    { name: 'ASSOCIATED BRITISH FOODS PLC', isin: 'GB0006731235'}, 
    { name: 'ADMIRAL GROUP PLC', isin: 'GB00B02J6398'}, 
    { name: 'ASHTEAD GROUP PLC', isin: 'GB0000536739'}, 
    { name: 'ANTOFAGASTA PLC', isin: 'GB0000456144'} ];

const launchFactSet = async() => {
//    await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com/news-headlines/?envComm=true'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com/market-watch/?envComm=true'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://cyhir.csb.app/chart.publisher.html'} );
}

export const IsinDropdown: React.FC = () => {
    const isinSelectRef = useRef<HTMLSelectElement>();
    const fdc3ApiRef = useRef<HTMLSelectElement>();
    const [columnDefs] = useState<Array<ColDef>>([
        { field: 'name', resizable: true, autoHeight: true  },
        { field: 'isin', resizable: true, autoHeight: true  },
    ]);
    const [rowData] = useState(securities);

    const onCellClicked = (params: CellClickedEvent) => {
        console.log('Cell was clicked', params);
        const context2 = { type: FDC3.LegacyContextType, id: { ISIN: params.data.isin } };
        // @ts-ignore
        fdc3.broadcast(context2);
        if (fdc3ApiRef.current) {
            fdc3ApiRef.current.innerText = `fdc3.broadcast(${JSON.stringify(context2)})`;
        }
}

    const onGridReady = (event: GridReadyEvent) => {
        event.api.sizeColumnsToFit();
        event.columnApi.autoSizeAllColumns();
        console.log(event.api.getDataAsCsv());
    }

    const onFirstDataRendered = (event: FirstDataRenderedEvent) => {
        event.columnApi.autoSizeAllColumns();
    }

    const onClickHandler = () => {
        if (isinSelectRef?.current && fdc3ApiRef?.current) {
            console.log(isinSelectRef.current.value);
            const context = { type: FDC3.ContextType, id: { ticker: isinSelectRef.current.value} };
            // @ts-ignore
            // fdc3.raiseIntent(FDC3.IntentName, context);
            // fdc3ApiRef.current.innerText = `fdc3.raiseIntent(${FDC3.IntentName}, ${JSON.stringify(context)})`;
            const context2 = { type: FDC3.LegacyContextType, id: { ticker: isinSelectRef.current.value,
                                ISIN: isinSelectRef.current.value } };
            // @ts-ignore
            fdc3.broadcast(context2);
            fdc3ApiRef.current.innerText = `fdc3.broadcast(${JSON.stringify(context2)})`;
        }
    }

    return (
        <div className='ag-theme-alpine' style={{ height: 360, width: 500, position: 'absolute', top: '20%', left: '20%' }}>
        {/* <SelectComponent ref={isinSelectRef}> */}
            <AgGridReact
               rowData={rowData}
               columnDefs={columnDefs}
               onCellClicked={onCellClicked}
               onGridReady={onGridReady}
               onFirstDataRendered={onFirstDataRendered}
               suppressColumnVirtualisation={false}
            />                

        {/* </SelectComponent> */}
        {/* <Button onClick={onClickHandler} >
            View Charts
        </Button> */}
        <FDC3APIInfo ref={fdc3ApiRef}/>
    </div>);
}

const SelectContainer = styled.div`
    position: absolute;
    top: 20%;
    left: 20%;
    width: 400px;
    height: 400px;
    className: 'ag-theme-alpine';
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
