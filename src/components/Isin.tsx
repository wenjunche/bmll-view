import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { fin } from 'openfin-adapter/src/mock';
import { FDC3 } from '../common';

import '../index.css';


window.addEventListener("DOMContentLoaded",  async () => {
    ReactDOM.render(<IsinDropdown />, document.getElementById('root'));
});

const testISINs = ['GB00BH4HKS39', 'GB00B1XZS820', 'GB0006731235', 'GB00B02J6398', 'GB0000536739', 'GB0000456144'];

export const IsinDropdown: React.FC = () => {
    const isinSelectRef = useRef<HTMLSelectElement>();
    const fdc3ApiRef = useRef<HTMLSelectElement>();

    const onClickHandler = () => {
        if (isinSelectRef?.current && fdc3ApiRef?.current) {
            console.log(isinSelectRef.current.value);
            const context = { type: FDC3.ContextType, id: { ticker: isinSelectRef.current.value} };
            // @ts-ignore
            fdc3.raiseIntent(FDC3.IntentName, context);
            fdc3ApiRef.current.innerText = `fdc3.raiseIntent(${FDC3.IntentName}, ${JSON.stringify(context)})`;
        }
    }

    return (<SelectContainer>
        <SelectComponent ref={isinSelectRef}>
            { testISINs.map(isin => (
                    <option key={isin} value={isin}>{isin}</option>
                ))
            }
        </SelectComponent>
        <Button onClick={onClickHandler} >
            Let's Rock
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
