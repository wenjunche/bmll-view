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

import '../index.css';

const xlonData = require('../../data/xlon.json');
const xnasData = require('../../data/xnas.json');

const testSecurities: any[] = [];
const XNASList = 'AAPL,ADBE,ADI,ADP,ADSK,AEP,AEP,ALGN,AMAT,AMD,AMGN,AMZN,ANSS,ASML,ATVI,AVGO,BIDU,BIIB,BKNG,CDNS,CDW,CERN,CHKP,CHTR,CMCSA,COST,CPRT,CRWD,CSCO,CSX,CTAS,CTSH,DLTR,DOCU,DXCM,EA,EBAY,EXC,EXC,FAST,FB,FISV,FOX,FOXA,GILD,GOOG,GOOGL,HON,HON,IDXX,ILMN,INCY,INTC,INTU,ISRG,JD,KDP,KDP,KHC,KLAC,LRCX,LULU,MAR,MCHP,MDLZ,MELI,MNST,MRNA,MRVL,MSFT,MTCH,MU,NFLX,NTES,NVDA,NXPI,OKTA,ORLY,PAYX,PCAR,PDD,PEP,PEP,PTON,PYPL,QCOM,REGN,ROST,SBUX,SGEN,SIRI,SNPS,SPLK,SWKS,TCOM,TEAM,TMUS,TSLA,TXN,VRSK,VRSN,VRTX,WBA,WDAY,WDAY,XEL,XEL';
const XLONList = 'AAL,ABDN,ABF,ADM,AHT,ANTO,AUTO,AV.,AVST,AVV,AZN,BA.,BARC,BATS,BDEV,BHP,BKG,BLND,BME,BNZL,BP.,BRBY,BT.A,CCH,CPG,CRDA,CRH,DCC,DGE,DOCS,ENT,EVR,EXPN,FERG,FLTR,FRES,GLEN,GSK,HIK,HL.,HLMA,HSBA,IAG,ICP,IHG,III,IMB,INF,ITRK,ITV,JD.,JMAT,KGF,LAND,LGEN,LLOY,LSEG,MNDI,MNG,MRO,NG.,NWG,NXT,OCDO,PHNX,POLY,PRU,PSN,PSON,RDSB,REL,RIO,RKT,RMG,RMV,RR.,RTO,SBRY,SDR,SGE,SGRO,SKG,SMDS,SMIN,SN.,SPX,SSE,STAN,STJ,SVT,THG,TSCO,TW.,ULVR,UU.,VOD,WEIR,WPP,WTB';
const parseTickerList = (list: string, mic: string):FDC3Instrument[] => {
    return list.split(',').map(value => {
        return { type: FDC3.ContextType, name: value, id: { ticker: value}, mic };
    });
}

window.addEventListener("DOMContentLoaded",  async () => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
        const root = createRoot(rootElement);
        root.render(<IsinDropdown />);
    }

    testSecurities.length = 0;
    testSecurities.push(...xlonData.grid);
    testSecurities.push(...xnasData.grid);
    testSecurities.sort((s1, s2) =>{
        return s1.Ticker.localeCompare(s2.Ticker);
    });

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
    const fdc3ApiRef = useRef<HTMLSelectElement>();
    const [columnDefs] = useState<Array<ColDef>>([
        { field: 'Ticker', resizable: true, autoHeight: true  },
        { field: 'Name', resizable: true, autoHeight: true  },
        { field: 'ISIN',  resizable: true, autoHeight: true  },
        { field: 'OPOL',  resizable: true, autoHeight: true  },
        { field: 'Currency Code',  resizable: true, autoHeight: true  },
    ]);
    const [rowData] = useState(testSecurities);

    const onCellClicked = (params: CellClickedEvent) => {
        console.log('Cell was clicked', params);
        const context: FDC3Instrument = {
            type: FDC3.ContextType,
            name: params.data.Name,
            id: {
                ticker: params.data.Ticker,
                ISIN: params.data.ISIN
            },
            mic: params.data.OPOL
        }
        // @ts-ignore
        fdc3.broadcast(context);
        if (fdc3ApiRef.current) {
            fdc3ApiRef.current.innerText = `fdc3.broadcast(${JSON.stringify(context)})`;
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
            const context = testSecurities.filter(v => v.id.ticker === isinSelectRef.current?.value)[0]
            // @ts-ignore
            // fdc3.raiseIntent(FDC3.IntentName, context);
            // fdc3ApiRef.current.innerText = `fdc3.raiseIntent(${FDC3.IntentName}, ${JSON.stringify(context)})`;
            // @ts-ignore
            fdc3.broadcast(context);
            fdc3ApiRef.current.innerText = `fdc3.broadcast(${JSON.stringify(context)})`;
        }
    }

    return (
        <div className='ag-theme-balham-dark' style={{ height: 360, width: 610, position: 'absolute', top: '20%', left: '20%' }}>
            <AgGridReact
               rowData={rowData}
               columnDefs={columnDefs}
               onCellClicked={onCellClicked}
               onGridReady={onGridReady}
               onFirstDataRendered={onFirstDataRendered}
               suppressColumnVirtualisation={false}
            />
            <FDC3APIInfo ref={fdc3ApiRef}/>
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
