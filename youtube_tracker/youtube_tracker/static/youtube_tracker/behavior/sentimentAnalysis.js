/*



	" Reimplement the wheel to either learn, or make it better. "

    http://www.hayder.io/
    https://www.youtube.com/watch?v=QOlTGA3RE8I
    
    Product Name: YouTubeTracker,
	Description: Tracking YouTube"s data.
	Beneficiary: COSMOS
	
	Copyright © 1992 - 2021 HAYDER, All Rights Reserved.
	
	
	
*/

/**
 * @fileoverview Behaviors for the Content Engagement page.
 * @author Hayder Al Rubaye
 * @author Thomas Marcoux
 * @author Mayor Inna Gurung
 * @copyright COSMOS 2021
 */


 /**
  * @classdesc Implements general behaviors for the Content Engagement page.
  * @memberof sentimentAnalysis
  * @augments BaseAnalytics
  */
 class SentimentAnalysis extends BaseAnalytics {
   
   constructor() {
    super();
    
    this.sentimentAnalysisDiagram= document.querySelector(
      "main#content div#dashboard section#visualizations figure#topicDistributionDiagram.figure"
    );
    
    this.initialize();
   }
 
   /** Binds events for the page. */
   initialize() {
     super.initialize();
     
   }
 
}
 /**
  * Declare page's objects when the DOM is loaded.
  * @listens DOMContentLoaded
  * @memberof SentimentAnalysis
  */
  document.addEventListener("DOMContentLoaded", function () {

    let sentimentAnalysis = new SentimentAnalysis();
 });
 