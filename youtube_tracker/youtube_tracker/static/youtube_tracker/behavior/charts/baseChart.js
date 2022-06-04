/**
 * @fileoverview Defines the BaseChart class.
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see BaseChart
 */

/**
 * The color of text on charts.
 * @constant {string}
 * @default
 */
const TEXT_COLOR = "#FFFFFF";
/**
 * The main color theme of the charts.
 * @constant {string}
 * @default
 */
const CHART_COLOR = "#FF0000";

/**
 * The default height of the charts.
 * @constant {integer}
 * @default
 */
 const FIGURE_HEIGHT = 350;

/**
 * @abstract
 * @classdesc Defines basic ApexCharts figure behavior.
 */
class BaseChart {
  /**
   * @param {string} url The url to use to collect data.
   * @param {Object} queryParams The parameters to send to the data fetching query.
   * @param {Element} wrapper The figure's parent wrapper.
   * @param {string} tooltipText Prefix to display on tooltip.
   */
  constructor(url, queryParams, wrapper = null, tooltipText = null) {
    this.chart;
    this.wrapper = wrapper;
    this.url = "/" + url;
    this.queryParams = queryParams;
    this.tooltipText = tooltipText;
    this.chart_params = {
      hideBorders: false, //Hides chart strokes, for charts with no dates.
      disableLabels: false, //Hide labels on top of charts.
      singleSerie: false, //Hides duplicate tooltips for charts showing data for only a single series.
    };
  }

  /**
   * Initializes options and renders an empty chart.
   */
  render() {
    let options = this.getBaseOptions();
    this.chart = new ApexCharts(this.wrapper, options);
    this.chart.render();
  }

  /**
   * Fetch data and update chart.
   */
  update() {
    this.updateData().then(() => {
      this.chart.updateSeries(this.series);
    });
  }

  /**
   * Fetch data and assign to object's value parameter(s).
   * @returns {Promise} Promise resolved once data is fetched.
   */
  updateData() {
    return new Promise((resolve) => {
      fetchData(this.queryParams, this.url).then((response) => {
       // console.log("The data fetched is", this.url, response);
        this.setData(response.series);
        resolve(response);
      });
    });
  }

  /**
   * Return the full options of the loaded graph. This is especially useful if multiple graphs share one wrapper and morph into one another.
   * @returns {Object} Options dictionary.
   */
  getOptions() {
    return _.merge(this.getBaseOptions(), { series: this.series });
  }

  /**
   * Format data to be displayed in the chart.
   * @param {Object} data response data.
   */
  setData(data) {
    this.series = data;
  }

  /**
   * Get default options of the empty graph.
   * @return {Object} default options.
   */
  getBaseOptions() {
    let options = {
      series: [
        {
          data: [],
        },
      ],
      chart: {
        height: FIGURE_HEIGHT,
        foreColor: TEXT_COLOR,
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: [TEXT_COLOR],
        },
      },
      grid: {
        show: false,
      },
      colors: [CHART_COLOR],
      fill: {
        opacity: 1,
      },
      noData: {
        text: "Loading...",
      },
      tooltip: {
        intersect: false,
        marker: false,
        shared: false,
        theme: "dark",
        x: {
          show: true,
        },
        y: {
          formatter: function (val) {
            return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          },
        },
      },
      xaxis: {
        categories: [],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: true,
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: true,
        },
        labels: {
          formatter: abbreviateNumber,
        },
      },
    };

    if (this.chart_params.hideBorders) {
      options.stroke = {
        show: false,
        width: 2,
        colors: ["transparent"],
      };
    }

    if (this.chart_params.hideXAxis) {
      options.xaxis.axisTicks.show = false;
    }

    if (this.chart_params.hideYAxis) {
      options.yaxis.axisTicks.show = false;
    }

    if (this.chart_params.disableLabels) {
      options.dataLabels.enabled = false;
    }

    if (this.chart_params.singleSerie) {
      options.tooltip.x.show = false;
    }

    return options;
  }
}
