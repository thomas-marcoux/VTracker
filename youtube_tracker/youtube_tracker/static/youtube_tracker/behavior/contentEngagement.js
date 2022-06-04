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
 * @author Dayo Banjo
 * @copyright COSMOS 2021
 * @see contentEngagement.ContentEngagement
 * @see contentEngagement.SharedChart
 * @see contentEngagement.Views
 * @see contentEngagement.Likes
 * @see contentEngagement.Dislikes
 * @see contentEngagement.Suscribers
 * @see contentEngagement.VideoPlayerTable
 * @see contentEngagement.VideoDetails
 */

const trackerData = JSON.parse(JSONContextData);

/**
 * @classdesc Implements general behaviors for the Content Engagement page.
 * @memberof contentEngagement
 * @augments BaseAnalytics
 */
class ContentEngagement extends BaseAnalytics {
  /**
   * @param {Object} components Page's charts and tables components.
   */
  constructor(components) {
    super();
    this.figureTables = document.querySelectorAll(
      "main#content div#dashboard section#visualizations figure.figure table"
    );
    this.contentEngagementDiagram = document.querySelector(
      "main#content div#dashboard section#visualizations figure#contentEngagementDiagram.figure"
    );
    this.tableHeadWrapperClass = "tableHeadWrapper";
    this.selectabelClass = "selectable";

    this.components = components;
    this.initialize();
  }

  /** Binds events for the page. */
  initialize() {
    super.initialize();
    this.contentEngagementDiagram.addEventListener(
      "click",
      this.contentEngagementDiagramClickHandler.bind(this)
    );

    for (let i = 0; i < this.figureTables.length; i++) {
      this.figureTables[i].addEventListener(
        "click",
        this.figureTablesClickHandler.bind(this)
      );
    }
  }

  /**
   * Handles switches between charts.
   * @param {Event} event Default click event.
   */
  contentEngagementDiagramClickHandler(event) {
    if (
      event.target.classList.contains(this.selectabelClass) ||
      event.target.parentElement.classList.contains(this.selectabelClass)
    ) {
      let target = event.target.classList.contains(this.selectabelClass)
        ? event.target
        : event.target.parentElement;

      if (!target.classList.contains(this.selectedClass)) {
        let leadingStatistics = event.currentTarget.querySelectorAll(
          ".component.selectable"
        );
        leadingStatistics.forEach((button) =>
          button.classList.remove(this.selectedClass)
        );

        target.classList.add(this.selectedClass);

        let chart_parameters;
        switch (target.id) {
          case "viewsComponent":
            chart_parameters = this.components.views.chart.getOptions();
            break;
          case "likesComponent":
            chart_parameters = this.components.likes.chart.getOptions();
            break;
          case "dislikesComponent":
            chart_parameters = this.components.dislikes.chart.getOptions();
            break;
          case "commentsComponent":
            chart_parameters = this.components.commentStats.chart.getOptions();
            break;
          case "suscribersComponent":
            chart_parameters = this.components.suscribers.chart.getOptions();
            break;
          default:
            break;
        }
        this.components.sharedChart.update(chart_parameters);
      }
    }
  }
}

/**
 * @classdesc Defines the base chart object to be shared by all chart types.
 * @memberof contentAnalysis
 * @see BaseChart
 */
class SharedChart {
  constructor() {
    this.wrapper = document.querySelector(
      "main#content div#dashboard section#visualizations figure.figure div#figureWrapper div#figure"
    );
    this.chart = new LineChart(
      "",
      null,
      this.wrapper,
      "",
      ["#FF0000"],
      "image"
    );
    this.chart.render();
  }

  /**
   * Update the chart object.
   * @param {Object} options Chart options of the particular chart object.
   */
  update(options) {
    this.chart.chart.updateOptions(options);
  }
}

/**
 * @classdesc Defines the line chart handling views.
 * @memberof contentEngagement
 * @see LineChart
 */
class Views {
  constructor() {
    this.sideBarButtonContent = document.querySelector("div#viewsComponent p");
    this.url = "contentEngagementViews";
    this.tooltipText = "Number of views";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new LineChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      ["#FF0000"],
      "image"
    );
    this.update();
  }

  /** Default chart. Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(
        this.sideBarButtonContent,
        data.top_token,
        abbreviateNumber
      );
      let contentEngagementDiagram = document.querySelector(
        "main#content div#dashboard section#visualizations figure#contentEngagementDiagram.figure"
      );
      contentEngagementDiagram.querySelector(".component.selectable").click();
    });
  }
}

/**
 * @classdesc Defines the line chart handling likes.
 * @memberof contentEngagement
 * @see LineChart
 */
