import log from 'loglevel';
import React from 'react';
import { fin } from 'openfin-adapter/src/mock';

import * as Highcharts from 'highcharts';
import { HighChartsFigure, getDefaultChartOptions, getDefaultLineSeriesOptions, chartDateFormatter } from '../common';

export interface PlotLineElementProps {
    title?: string;
    figure: Array<HighChartsFigure>;
}

export const PlotLineElement:React.FC<PlotLineElementProps> = (props: PlotLineElementProps) => {
    const chartDiv = React.createRef<HTMLDivElement>();
    const [title, setTitle] = React.useState<string>();
    const [figure, setFigure] = React.useState<Array<HighChartsFigure>>([]);
    const [chart, setChart] = React.useState<Highcharts.Chart>();
    const [series, setSeries] = React.useState<Array<Highcharts.Series>>([]);
    const [bounds, setBounds] = React.useState<OpenFin.Bounds>();

    React.useEffect(() => {
        const updateBounds = async() => {
            const initBounds = await (fin.me as OpenFin.View).getBounds();
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
                    const options:Highcharts.Options = getDefaultChartOptions();
                    options.chart = {
                        height: bounds.height,
                        width: bounds.width
                    }
                    //@ts-ignore
                    options.yAxis.title.text = title;
                    //@ts-ignore
                    options.xAxis.labels.formatter = chartDateFormatter;
                    const cc = Highcharts.chart(chartDiv.current, options);
                    setChart(cc);
                }
                if (chart && bounds) {
                    chart.setSize(bounds.width, bounds.height, true);
                }
            } else {
                log.debug('PlotElement:configChart', bounds);
            }
        }
        configChart();
    }, [bounds]);


    const updateFigure = React.useCallback(() => {
        if (chartDiv.current && figure && figure.length > 0 && chart) {
            if (!series.length) {
                const lineCharts: Array<Highcharts.Series> = [];
                const symbolList:Array<string> = [];
                figure.forEach( plot => {
                    const lineSeries = chart.addSeries({ ...getDefaultLineSeriesOptions(), name: plot.symbol, data: plot.data });
                    lineCharts.push(lineSeries);
                    symbolList.push(plot.symbol);
                } );
                setSeries(lineCharts);
            }
        } else {
            log.debug('figure ready but no chart');
        }
    }, [chartDiv.current, figure, chart]);

    React.useEffect(() => {
        log.debug('updating figure');
        updateFigure();
    }, [chart, figure]);

    React.useEffect(() => {
        if (chartDiv.current) {
            const observer = new ResizeObserver(() => {
                if (chart && chartDiv.current) {
                    chart.setSize(chartDiv.current.clientWidth, chartDiv.current.clientHeight);
                }
            });
            if (chart && chartDiv.current) {
                chart.setSize(chartDiv.current.clientWidth, chartDiv.current.clientHeight);
            }
        observer.observe(chartDiv.current);
        }
    }, [chartDiv.current]);

    return (
        <div>
            <div ref={chartDiv}>
            </div>
        </div>
    );
};
