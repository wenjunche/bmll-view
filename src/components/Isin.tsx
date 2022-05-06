import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import styled from 'styled-components';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellClickedEvent, GridReadyEvent, FirstDataRenderedEvent } from 'ag-grid-community';

import 'ag-grid-community/dist/styles/ag-grid.css';
//import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import 'ag-grid-community/dist/styles/ag-theme-balham-dark.css';

import { fin } from 'openfin-adapter/src/mock';
import { FDC3, FDC3Instrument } from '../common';
import { generateFakeTrades } from '../datastore'

import '../index.css';

const xlonData = require('../../data/xlon.json');
const xnasData = require('../../data/xnas.json');

const testSecurities: any[] = [];
const testTrades: any[] = [];
const TOP_XLONList = 'HEL,AZN,LIN,HSBC,UL,DEO,RIO,GSK,BP,BTI';
const TOP_XNASList = 'AAPL,MSFT,GOOG,AMZN,TSLA,BRK.A,FB,NVDA,JNJ,UNH';
const selectTickers = (list: string, data): any[] => {
    const tickers = list.split(',');
    return data.grid.filter(item => {
        return list.includes(item.Ticker);
    })
}

window.addEventListener("DOMContentLoaded",  async () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        const root = createRoot(rootElement);
        root.render(<IsinDropdown />);
    }

    testSecurities.length = 0;
    testSecurities.push(...selectTickers(TOP_XLONList, xlonData));
    testSecurities.push(... selectTickers(TOP_XNASList, xnasData));
    testTrades.push(...generateFakeTrades(testSecurities));
    testTrades.push(...generateFakeTrades(testSecurities));
    testTrades.push(...generateFakeTrades(testSecurities));
    testTrades.push(...generateFakeTrades(testSecurities));
    testTrades.push(...generateFakeTrades(testSecurities));

    const w = await (fin.me as OpenFin.View).getCurrentWindow();
    const layout = fin.Platform.Layout.wrapSync(w.identity);
    await layout.applyPreset({ presetType: 'grid' });

    await launchPartnerApp();
});

const launchPartnerApp = async() => {
//    await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com/news-headlines/?envComm=true'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com/market-watch/?envComm=true'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://my.apps.factset.com'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://mobile-test-phi.vercel.app/app/hello_interop.html'} );
    // await launchView({ metric: MetricName.Custom, url: 'https://fdc3.finos.org/toolbox/fdc3-workbench/'} );
}

export const IsinDropdown: React.FC = () => {
    const isinSelectRef = useRef<HTMLSelectElement>();
    const [columnDefs] = useState<Array<ColDef>>([
        { field: 'Account', resizable: true, autoHeight: true, sortable: true },
        { field: 'OrderID', resizable: true, autoHeight: true, sortable: true  },
        { field: 'Date', resizable: true, autoHeight: true, sortable: true  },
        { field: 'Ticker', resizable: true, autoHeight: true, sortable: true, filter: 'agTextColumnFilter'  },
        { field: 'Name', resizable: true, autoHeight: true, sortable: true, filter: 'agTextColumnFilter'  },
        { field: 'Side',  resizable: true, autoHeight: true , sortable: true },
        { field: 'OPOL',  resizable: true, autoHeight: true, sortable: true  },
        { field: 'Quantity',  resizable: true, autoHeight: true, sortable: true  },
        { field: 'Price',  resizable: true, autoHeight: true, sortable: true  },
        { field: 'CCY',  resizable: true, autoHeight: true, sortable: true  },
    ]);
    const [rowData] = useState(testTrades);

    const onCellClicked = (params: CellClickedEvent) => {
        console.log('Cell was clicked', params);
        const context: FDC3Instrument = {
            type: FDC3.ContextType,
            name: params.data.Name,
            id: {
                ticker: params.data.Ticker,
                ISIN: params.data.ISIN,
                MIC: params.data.OPOL
            }
        }
        // @ts-ignore
        fdc3.broadcast(context);        
        console.log(`fdc3.broadcast(${JSON.stringify(context)})`);
    }

    const onGridReady = (event: GridReadyEvent) => {
        setTimeout(() => {
            event.api.sizeColumnsToFit();
            event.columnApi.autoSizeAllColumns();
        }, 200);
    }

    const onFirstDataRendered = (event: FirstDataRenderedEvent) => {
        event.api.sizeColumnsToFit();
        event.columnApi.autoSizeAllColumns();
    }

    const onClickHandler = () => {
        if (isinSelectRef?.current) {
            console.log(isinSelectRef.current.value);
            const context = testSecurities.filter(v => v.id.ticker === isinSelectRef.current?.value)[0]
            // @ts-ignore
            // fdc3.raiseIntent(FDC3.IntentName, context);
            // fdc3ApiRef.current.innerText = `fdc3.raiseIntent(${FDC3.IntentName}, ${JSON.stringify(context)})`;
            // @ts-ignore
            fdc3.broadcast(context);
        }
    }

    return (
        <div className='ag-theme-balham-dark' style={{ height: '100%', width: '100%', position: 'absolute' }}>
            <AgGridReact
               rowData={rowData}
               columnDefs={columnDefs}
               onCellClicked={onCellClicked}
               onGridReady={onGridReady}
               onFirstDataRendered={onFirstDataRendered}
               suppressColumnVirtualisation={false}
            />
        </div>         
    );
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
    background-color: rgb(45, 52, 54);
    color: rgb(245, 245, 245);
`;
