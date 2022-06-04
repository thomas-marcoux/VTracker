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
 * @fileoverview Behaviors for the Dashboard Analytics page.
 * @author Hayder Al Rubaye
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see dashboardAnalytics.Dashboard
 * @see dashboardAnalytics.StatisticsRibbon
 * @see dashboardAnalytics.PostingFrequency
 * @see dashboardAnalytics.TopKeywords
 * @see dashboardAnalytics.SocialMediaFootprint
 * @see dashboardAnalytics.DailyVideoViews
 * @see dashboardAnalytics.RelatedVideos
 */

/**
 * @constant {Object} trackerData The pages's tracker data.
 * @memberof dashboardAnalytics
 */
const trackerData = JSON.parse(JSONContextData);

/**
 * @classdesc Implements general behaviors for the Dashboard Analytics page.
 * @memberof dashboardAnalytics
 * @augments BaseAnalytics
 */
class Dashboard extends BaseAnalytics {
  constructor() {
    super();
    this.tableSortButtons = document.querySelectorAll(
      "main#content div#dashboard section#visualizations figure.figure table.tableDiagram thead th button"
    );
    this.initialize();
  }

  /** Binds events for the page. */
  initialize() {
    super.initialize();
    for (var i = 0; i < this.tableSortButtons.length; i++) {
      this.tableSortButtons[i].addEventListener(
        "click",
        this.tableSortButtonsClickHandler.bind(this)
      );
    }
  }

  /**
   * Handles table sorting.
   * @todo This may be replaced with {@link http://tabulator.info/}.
   * @param {Event} event Default click event.
   */
  tableSortButtonsClickHandler(event) {
    /* for (var i = 0; i < this.tableSortButtons.length; i++) {

                this.tableSortButtons[i].classList.contains(this.reverseClass).remove(this.reverseClass);

            } */

    if (event.currentTarget.classList.contains(this.activeClass)) {
      event.currentTarget.classList.toggle(this.reverseClass);
    } else {
      for (var i = 0; i < this.tableSortButtons.length; i++) {
        this.tableSortButtons[i].classList.remove(this.activeClass);
        this.tableSortButtons[i].classList.remove(this.reverseClass);
      }

      event.currentTarget.classList.add(this.activeClass);
    }
  }
}

/**
 * @classdesc Fetches and displays data for the statistics ribbon.
 * @memberof dashboardAnalytics
 */
class StatisticsRibbon {
  constructor() {
    this.wrapper = document.querySelector(
      "main#content div#dashboard section#statistics"
    );
    this.url = "dashboardAnalyticsRibbonStatistics";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.update();
  }

  /** Fetches data and insert resulting render to the wrapper. */
  update() {
    insertRender(this.wrapper, this.url, this.queryParams);
  }
}

/**
 * @classdesc Fetches and displays data for the posting frequency chart.
 * @memberof dashboardAnalytics
 * @see LineChart
 */
class PostingFrequency {
  constructor() {
    this.tooltipText = "Videos published";
    this.url = "dashboardAnalyticsPostingFrequency";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.wrapper = document.querySelector(
      "main#content div#dashboard section#visualizations figure#postingFrequencyDiagram div#figureWrapper div#postingFrequencyFigure"
    );
    this.postingFrequencyFigure = new LineChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText
    );
    this.postingFrequencyFigure.render();
    this.update();
  }

  /** Renders empty chart then queries data and update chart. */
  update() {
    this.postingFrequencyFigure.update();
  }
}

/**
 * @classdesc Fetches and displays data for the keywords map.
 * @memberof dashboardAnalytics
 * @see TreeMap
 */
class TopKeywords {
  constructor() {
    this.url = "contentAnalysisKeyword";
    this.queryParams = { tracker_id: trackerData.tracker_id, n: 20 };
    this.wrapper = document.querySelector(
      "main#content div#dashboard section#visualizations figure#topKeywordsDiagram div#figureWrapper div#topKeywordsFigure"
    );
    this.topKeywordsFigure = new TreeMap(
      this.url,
      this.queryParams,
      this.wrapper
    );
    this.topKeywordsFigure.render();
    this.update();
  }

  /** Renders empty chart then queries data and update chart. */
  update() {
    this.topKeywordsFigure.update();
  }
}

/**
 * @classdesc Fetches and displays data for the social media footprint.
 * @memberof dashboardAnalytics
 */
class SocialMediaFootprint {
  constructor() {
    this.wrapper = document.querySelector(
      "main#content div#dashboard section#visualizations figure#socialMediaDiagram div#figureWrapper"
    );
    this.url = "dashboardAnalyticsSmLinks";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.update();
  }

  /** Fetches data and insert resulting render to the wrapper. */
  update() {
    insertRender(this.wrapper, this.url, this.queryParams);
  }
}

/**
 * @classdesc Fetches and displays data for the daily video views chart.
 * @memberof dashboardAnalytics
 * @see LineChart
 */
class DailyVideoViews {
  constructor() {
    this.tooltipText = "Views";
    this.url = "dashboardAnalyticsDailyViews";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.wrapper = document.querySelector(
      "main#content div#dashboard section#visualizations figure#dailyVideoViewsDiagram div#figureWrapper div#dailyVideoViewsFigure"
    );
    this.dailyVideoViewsFigure = new LineChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText
    );
    this.dailyVideoViewsFigure.render();
    this.update();
  }

  /** Renders empty chart then queries data and update chart. */
  update() {
    this.dailyVideoViewsFigure.update();
  }
}

/**
 * @classdesc Fetches and displays data for the related videos table.
 * @memberof dashboardAnalytics
 */
class RelatedVideos {
  constructor() {
    this.wrapper = document.querySelector(
      "main#content div#dashboard section#visualizations figure#relatedVideosDiagram div#contentWrapper"
    );
    this.url = "dashboardAnalyticsRelatedVideos";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    let columns = [
      {title:"Image", field:"thumbnails_medium_url",formatter:"image", formatterParams:{height:"65px",width:"100px",}, width:115}, //column will not be shrunk
      {title:"Title", field:"title"},
      {title:"Related To", field:"related_to_count"}
    ];
    this.table = new DataTable(columns)
    this.update();
  }

  /** Fetches data and insert resulting render to the wrapper. */
   update() {
     fetchData(this.queryParams, "/" + this.url).then(
       (response) => {
         console.log(response)
         this.table.drawTable(response, this.wrapper)

       })
   }

 }

/**
 * Declare page's objects when the DOM is loaded.
 * @listens DOMContentLoaded
 * @memberof dashboardAnalytics
 */
document.addEventListener("DOMContentLoaded", function () {
  let ribbon = new StatisticsRibbon();
  let postingFrequency = new PostingFrequency();
  let treemapKeywords = new TopKeywords();
  let socialMediaFootprint = new SocialMediaFootprint();
  let dailyVideoViews = new DailyVideoViews();
  let relatedVideos = new RelatedVideos();
  let dashboard = new Dashboard();
});
