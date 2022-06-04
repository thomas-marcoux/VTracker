/**
 * @fileoverview Defines the LineChart class.
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see LineChart
 */

/**
 * @classdesc Defines a line chart based on ApexCharts' zoomable timeseries - {@link https://apexcharts.com/javascript-chart-demos/line-charts/zoomable-timeseries/}.
 * @augments BaseChart
 */
 class LineChart extends BaseChart {
  /**
   * @inheritdoc
   */
  constructor(url, queryParams, wrapper = null, tooltipText = null, colors = ['#FF0000', '#0000FF'], type="gradient") {
    super(url, queryParams, wrapper, tooltipText);
    this.colors = colors
    this.fillType = type
    this.chart_params = {
      hideBorders: false,
      disableLabels: true,
      singleSerie: true,
      hideXAxis: true,
    };
  }

  updateColors(colors = []){
    this.colors = colors;
  }

  /**
   * @inheritdoc
   * @override
   */
  getBaseOptions() {
    return _.merge(super.getBaseOptions(), {
     colors: this.colors,

      series: [
        {
          name: this.tooltipText,
        },
      ],
      chart: {
        type: "area",
        stacked: false,
        zoom: {
          type: "x",
          enabled: true,
          autoScaleYaxis: false,
        },
        toolbar: {
          autoSelected: "zoom",
        },
      },
      markers: {
        size: 0,
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.5,
          opacityTo: 0,
          stops: [50, 90, 100],
        },
      },
      xaxis: {
        type: "datetime",
      },
    });
  }
}
