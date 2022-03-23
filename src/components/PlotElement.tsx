import log from 'loglevel';
import React, { ReactNode, useRef } from 'react';

import {
    ListingMetric
} from '@bmll/dd-api';

import { createChart, ChartOptions, ColorType, LineStyle, IChartApi, ISeriesApi, PriceScaleMode, SeriesType } from 'lightweight-charts';

var darkTheme:ChartOptions = {
    height: 300,
    width: 900,
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

export interface PlotElementProps {
    title?: string;
    figure: TradingViewData[];
}

export const PlotElement:React.FC<PlotElementProps> = (props: PlotElementProps) => {
    const chartDiv = React.createRef<HTMLDivElement>();
    const [data, setData] = React.useState([]);
    const [chart, setChart] = React.useState<IChartApi>();
    const [series, setSeries] = React.useState<ISeriesApi<SeriesType>[]>([]);
    const { figure } = props;

    React.useEffect(() => {
        if (chartDiv.current != null) {
            const cc = createChart(chartDiv.current, darkTheme);
            cc.timeScale().fitContent();
            setChart(cc);
        }
    }, []);

    React.useEffect(() => {
        // @ts-ignore
        setData(figure);
    }, [figure]);

    React.useEffect(() => {
        if (chartDiv.current && data.length > 0 && chart) {
            series.forEach(serie => chart?.removeSeries(serie));
            const newSeries:Array<ISeriesApi<SeriesType>> = [];
            const areaSeries = chart.addAreaSeries({
                topColor: 'rgba(140, 97, 255, 0.3)',
                bottomColor: 'rgba(140, 97, 255, 0)',
                lineColor: '#8C61FF',
                lineWidth: 1,
            });
            areaSeries.setData(data);
            areaSeries.priceScale().applyOptions({ borderVisible: false });
            areaSeries.applyOptions({ priceLineVisible: false});
            chart.timeScale().fitContent();
            newSeries.push(areaSeries);
            setSeries(newSeries);
        }
    }, [data]);


    return (
        <div ref={chartDiv} style={{ position: "relative" }}>
            <div
                style={{
                    position: "absolute",
                    zIndex: 2,
                    padding: 10,
                }}
            />
        </div>
    );
};
