/**
 * @fileoverview Defines the NetworkGraph class.
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see NetworkGraph
 */

/**
 * @classdesc Defines a network graph.
 * @augments BaseChart
 */
class NetworkGraph extends BaseChart {
  /**
   * @inheritdoc
   */
  constructor(url, queryParams, wrapper = null, tooltipText = null) {
    super(url, queryParams, wrapper, tooltipText);
  }

  /**
   * Initializes options and renders an empty chart.
   */
  render() {
    let container = this.wrapper;
    let data = {
      nodes: this.series["nodes"],
      edges: this.series["edges"],
    };
    let options = this.getBaseOptions(true);
    let network = new vis.Network(container, data, options);
    
    network.on("stabilizationIterationsDone", function () {
      network.moveTo({scale: 1.25});
    });
  }

  /**
   * Fetch data and update chart.
   */
  update() {
    this.updateData().then(() => {
      this.series["nodes"] = new vis.DataSet(this.series["nodes"]);
      this.series["edges"] = new vis.DataSet(this.series["edges"]);
      this.render();
    });
  }

  /**
   * @inheritdoc
   * @override
   */
  getBaseOptions(stabilizeGraph) {
    return {
      layout: {
        improvedLayout: false,
      },
      physics: {
        enabled: stabilizeGraph,
      },
      nodes: {
        borderWidth: 4,
        shape: 'circularImage',
        color: {
          border: "lightgray",
          background: "lightgray",
          hover: { background: "white", border: "white" },
          highlight: { background: "red", border: "red" },
        },
        font: { color: "#eeeeee" },
      },
      edges: {
        arrows: "to",
        color: {
          color: "lightgray",
          highlight: "red",
        },
      },
    };
  }
}