class Likes {
  constructor() {
    this.sideBarButtonContent = document.querySelector("div#likesComponent p");
    this.url = "contentEngagementLikeStats";
    this.tooltipText = "Number of likes";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new LineChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      ["#FF0000"],
      "image"
    );
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(
        this.sideBarButtonContent,
        data.top_token,
        abbreviateNumber
      );
    });
  }
}

/**
 * @classdesc Defines the line chart handling dislikes.
 * @memberof contentEngagement
 * @see LineChart
 */
class Dislikes {
  constructor() {
    this.sideBarButtonContent = document.querySelector(
      "div#dislikesComponent p"
    );
    this.url = "contentEngagementDislikeStats";
    this.tooltipText = "Number of videos";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new LineChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      ["#FF0000"],
      "image"
    );
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(
        this.sideBarButtonContent,
        data.top_token,
        abbreviateNumber
      );
    });
  }
}

/**
 * @classdesc Defines the line chart handling comments.
 * @memberof contentEngagement
 * @see LineChart
 */
class CommentStats {
  constructor() {
    this.sideBarButtonContent = document.querySelector(
      "div#commentsComponent p"
    );
    this.url = "contentEngagementCommentStats";
    this.tooltipText = "Number of videos commments";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new LineChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      ["#FF0000"],
      "image"
    );
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(
        this.sideBarButtonContent,
        data.top_token,
        abbreviateNumber
      );
    });
  }
}

/**
 * @classdesc Defines the line chart handling subscribers.
 * @memberof contentEngagement
 * @see LineChart
 */
class Suscribers {
  constructor() {
    this.sideBarButtonContent = document.querySelector(
      "div#suscribersComponent p"
    );
    this.url = "contentEngagementSubscriberStats";
    this.tooltipText = "Number of videos commments";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new LineChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      ["#FF0000"],
      "image"
    );
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(
        this.sideBarButtonContent,
        data.top_token,
        abbreviateNumber
      );
    });
  }
}

/**
 * @classdesc Defines the table handling videos and the video player.
 * @memberof contentEngagement
 * @see DataTableVideoPlayer
 */
class VideoPlayerTable {
  constructor() {
    this.videosWrapper = document.querySelector(
      "figure#videoDescriptionLanguageDiagram div#videosWrapper"
    );
    this.commentsWrapper = document.querySelector(
      "figure#videoDescriptionLanguageDiagram div#commentsWrapper ul#commentsList"
    );
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.videosUrl = "contenEngagementVideoList";
    this.page_index = 0;
    this.video_items = [];
    this.table = new DataTableVideoPlayer();
    this.initialize();
  }

  /**
   * Draws the video list Table.
   * @param {Event} event Default click event.
   */
   initialize() {
    fetchData(this.queryParams, "/" + this.videosUrl).then((response) => {
      this.table.drawTable(response, this.videosWrapper);
    });
  }
}


/**
 * @classdesc Defines the table handling videos and the video player.
 * @memberof contentEngagement
 * @see DataTable
 */
 class VideoDetails {
  constructor() {
    this.wrapper = document.querySelector(
      "figure#videoDetailsDiagram div#videosWrapper"
    );
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.url = "contentEngagementVideoDetails";
    this.page_index = 0;
    this.video_items = [];
    this.columns = [
      {title:"Title", field:"video_title"},
      {title:"Date", field:"published_date"},
      {title:"Views", field:"total_views"},
      {title:"Likes", field:"total_likes"},
      {title:"Dislikes", field:"total_dislikes"},
      {title:"Comments", field:"total_comments"},
    ];
    this.table = new DataTable(this.columns);
    this.initialize();
  }

  /**
   * Draws the video list Table.
   * @param {Event} event Default click event.
   */
   initialize() {
    fetchData(this.queryParams, "/" + this.url).then((response) => {
      this.table.drawTable(response, this.wrapper);
    });
  }
}



/**
 * Declare page's objects when the DOM is loaded.
 * @listens DOMContentLoaded
 * @memberof contentEngagement
 */
document.addEventListener("DOMContentLoaded", function () {
  let components = {
    sharedChart: new SharedChart(),
    views: new Views(),
    likes: new Likes(),
    dislikes: new Dislikes(),
    suscribers: new Suscribers(),
    commentStats: new CommentStats(),
    videoDetails: new VideoDetails(),
    videoPlayerTable: new VideoPlayerTable(),
  };
  let contentEngagement = new ContentEngagement(components);
});
