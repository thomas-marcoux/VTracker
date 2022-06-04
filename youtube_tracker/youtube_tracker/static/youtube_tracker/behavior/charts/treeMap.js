/**
 * @fileoverview Defines the LineChart class.
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see TreeMap
 */

/**
 * @classdesc Defines a line chart based on ApexCharts' zoomable timeseries - {@link https://apexcharts.com/javascript-chart-demos/line-charts/zoomable-timeseries/}.
 * @augments BaseChart
 */
class TreeMap extends BaseChart {
  /**
   * @inheritdoc
   */
  constructor(url, queryParams, wrapper = null, tooltipText = null) {
    super(url, queryParams, wrapper, tooltipText);
    this.chart_params = {
      hideBorders: true,
      disableLabels: false,
      singleSerie: true,
      hideXAxis: false,

    };
  }

  /**
   * @inheritdoc
   * @override
   */
  getBaseOptions() {
    return _.merge(super.getBaseOptions(), {
      chart: {
        type: "treemap",
      },
      legend: {
        show: false,
      },
      tooltip: {
        followCursor: true,
      },
    });
  }
}
