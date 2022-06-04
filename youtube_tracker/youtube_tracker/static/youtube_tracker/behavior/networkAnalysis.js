/**
 * @fileoverview Behaviors for the Network Analysis page.
 * @author Mayor Inna Gurung
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see NetworkAnalysis.NetworkAnalysis
 */

/**
 * @constant {Object} trackerData The pages's tracker data.
 * @memberof NetworkAnalysis
 */
 const trackerData = JSON.parse(JSONContextData);

 /**
  * @classdesc Implements specific behaviors for the Network Analytics page.
  * @augments BaseAnalytics
  */
 class NetworkAnalysis extends BaseAnalytics {

   
 }
 
 /**
 * @classdesc Fetches and displays data for the network graph.
 * @memberof NetworkAnalysis
 * @see todo
 */
class RelatedVideosGraph {
  constructor() {
    this.tooltipText = "Videos published";
    this.url = "networkAnalysisGraph";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.wrapper = document.querySelector(
      "main#content div#dashboard section#visualizations figure#networkGraph div#figureWrapper"
    );
    this.networkGraphFigure = new NetworkGraph(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText
    );
    // this.networkGraphFigure.render();
    this.update();
  }

  /** Renders empty chart then queries data and update chart. */
  update() {
   // this.networkGraphFigure.update();
  }
}

 /**
  * Declare page's objects when the DOM is loaded.
  * @listens DOMContentLoaded
  * @memberof NetworkAnalysis
  */
 document.addEventListener("DOMContentLoaded", function () {
   
   let networkAnalysis = new NetworkAnalysis();
   let relatedVideosGraph = new RelatedVideosGraph();
 });
 