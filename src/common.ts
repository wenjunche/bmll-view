import * as Highcharts from 'highcharts';

const lineColors = ['#8C61FF', '#FF8C4C', '#F4BF00', '#46C8F1', '#00CC88', '#FF5E60', '#FF8FB8', '#E9FF8F'];
Highcharts.setOptions({
    colors: lineColors,
    chart: {
        backgroundColor: '#2B2B43',        
    },
    xAxis: {
        gridLineWidth: 0,
        lineColor: '#D9D9D9',
        tickColor: '#D9D9D9',
        labels: {
            style: {
                color: '#D9D9D9',
                font: '11px Trebuchet MS, Verdana, sans-serif'
            }
        }
    },
    yAxis: {
        gridLineWidth: 0,
        lineColor: '#D9D9D9',
        tickColor: '#D9D9D9',
        labels: {
            style: {
                color: '#D9D9D9',
                font: '11px Trebuchet MS, Verdana, sans-serif'
            }
        }
    },
    credits: {
        enabled: true,
        href: 'https://openfin.co',
        text: 'OpenFin'
    }, 
});

export enum ChartStyle  {
    TextColor = '#D9D9D9'
}

export const chartDateFormatter: Highcharts.AxisLabelsFormatterCallbackFunction = function() {
    // @ts-ignore
    return Highcharts.dateFormat('%b %e', this.value as number);
}

export type HighChartsDataPoint = [ number, number ]; // timestamp, value

export interface HighChartsFigure {
    symbol: string;  // MIC
    data: Array<HighChartsDataPoint>
}

export interface InstrumentFigure {
    metric: string;
    data: Array<HighChartsFigure>;
}

const defaultChartOptions:Highcharts.Options = {
    title: {
        text: 'Hightcharts line'
    },
    yAxis: {
        title: {
            text: 'yAxis Title',
            style: { color: ChartStyle.TextColor }
        }
    },
    xAxis: {
        type: 'datetime',
        labels: {
        },
        accessibility: {
            // @TODO add later
        }
    },
    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        itemStyle: { color: ChartStyle.TextColor }
    },
    tooltip: {        
    },
    plotOptions: {
        series: {
            marker: {
                enabled: false
            }            
        },
        area: {            
        }        
    },
};

export const getDefaultChartOptions = ():Highcharts.Options => {
    // deep-clone here so some attributes can be updated/added
    return JSON.parse(JSON.stringify(defaultChartOptions));    
}

const defaultLineSeriesOptions:Highcharts.SeriesLineOptions = {
    type: 'line',
    lineWidth: 1,
    allowPointSelect: false,
}

export const getDefaultLineSeriesOptions = ():Highcharts.SeriesLineOptions => {
    return JSON.parse(JSON.stringify(defaultLineSeriesOptions));    
}

const defaultAreaSeriesOptions:Highcharts.SeriesAreaOptions = {
    type: 'area',
    lineWidth: 1,
    allowPointSelect: false,
}
export const getDefaultAreaSeriesOptions = ():Highcharts.SeriesLineOptions => {
    return JSON.parse(JSON.stringify(defaultAreaSeriesOptions));    
}


export interface ChartViewOptions {
    figure?: InstrumentFigure;
    chartType: 'line' | 'area';
    targetIdentity?: OpenFin.Identity,
    stacking?: string;
}
