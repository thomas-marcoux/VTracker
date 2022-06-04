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
 * @fileoverview Behaviors for the Topic Distribution page.
 * @author Hayder Al Rubaye
 * @author Thomas Marcoux
 * @author Mayor Inna Gurung
 * @copyright COSMOS 2021


 const trackerData = JSON.parse(JSONContextData);

 /**
  * @classdesc Implements general behaviors for the Topic Distribution page.
  * @memberofTopicDistribution
  * @augments BaseAnalytics
  */
 class TopicDistribution extends BaseAnalytics {
 
   constructor() {
    super();
    this.topicDistributionDiagram= document.querySelector(
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
  * @memberof TopicDistribution
  */
 document.addEventListener("DOMContentLoaded", function () {
  
   let topicDistribution = new TopicDistribution();
 });
 