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
 * @fileoverview Behaviors for the Content Analysis page.
 * @author Hayder Al Rubaye
 * @author Thomas Marcoux
 * @copyright COSMOS 2021
 * @see contentAnalysis.ContentAnalysis
 * @see contentAnalysis.SharedChart
 * @see contentAnalysis.Language
 * @see contentAnalysis.Categories
 * @see contentAnalysis.Opinions
 * @see contentAnalysis.Keywords
 * @see contentAnalysis.Emotions
 * @see contentAnalysis.VideoComments
 * @see contentAnalysis.VideoDetails
 */

/**
 * @constant {Object} trackerData The pages's tracker data.
 * @memberof contentAnalysis
 */

const trackerData = JSON.parse(JSONContextData);

/**
 * @classdesc Implements general behaviors for the Dashboard Analytics page.
 * @memberof contentAnalysis
 */
class ContentAnalysis  extends BaseAnalytics{
  /**
   * @param {Object} components Page's charts and tables components.
   */
  constructor(components) {
    super();
    this.figureTables = document.querySelectorAll(
      "main#content div#dashboard section#visualizations figure.figure table"
    );
    this.contentAnalysisDiagram = document.querySelector(
      "main#content div#dashboard section#visualizations figure#contentAnalysisDiagram.figure"
    );
   
    this.tableHeadWrapperClass = "tableHeadWrapper";
    
    this.components = components;
    this.initialize();
  }

  /** Binds events for the page. */
  initialize() {
    super.initialize();
        this.contentAnalysisDiagram.addEventListener(
      "click",
      this.contentAnalysisDiagramClickHandler.bind(this)
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
  contentAnalysisDiagramClickHandler(event) {
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

        let chart_parameters;
        switch (target.id) {
          case "languageComponent":
            chart_parameters = this.components.languages.chart.getOptions();
            break;
          case "categoryComponent":
            chart_parameters = this.components.categories.chart.getOptions();
            break;
          case "opinionComponent":
            chart_parameters = this.components.opinions.chart.getOptions();
            break;
          case "keywordComponent":
            chart_parameters = this.components.keywords.chart.getOptions();
            break;
          case "emotionComponent":
            chart_parameters = this.components.emotions.chart.getOptions();
            break;
          default:
            break;
        }
        this.components.sharedChart.update(chart_parameters);

        target.classList.add(this.selectedClass);
      }
    }
  }

  /**
   * Handle clicks on the table headers.
   * @todo This needs to be called when the tables have been rendered or replaced with a tabulator build-in {@link http://tabulator.info/}.
   * @param {Event} event Default click event.
   */
  figureTablesClickHandler(event) {
    if (
      event.target.classList.contains(this.tableHeadWrapperClass) ||
      event.target.parentElement.classList.contains(this.tableHeadWrapperClass)
    ) {
      let tableHeads = event.currentTarget.querySelectorAll("th div");
      let target = event.target.classList.contains(this.tableHeadWrapperClass)
        ? event.target
        : event.target.parentElement;

      if (target.classList.contains(this.activeClass)) {
        target.classList.toggle(this.reverseClass);
      } else {
        for (let i = 0; i < tableHeads.length; i++) {
          tableHeads[i].classList.remove(this.activeClass);
          tableHeads[i].classList.remove(this.reverseClass);
        }

        target.classList.add(this.activeClass);
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
    this.chart = new BaseChart("", null, this.wrapper);
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
 * @classdesc Defines the bar chart handling language distribution.
 * @memberof contentAnalysis
 * @see BarChart
 */
class Language {
  constructor() {
    this.sideBarButtonContent = document.querySelector(
      "div#languageComponent p"
    );
    this.url = "contentAnalysisDescLang";
    this.tooltipText = "Number of videos";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new BarChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText
    );
    this.update();
  }

  /** Default chart. Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(this.sideBarButtonContent, data.top_token);
      let contentAnalysisDiagram = document.querySelector(
        "main#content div#dashboard section#visualizations figure#contentAnalysisDiagram.figure"
      );
      contentAnalysisDiagram.querySelector(".component.selectable").click();
    });
  }
}

/**
 * @classdesc Defines the bar chart handling category distribution.
 * @memberof contentAnalysis
 * @see BarChart
 */
class Categories {
  constructor() {
    this.sideBarButtonContent = document.querySelector(
      "div#categoryComponent p"
    );
    this.url = "contentAnalysisCategory";
    this.tooltipText = "Number of videos";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new BarChart(
      this.url,
      this.queryParams,
      null,
      this.tooltipText
    );
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(this.sideBarButtonContent, data.top_token);
    });
  }
}

/**
 * @classdesc Defines the bar chart handling sentiment distribution.
 * @memberof contentAnalysis
 * @see BarChart
 */
class Opinions {
  constructor() {
    this.sideBarButtonContent = document.querySelector(
      "div#opinionComponent p"
    );
    this.url = "contentAnalysisOpinionBar";
    this.tooltipText = "Number of videos";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new BarChart(
      this.url,
      this.queryParams,
      null,
      this.tooltipText
    );
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(this.sideBarButtonContent, data.top_token);
    });
  }
}

