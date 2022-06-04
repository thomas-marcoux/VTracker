/**
 * @fileoverview Defines the LineChart class.
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see TreeMap
 */

/**
 * @classdesc Defines a world map using JVectorMap - {@link https://jvectormap.com/tutorials/getting-started/}.
 * @augments BaseChart
 */
class WorldMap extends BaseChart {
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
   * Initializes options and renders an empty chart.
   * @override
   */
  render() {
    this.updateData().then(() => {
      let options = this.getBaseOptions();
      this.chart = new jvm.Map(options);
    });
  }

  /**
   * @inheritdoc
   * @override
   */
  getBaseOptions() {
    return {
      map: "world_mill",
      container: $("#" + this.wrapper.id),
      backgroundColor: "#2c2928;",
      series: {
        regions: [
          {
            values: this.series,
            attribute: "fill",
            scale: ["#C8EEFF", "#0071A4"],
            normalizeFunction: "polynomial",
          },
        ],
      },
      regionStyle: {
        initial: {
          fill: "#d0d0d0",
          "fill-opacity": 1,
          stroke: "none",
          "stroke-width": 0,
          "stroke-opacity": 1,
        },
        hover: {
          "fill-opacity": 0.8,
          cursor: "pointer",
        },
      },
      /*,
        onRegionTipShow: function (e, el, code) {
            el.html(el.html() + ' (GDP - ' + gdpData[code] + ')');
        }*/
    };
  }
}
