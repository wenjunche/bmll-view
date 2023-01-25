import log from 'loglevel';
import React from 'react';
import { useSelector } from 'react-redux';

import * as Highcharts from 'highcharts';
import { getDefaultChartOptions, getDefaultLineSeriesOptions, chartDateFormatter, InstrumentFigure, getDefaultChartTitleOptions, getChartTitle } from '../common';
import { getSelector } from '../store'

export interface PlotLineElementProps {
    metric: string
}

export const PlotLineElement:React.FC<PlotLineElementProps> = (props: PlotLineElementProps) => {
    const chartDiv = React.createRef<HTMLDivElement>();
    const [figure, setFigure] = React.useState<InstrumentFigure>();
    const [chart, setChart] = React.useState<Highcharts.Chart>();
    const [series, setSeries] = React.useState<Array<Highcharts.Series>>([]);
    const [bounds, setBounds] = React.useState<OpenFin.Bounds>();
    const storeFigure = useSelector(getSelector(props.metric));

    React.useEffect(() => {
        log.debug('store changed', storeFigure);
        setFigure(storeFigure);
    }, [storeFigure])

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
        const configChart = async() => {
            if (chartDiv.current != null && bounds) {
                if (!chart) {
                    const options:Highcharts.Options = getDefaultChartOptions();
                    options.chart = {
                        height: bounds.height,
                        width: bounds.width
                    }
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
        if (chartDiv.current && figure && figure.data && chart) {
            if (series.length > 0) {
                series.forEach(s => s.remove(false));
            }
            const lineCharts: Array<Highcharts.Series> = [];
            figure.data.forEach( plot => {
                const lineSeries = chart.addSeries({ ...getDefaultLineSeriesOptions(), name: plot.symbol, data: plot.data });
                lineCharts.push(lineSeries);
            } );
            setSeries(lineCharts);
        } else {
            log.debug('figure ready but no chart');
        }
        if (chart && figure) {
            const charTitle = getDefaultChartTitleOptions();
            charTitle.text = getChartTitle(figure.instrument, figure.metric);
            chart.setTitle(charTitle)
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
