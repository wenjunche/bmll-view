import * as Highcharts from 'highcharts';
import { BrowserCreateWindowRequest, BrowserWindowModule, getCurrentSync, Page, PageWithUpdatableRuntimeAttribs, WorkspacePlatformModule, PageLayout } from '@openfin/workspace-platform';
import { LayoutExtended } from '@openfin/workspace';
import { InstrumentDataMap, MetricName } from 'datastore';
import store, {setISIN} from './store';
import log from 'loglevel';
import { Fin } from 'openfin-adapter';

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
    metric: MetricName;
    chartType: 'line' | 'area';
    targetIdentity?: OpenFin.Identity;
    stacking?: string;
}


export enum FDC3  {
    IntentName = 'ShowInstrument',
    ContextType = 'fdc3.instrument',
}

export const createViewIdentity = (uuid: string, name: string): OpenFin.Identity => {
    const viewIdentity: OpenFin.Identity = { uuid: uuid, name: `${window.crypto.randomUUID()}-${name}` };
    return viewIdentity;
}

async function createPageLayout(layout): Promise<PageLayout> {
    const layoutId: string = `layout-${window.crypto.randomUUID()}`;
    return {
        ...layout,
        layoutDetails: { layoutId }
    } as PageLayout;
  }
  
  export interface BrowserWindowOptions {
    title: string;
    layout: PageLayout;
}
  
async function createPageWithLayout(options: BrowserWindowOptions): Promise<PageWithUpdatableRuntimeAttribs> {
    const {title, layout} = options;
    const layoutWithDetails = await createPageLayout(layout);
    return {
        pageId: window.crypto.randomUUID(),
        title,
        layout: layoutWithDetails,
        isReadOnly: false,
        hasUnsavedChanges: true
    };
}

export async function createBrowserWindow(options: BrowserWindowOptions): Promise<BrowserWindowModule> {
    const platform: WorkspacePlatformModule = getCurrentSync();
    const page: Page = await createPageWithLayout(options);
    const pages: Page[] = [page];
  
    const reqOptions: BrowserCreateWindowRequest = {
        workspacePlatform: { pages },
        defaultCentered: true,
        defaultHeight: 900,
        defaultWidth: 900,
        fdc3InteropApi: '1.2'      
    };
    const createdBrowserWin: BrowserWindowModule = await platform.Browser.createWindow(reqOptions);
    return createdBrowserWin;
}

const BroadCastChannelName = 'chart-plot-data';
let plotDataBroadcastChannel: BroadcastChannel;
export const getBroadcastChannel = ():BroadcastChannel => {
    if (!plotDataBroadcastChannel) {
        log.debug(`creating broadcast channel ${BroadCastChannelName}`);
        plotDataBroadcastChannel = new BroadcastChannel(BroadCastChannelName);
    }
    return plotDataBroadcastChannel;
}

export const broadcastPlotData = (data: InstrumentDataMap) => {
    log.debug('broadcastPlotData', data);
    getBroadcastChannel().postMessage(data);
}

let viewChannel:OpenFin.ChannelProvider;
export const listenChannelConnection = async (listener) => {
    viewChannel = await fin.InterApplicationBus.Channel.create(BroadCastChannelName);
    viewChannel.onConnection(listener);
}

export const connectChannel = async () => {
    return fin.InterApplicationBus.Channel.connect(BroadCastChannelName);
}