/**
 * @classdesc Defines the treemap handling top keywords.
 * @memberof contentAnalysis
 * @see TreeMap
 */
class Keywords {
  constructor() {
    this.sideBarButtonContent = document.querySelector(
      "div#keywordComponent p"
    );
    this.url = "contentAnalysisKeyword";
    this.queryParams = { tracker_id: trackerData.tracker_id, n: 20 };
    this.chart = new TreeMap(this.url, this.queryParams);
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(this.sideBarButtonContent, data.top_token);
    });
  }
}

/**
 * @classdesc Defines the bar chart handling emotion distribution.
 * @memberof contentAnalysis
 * @see BarChart
 */
class Emotions {
  constructor() {
    this.sideBarButtonContent = document.querySelector(
      "div#emotionComponent p"
    );
    this.url = "contentAnalysisEmoDist";
    this.tooltipText = "Number of videos";
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.chart = new BarChart(
      this.url,
      this.queryParams,
      null,
      this.tooltipText
    );
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.updateData().then((data) => {
      updateSideButton(this.sideBarButtonContent, data.top_token);
    });
  }
}

/**
 * @classdesc Defines the table handling video comments.
 * @memberof contentAnalysis
 * @see DataTableVideoComments
 */
class VideoComments {
  constructor() {
    this.videosWrapper = document.querySelector(
        "figure#videoDescriptionLanguageDiagram div#videosWrapper"
    );
    this.queryParams = {tracker_id: trackerData.tracker_id};
    this.videosUrl = "contentAnalysisVideoList";
    this.scroll_index = 0;
    this.commentsPerPage = 10;
    this.video_items = [];
    this.commentsTable = new DataTable();
    this.table = new DataTableVideoComments(this.commentsTable);
    this.initialize();
  }


  /** Fetches data, insert resulting render to the wrapper, and select the first result by default. */
  initialize() {
    fetchData(this.queryParams, "/" + this.videosUrl).then((response) => {
      this.table.drawTable(response, this.videosWrapper);
    });
  }
}

/**
 * @classdesc Defines the table handling video details.
 * @memberof contentAnalysis
 */
class VideoDetails {
  constructor() {
    this.wrapper = document.querySelector(
      "figure#videoDetailsDiagram div#videosWrapper"
    );
    this.queryParams = { tracker_id: trackerData.tracker_id };
    this.url = "contentAnalysisVideoDetails";
    this.update();
  }

  /** Fetches data and insert resulting render to the wrapper. */
  update() {
       let videoDetailsTable = new DataTable()
    fetchData(this.queryParams, "/" + this.url).then(
      (response) => {
        videoDetailsTable.drawTable(response, this.wrapper)
      }
    )

  }

}

/**
 * Declare page's objects when the DOM is loaded.
 * @listens DOMContentLoaded
 * @memberof contentAnalysis
 */
document.addEventListener("DOMContentLoaded", function () {
  let components = {
    sharedChart: new SharedChart(),
    languages: new Language(),
    categories: new Categories(),
    opinions: new Opinions(),
    keywords: new Keywords(),
    emotions: new Emotions(),
    videoDetails: new VideoDetails(),
    videoComments: new VideoComments(),
  };
  let contentAnalysis = new ContentAnalysis(components);
});

