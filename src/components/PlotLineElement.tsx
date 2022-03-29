import log from 'loglevel';
import React, { ReactNode, useRef } from 'react';

import {
    ListingMetric
} from '@bmll/dd-api';

import { createChart, ChartOptions, ColorType, LineStyle, IChartApi, ISeriesApi, SeriesType, SeriesOptionsMap } from 'lightweight-charts';
import { TradingViewFigure } from 'datastore';

const darkTheme:ChartOptions = {
    layout: {
        background: { type: ColorType.Solid, color: '#2B2B43'},
        backgroundColor: '#2B2B43',
        // lineColor: '#2B2B43',
        textColor: '#D9D9D9',
        fontSize: 11,
        fontFamily: `'Trebuchet MS', Roboto, Ubuntu, sans-serif`
    },
    grid: {
        vertLines: {
            color: '#2B2B43',
            style: LineStyle.Solid,
            visible: false
        },
        horzLines: {
            color: '#363C4E',
            style: LineStyle.Solid,
            visible: false
        },
    },
    // @ts-expect-error
    rightPriceScale: {
        borderVisible: false,
        visible: false
    },
    // @ts-expect-error
    timeScale: {
        borderVisible: false
    }
};

const lineColors = ['#8C61FF', '#FF8C4C', '#F4BF00', '#46C8F1', '#00CC88', '#FF5E60', '#FF8FB8', '#E9FF8F'];

interface TradingViewData {
    time: string;
    value: number;
}

const dataTransform = (dataInFigure: Array<ListingMetric>): Array<TradingViewData> => {
    const newData = dataInFigure.map(item => { 
        return {time: item.Date, value: item['Value']};
     });
     log.debug('TV data', newData);
     return newData;
};

const max = (data: Array<any>) => {
    return Math.max(...data.map(item => item.value));
}
const min = (data: Array<any>) => {
    return Math.min(...data.map(item => item.value));
}

export interface PlotLineElementProps {
    title?: string;
    figure: Array<TradingViewFigure>;
}

export const PlotLineElement:React.FC<PlotLineElementProps> = (props: PlotLineElementProps) => {
    const chartDiv = React.createRef<HTMLDivElement>();
    const legendDiv = React.createRef<HTMLDivElement>();
    const [title, setTitle] = React.useState<string>();
    const [figure, setFigure] = React.useState<Array<TradingViewFigure>>([]);
    const [chart, setChart] = React.useState<IChartApi>();
    const [series, setSeries] = React.useState<Array<ISeriesApi<'Line'>>>([]);
    const [bounds, setBounds] = React.useState();

    React.useEffect(() => {
        const updateBounds = async() => {
            // @ts-ignore
            const initBounds = await fin.me.getBounds();
            log.debug('PlotElement:setBounds', initBounds);
            setBounds(initBounds);
        }

        updateBounds();
        // @ts-ignore
        fin.me.addListener('shown', () => {
            log.debug('PlotElement:shown');
            updateBounds();
        });
        window.addEventListener('resize', () => {
            log.debug('PlotElement:resize');
            updateBounds();
        });        

    }, []);
    React.useEffect(() => {
        log.debug('setting figure');
        setTitle(props.title);
        setFigure(props.figure);
    }, []);


    React.useEffect(() => {
        const configChart = async() => {
            if (chartDiv.current != null && bounds) {
                if (!chart) {
                    // @ts-ignore
                    darkTheme.height = bounds.height;
                    // @ts-ignore
                    darkTheme.width  = bounds.width;
                    log.debug('creating chart', darkTheme);
                    const cc = createChart(chartDiv.current, darkTheme);
                    setChart(cc);
                }
                if (chart && bounds) {
                    // @ts-ignore
                    chart.resize(bounds.width, bounds.height, true);
                    chart.timeScale().fitContent();
                }
            } else {
                log.debug('PlotElement:configChart', bounds);
            }
        }
        configChart();
    }, [bounds]);


    const updateFigure = React.useCallback(() => {
        if (chartDiv.current && legendDiv.current && figure && figure.length > 0 && chart) {
            if (!series.length) {
                let colorIndex = 0;
                const lineCharts: Array<ISeriesApi<'Line'>> = [];
                const symbolList:Array<string> = [];
                figure.forEach( plot => {
                    const lineSeries = chart.addLineSeries({
                        color: lineColors[colorIndex],
                        lineWidth: 1,
                    });
                    lineSeries.setData(plot.data);
                    lineSeries.priceScale().applyOptions({ borderVisible: false });
                    lineSeries.applyOptions({ priceLineVisible: false});
                    colorIndex += 1;
                    lineCharts.push(lineSeries);
                    symbolList.push(plot.symbol);
                    if (colorIndex >= lineColors.length) {
                        log.warn('too many lines, too little color');
                    }
                } );
                chart.timeScale().fitContent();
                setSeries(lineCharts);
                legendDiv.current.innerText = `${title} (${symbolList.join(',')})`;
            }
        } else {
            log.debug('figure ready but no chart');
        }
    }, [chartDiv.current, legendDiv.current, figure, chart]);

    React.useEffect(() => {
        log.debug('updating figure');
        updateFigure();
    }, [chart, figure]);

    React.useEffect(() => {
        if (chartDiv.current) {
            const observer = new ResizeObserver(() => {
                if (chart && chartDiv.current) {
                    chart.resize(chartDiv.current.clientWidth, chartDiv.current.clientHeight);
                }
            });
            if (chart && chartDiv.current) {
                chart.resize(chartDiv.current.clientWidth, chartDiv.current.clientHeight);
            }
        observer.observe(chartDiv.current);
        }
    }, [chartDiv.current]);

    return (
        <div>
            <div ref={legendDiv} style={ {position: 'relative', height: '30px', left: '10px', zIndex: 2, color: 'white'} }>
            </div>
            <div ref={chartDiv} style={{ position: "relative", top: '-30px' }}>
            </div>
        </div>
    );
};
