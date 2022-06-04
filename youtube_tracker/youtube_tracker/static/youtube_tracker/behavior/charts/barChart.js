/**
 * @fileoverview Defines the BarChart class.
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see BarChart
 */

/**
 * @classdesc Defines a bar chart based on ApexCharts' basic column chart - {@link https://apexcharts.com/javascript-chart-demos/column-charts/basic/}.
 * @augments BaseChart
 */
class BarChart extends BaseChart {
    
  /**
   * @inheritdoc
   */
    constructor(url, queryParams, wrapper = null, tooltipText = null, 
      isHorizontal = false, borderRadius=0, isDistributed=false, hideLegend=false) {
    super(url, queryParams, wrapper, tooltipText);
    this.isHorizontal = isHorizontal
    this.borderRadius = borderRadius
    this.isDistributed = isDistributed
    this.hideLegend = hideLegend
    this.chart_params = {
      hideBorders: true,
      disableLabels: true,
      singleSerie: true,
      hideXAxis: true,
    };
  }

  /**
   * @inheritdoc
   * @override
   */
  update() {
    this.updateData().then(() => {
      this.chart.updateOptions(this.data);
    });
  }

  /**
   * @inheritdoc
   * @override
   */
  getOptions() {
    return _.merge(this.getBaseOptions(true), this.data);
  }

  /**
   * Fetch data and assign to object's value parameter(s).
   * @param {Object} data Dictionary such that (number of occurences, category).
   * @override
   */
  setData(data) {
    this.series = [];
    this.categories = [];
    for (const [key, value] of Object.entries(data)) {
      this.categories.push(key);
      this.series.push(value);
    }
    this.data = {
      series: [{ data: this.series }],
      xaxis: {
        axisBorder: { show: false },
      axisTicks: { show: false },
         categories: this.categories
      },
      yaxis: {
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        }
      }
    };
  }

  /**
   * @inheritdoc
   * @override
   */
  getBaseOptions() {
    return _.merge(super.getBaseOptions(), {
   
      colors: ['#FF0000', '#2E93fA', '#66DA26', '#546E7A', '#E91E63', '#FF9800'],
      series: [
        {
          name: this.tooltipText,
        },
      ],
      grid: {
        yaxis: {
          lines: {
            show: false
          }
        }
      }, 
      dataLabels: {
        enabled: false,
        style: {
          colors: ['#F44336', '#E91E63', '#9C27B0'],
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold'
        }
      },
      chart: {
        type: "bar",
        toolbar: {
          show: false,
          tools: {
            download: false
          }
        }
      },
      legend: {
        show: this.hideLegend 
      },
      grid: {
        show: false,
      },
      plotOptions: {
        bar: {
          distributed: this.isDistributed,
          horizontal: this.isHorizontal,
          borderRadius: this.borderRadius,
          startingShape: "rounded",
          endingShape: "rounded",
          columnWidth: '15%',
          barHeight: '22%'
        },
      },
    });
  }
}
