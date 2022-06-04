/**
 * @fileoverview Defines the Horizontal Basic Chart class.
 * @author Dayo Banjo
 * @copyright COSMOS 2021
 * @see PieChart
 */

/**
 * @classdesc Defines a line chart based on ApexCharts' zoomable timeseries - {@link https://apexcharts.com/javascript-chart-demos/line-charts/zoomable-timeseries/}.
 * @augments BaseChart
 */
 class PieChart extends BaseChart {
  /**
   * @inheritdoc
   */
  constructor(url, queryParams, wrapper = null, tooltipText = null, colors = ['#F44336', '#E91E63']) {
    super(url, queryParams, wrapper, tooltipText);
    this.categories = [];
    this.chart_params = {
      hideBorders: false,
      disableLabels: true,
      singleSerie: true,
      hideXAxis: true,
    };
  }

  /**
 * Fetch data and assign to object's value parameter(s).
 * @param {Object} data Dictionary such that (number of occurences, category).
 * @override
 */
setData(data) {
  this.series = [];
  for (const [key, value] of Object.entries(data)) {
    this.categories.push(key);
    this.series.push(value);
  }
  this.labels =  this.categories;
  this.data = {
    series: this.series,
    labels:  this.categories,
  };
  this.chart.updateOptions({
    labels : this.categories,
    legend: {
      show: true,
      labels: {
        useSeriesColors: true
      }
    }
  })
}

  /**
   * @inheritdoc
   * @override
   */
  getBaseOptions() {
    return _.merge(super.getBaseOptions(), {
     colors: ['#ff0000','#2C8DFF', "hsla(15,6%,40%,0.3)",
     "#00B19C", "#FFF1D0","#320E3B", "#DD1C1A", "#643173", "#D9BBF9", "#CCA7A2", "#AA9FB1"],
     series: [0, 0],
     labels : this.categories,
     legend: {
      show: false
    },
      chart: {
        type: "donut"
      },
      stroke: {
        show : false
      },
      plotOptions: {
        pie: {
          donut: {
            size: '90%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '22px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 600,
                color: undefined,
                offsetY: -10,
                formatter: function (val) {
                  return val
                }
              },
              value: {
                show: true,
                fontSize: '16px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 400,
                color: undefined,
                offsetY: 16,
                formatter: function (val) {
                  return val
                }
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Video',
                fontSize: '22px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: 600,
                color: '#FFF',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a, b) => {
                    return a + b
                  }, 0)
                }
              }
            }
          }
        }
      },
      responsive: [
        {
          breakpoint: 10,
          options: {
            chart: {
              width: 10
            },
            legend: {
              position: "right"
            }
          }
        }
      ]
    });
  }
}
