import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import styled from 'styled-components';
import { fin } from 'openfin-adapter/src/mock';
import { launchView, FDC3, FDC3Instrument } from '../common';
import { MetricName } from '../datastore';

import '../index.css';

const testSecurities: FDC3Instrument[] = [
    { type: FDC3.ContextType, name: "Vodafone Group Plc", id: {ticker:"VOD",ISIN:"GB00BH4HKS39"}},
    { type: FDC3.ContextType, name: "Anglo American plc", id: {"ticker":"AAL", ISIN:"GB00B1XZS820"}},
    { type: FDC3.ContextType, name: "Associated British Foods plc", id:{"ticker":"ABF", ISIN:"GB0006731235"}},
    { type: FDC3.ContextType, name: "Admiral Group plc", id: {"ticker":"ADM", ISIN: "GB00B02J6398"}},
    { type: FDC3.ContextType, name: "Ashtead Group plc", id: {"ticker":"AHT", ISIN: "GB0000536739"}},
    { type: FDC3.ContextType, name: "Antofagasta plc", id:{"ticker":"ANTO", ISIN:"GB0000456144"}},
    // { type: FDC3.ContextType, name: "AAL", id: {ticker:"AAL"}},
    // { type: FDC3.ContextType, name: "AZN", id: {ticker:"AZN"}},
    // { type: FDC3.ContextType, name: "BARC", id: {ticker:"BARC" }},
    // { type: FDC3.ContextType, name: "BHP", id: {ticker:"BHP" }},
    // { type: FDC3.ContextType, name: "DGE", id: {ticker:"DGE" }},
    // { type: FDC3.ContextType, name: "GLEN", id: {ticker:"GLEN" }},
    // { type: FDC3.ContextType, name: "GSK", id: {ticker:"GSK" }},
    // { type: FDC3.ContextType, name: "HSBA", id: {ticker:"HSBA" }},
    // { type: FDC3.ContextType, name: "LLOY", id: {ticker:"LLOY" }},
    // { type: FDC3.ContextType, name: "LSEG", id: {ticker:"LSEG" }},
    // { type: FDC3.ContextType, name: "PRU", id: {ticker:"PRU" }},
    // { type: FDC3.ContextType, name: "RKT", id: {ticker:"RKT" }},
    // { type: FDC3.ContextType, name: "RDSA", id: {ticker:"RDSA" }},
    // { type: FDC3.ContextType, name: "REL", id: {ticker:"REL" }},
    // { type: FDC3.ContextType, name: "ULVR", id: {ticker:"ULVR" }},
    // { type: FDC3.ContextType, name: "AAPL", id: {ticker:"AAPL" }},
    // { type: FDC3.ContextType, name: "GOOG", id: {ticker:"GOOG" }},
    // { type: FDC3.ContextType, name: "TSLA", id: {ticker:"TSLA" }},
    // { type: FDC3.LegacyContextType, name: "JPM", id: {ticker:"JPM" }}, // example for using legacy context type
];
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

    testSecurities.push(...parseTickerList(XLONList, 'XLON'));
    testSecurities.push(...parseTickerList(XNASList, 'XNAS'));

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
    await launchView({ metric: MetricName.Custom, url: 'https://fdc3.finos.org/toolbox/fdc3-workbench/'} );
}

export const IsinDropdown: React.FC = () => {
    const isinSelectRef = useRef<HTMLSelectElement>();
    const fdc3ApiRef = useRef<HTMLSelectElement>();

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

    return (<SelectContainer>
        <SelectComponent ref={isinSelectRef}>
            { testSecurities.map(sec => (
                    <option key={sec.id.ISIN} value={sec.id.ticker}>{sec.id.ISIN?sec.id.ISIN:sec.id.ticker}</option>
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
