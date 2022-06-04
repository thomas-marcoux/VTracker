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
 * @author Dayo Banjo
 * @copyright COSMOS 2021
 * @see postingFrequency.PostingFrequency
 * @see postingFrequency.PostingFrequencyChart
 * @see postingFrequency.StatisticsRibbon
 * @see postingFrequency.Categories
 * @see postingFrequency.ChannelLocation
 * @see postingFrequency.ChannelMap
 * @see postingFrequency.ChannelDetails
 */

//import ChannelObserver from './channelObserver';

/**
 * @constant {Object} trackerData The pages's tracker data.
 * @memberof dashboardAnalytics
 */
const trackerData = JSON.parse(JSONContextData);

/**
 * Array of selected channels ids
 * @memberOf postingFrequency
 */
let channelIDS = [];

/**
 * Array of index of the unselected channels available for selection
 * @memberOf postingFrequency
 */
let availableColors = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);

/**
 * Dictionary of selected key(string) channels and their respective colors code (string)
 * @memberOf postingFrequency
 */
let selectedChannels_ = {};

/**
 * Array of selected colors
 * @memberOf postingFrequency
 */
let colors = [];

let channel = new ChannelObserver();

/**
 * @function Implement logic when a channel is clicked
 */
function channelsListClickHandler(event) {
  //if the selection is already selected unselected and add make the color selection available
  if (
    selectedChannels_.hasOwnProperty(event.target.id) &&
    Object.keys(selectedChannels_).length > 1
  ) {
    event.target.removeAttribute("style");
    this.selectedChannels -= 1;
    availableColors.add(selectedChannels_[event.target.id]);
    delete selectedChannels_[event.target.id];
  } else {
    /**
     * Remove from the selected channels if the size is greater than color selection
     */
    if (Object.keys(selectedChannels_).length >= colorSelection.length) {
      // to do remove the attribute of the selected index to remove
      const key = Object.keys(selectedChannels_)[0];
      availableColors.add(selectedChannels_[key]);
      delete selectedChannels_[key];
    }

    let colorIndex = availableColors.values().next().value;
    selectedChannels_[event.target.id] = colorIndex;

    availableColors.delete(colorIndex);

    //availableColors.delete(selectedChannels_[event.target.id])
    event.target.style.backgroundColor =
      colorSelection[colorIndex].backgroundColor;
    event.target.style.color = colorSelection[colorIndex].color;
    this.selectedChannels += 1;
  }
  channelIDS = [];
  colors = [];
  trackerData.channels.forEach((channel) => {
    if (selectedChannels_.hasOwnProperty(channel.channel_id)) {
      let colorIndex = selectedChannels_[channel.channel_id];
      channelIDS.push(channel.channel_id);
      colors.push(colorSelection[colorIndex].backgroundColor);
    }
  });

  /* Notify the object subcribe to it to update sequel to the channel */
  channel.notify();
  //updatePostFrequency()
}

/**
 * Array of css attribute for a selected channel
 * @type {Array}
 * @memberOf postingFrequency
 */
const colorSelection = [
  {
    backgroundColor: "#2C8DFF",
    color: "white",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#ff0000",
    color: "white",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#00B19C",
    color: "white",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#FFF1D0",
    color: "black",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#DD1C1A",
    color: "white",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#643173",
    color: "white",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#D9BBF9",
    color: "black",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#CCA7A2",
    color: "black",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#AA9FB1",
    color: "black",
    index: -1,
    order: -1,
  },
  {
    backgroundColor: "#320E3B",
    color: "white",
    index: -1,
    order: -1,
  },
];

/**
 * @classdesc Implements general behaviors for the Dashboard Analytics page.
 * @memberof postingFrequency
 * @augments BaseAnalytics
 */
class PostingFrequency extends BaseAnalytics {
  constructor() {
    super();
    this.figureTables = document.querySelectorAll(
      "main#content div#dashboard section#visualizations figure.figure table"
    );
    this.channelsList = document.querySelector(
      "main#content div#dashboard section#visualizations figure#postingFrequencyDiagram div#channelsWrapper ul#channelsList"
    );
    this.tableHeadWrapperClass = "tableHeadWrapper";
    this.selectedChannels = 0;
    this.defaultSelection = 3;

    this.initialize();
  }

  /** Binds events for the page. */
  initialize() {
    super.initialize();
    for (var i = 0; i < this.figureTables.length; i++) {
      this.figureTables[i].addEventListener(
        "click",
        this.figureTablesClickHandler.bind(this)
      );
    }

    this.channelsList.addEventListener(
      "click",
      channelsListClickHandler.bind(this)
      //this.channelsListClickHandler2.bind(this)
    );

    /* Select three channels when loading the page for the first time */

    var children = this.channelsList.children;

    for (i = 0; (i < this.defaultSelection) & (i < children.length); i++) {
      children[i].click();
    }

    const listItems = this.channelsList.getElementsByTagName("li");

    for (i = 0; i < listItems.length; i++) {
      //console.log("the channel list", i, listItems[i].id);
    }

    window.addEventListener("click", this.windowClickHandler.bind(this));
  }

  channelsListClickHandler(event) {
    if (
      event.target.tagName == "LI" &&
      !event.target.classList.contains(this.disabledClass)
    ) {
      if (event.target.classList.contains(this.selectedClass)) {
        event.target.removeAttribute("style");
        event.target.classList.toggle(this.selectedClass);
        this.selectedChannels -= 1;

        var targetIndex =
          Array.from(event.currentTarget.children).indexOf(event.target) + 1;

        for (var i = 1; i <= this.selection.length; i++) {
          if (this.selection[i].index == targetIndex) {
            this.selection[i].index = -1;
            this.selection[i].order = -1;
            i = this.selection.length + 1;
          }
        }

        var items = event.currentTarget.children;

        for (var i = 0; i < items.length; i++) {
          if (!items[i].classList.contains(this.selectedClass)) {
            items[i].classList.remove(this.disabledClass);
          }
        }
      } else if (this.selectedChannels < this.selection.length - 1) {
        event.target.classList.toggle(this.selectedClass);
        this.selectedChannels += 1;

        var targetIndex =
          Array.from(event.currentTarget.children).indexOf(event.target) + 1;

        for (var i = 1; i <= this.selection.length; i++) {
          if (this.selection[i].index == -1) {
            event.target.style.backgroundColor =
              this.selection[i].backgroundColor;
            event.target.style.color = this.selection[i].color;
            this.selection[i].index = targetIndex;
            this.selection[i].order = this.selectedChannels;
            i = this.selection.length + 1;
          }
        }

        if (this.selectedChannels == this.selection.length - 1) {
          var items = event.currentTarget.children;

          for (var i = 0; i < items.length; i++) {
            if (!items[i].classList.contains(this.selectedClass)) {
              items[i].classList.add(this.disabledClass);
            }
          }
        }
        console.log(trackerData);
      }
    }
  }

  figureTablesClickHandler(event) {
    if (
      event.target.classList.contains(this.tableHeadWrapperClass) ||
      event.target.parentElement.classList.contains(this.tableHeadWrapperClass)
    ) {
      var tableHeads = event.currentTarget.querySelectorAll("th div");
      var target = event.target.classList.contains(this.tableHeadWrapperClass)
        ? event.target
        : event.target.parentElement;

      if (target.classList.contains(this.activeClass)) {
        target.classList.toggle(this.reverseClass);
      } else {
        for (var i = 0; i < tableHeads.length; i++) {
          tableHeads[i].classList.remove(this.activeClass);
          tableHeads[i].classList.remove(this.reverseClass);
        }

        target.classList.add(this.activeClass);
      }
    }
  }
}

/**
 * @classdesc Fetches and displays data for the posting frequency chart.
 * @memberof postingFrequency
 * @see LineChart
 */
class PostingFrequencyChart {
  constructor() {
    this.tooltipText = "Videos published";
    this.url = "postingFrequencyPostingChart";
    this.queryParams = { channel_ids: channelIDS };
    this.postingFrequencyWrapper = document.querySelector(
      "section#visualizations figure#postingFrequencyDiagram div#figureWrapper div#postingFrequencyFigure"
    );
    this.postingFrequencyFigure = new LineChart(
      this.url,
      this.queryParams,
      this.postingFrequencyWrapper,
      this.tooltipText,
      colors,
      "image"
    );
    this.update();
  }

  /** Renders empty chart then queries data and update chart. */
  update() {
    this.postingFrequencyFigure.updateColors(colors);
    this.postingFrequencyFigure.render();
    this.postingFrequencyFigure.update();
  }

  updateObserver() {
    this.queryParams = { channel_ids: channelIDS };
    this.postingFrequencyWrapper = document.querySelector(
      "section#visualizations figure#postingFrequencyDiagram div#figureWrapper div#postingFrequencyFigure"
    );
    this.postingFrequencyFigure = new LineChart(
      this.url,
      this.queryParams,
      this.postingFrequencyWrapper,
      this.tooltipText,
      colors,
      "image"
    );
    this.postingFrequencyFigure.updateColors(colors);
    this.postingFrequencyFigure.render();
    this.postingFrequencyFigure.update();
  }
}

/**
 * @classdesc Fetches and displays data for the statistics ribbon.
 * @memberof postingFrequency
 */
class StatisticsRibbon {
  constructor() {
    this.wrapper = document.querySelector(
      "section#visualizations figure#postingFrequencyDiagram div#statistics"
    );
    this.url = "postingFrequencyRibbonStatistics";
    this.update();
  }

  /** Fetches data and insert resulting render to the wrapper. */
  update() {
    this.queryParams = { channel_ids: channelIDS };
    insertRender(this.wrapper, this.url, this.queryParams);
  }

  updateObserver() {
    this.queryParams = { channel_ids: channelIDS };
    updateRender(this.wrapper, this.url, this.queryParams);
  }
}

/**
 * @classdesc Defines the bar chart handling category distribution.
 * @memberof postingFrequency
 * @see BarChart
 */
class Categories {
  constructor() {
    this.wrapper = document.querySelector(
      "section#visualizations figure#videoCategoryDistributionDiagram div#figureWrapper div#figureWrapperLeft div#videoCategoryBarChart"
    );
    this.url = "postingFrequencyCategoryChart";
    this.tooltipText = "Number of videos";

    this.queryParams = { channel_ids: channelIDS };
    this.chart = new BarChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      true, //is horizontal bar
      5, //border Radius
      true, //isdistributed
      false //hide legend
    );
    this.chart.render();
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.update();
  }

  /**Update when channel is seleced  */
  updateObserver() {
    this.queryParams = { channel_ids: channelIDS };
    this.chart = new BarChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      true, //is horizontal bar
      5, //border Radius
      true, //isdistributed
      false //hide legend
    );
    this.chart.render();
    this.update();
  }
}

/**
 * @classdesc Defines the bar chart handling category distribution.
 * @memberof postingFrequency
 * @see PieChart
 */
class SubCategories {
  constructor() {
    this.wrapper = document.querySelector(
      "section#visualizations figure#videoCategoryDistributionDiagram div#figureWrapper div#figureWrapperRight div#videoCategoryPieChart"
    );
    this.url = "postingFrequencyCategoryChart";
    this.tooltipText = "Number of videos";
    this.queryParams = { channel_ids: channelIDS };
    this.chart = new PieChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      ["#F44336", "#E91E63"]
    );
    this.chart.render();
    this.update();
  }

  /** Queries data and update sidebar button. */
  update() {
    this.chart.update();
  }

  /**Update when channel is seleced  */
  updateObserver() {
    this.queryParams = { channel_ids: channelIDS };
    this.chart = new PieChart(
      this.url,
      this.queryParams,
      this.wrapper,
      this.tooltipText,
      ["#F44336", "#E91E63"]
    );
    this.chart.render();
    this.update();
  }
}

/**
 * @classdesc Defines the table handling the channel location list.
 * @memberof postingFrequency
 */
class ChannelLocation {
  constructor() {
    this.wrapper = document.querySelector(
      "figure#channelLocationDiagram div#contentWrapper"
    );
    let channel_ids = [];
    trackerData.channels.forEach((channel) =>
      channel_ids.push(channel.channel_id)
    );
    this.queryParams = { channel_ids: channel_ids };
    this.url = "postingFrequencyMapList";
    this.update();
  }

  /** Fetches data and insert resulting render to the wrapper. */
  update() {
    insertRender(this.wrapper, this.url, this.queryParams);
  }
}

/**
 * @classdesc Fetches and displays data for the keywords map.
 * @memberof postingFrequency
 * @see WorldMap
 */
class ChannelMap {
  constructor() {
    this.url = "postingFrequencyMapChart";
    let channel_ids = [];
    trackerData.channels.forEach((channel) =>
      channel_ids.push(channel.channel_id)
    );
    this.queryParams = { channel_ids: channel_ids };
    this.wrapper = document.querySelector(
      "section#visualizations figure#channelLocationDiagram div#figureWrapper div#channelsWorldMapFigure"
    );
    this.worldMapFigure = new WorldMap(
      this.url,
      this.queryParams,
      this.wrapper
    );
    this.worldMapFigure.render();
    //   this.update();
  }

  /** Renders empty chart then queries data and update chart. */
  update() {
    this.worldMapFigure.update();
  }
}

/**
 * @classdesc Defines the table handling the channel details table.
 * @memberof postingFrequency
 */
class ChannelDetails {
  constructor() {
    this.wrapper = document.querySelector(
      "figure#channelDetailsDiagram div#contentWrapper"
    );
    let channel_ids = [];
    trackerData.channels.forEach((channel) =>
      channel_ids.push(channel.channel_id)
    );
    this.queryParams = { channel_ids: channel_ids };
    this.url = "postingFrequencyChannelDetails";
    this.update();
  }

  /** Fetches data and insert resulting render to the wrapper. */
  /** Fetches data and insert resulting render to the wrapper. */
  update() {
    // insertRender(this.wrapper, this.url, this.queryParams);
    let channelDetailsTable = new DataTable();
    fetchData(this.queryParams, "/" + this.url).then((response) => {
      channelDetailsTable.drawTable(response, this.wrapper);
    });
  }
}

/**
 * Declare page's objects when the DOM is loaded.
 * @listens DOMContentLoaded
 * @memberof postingFrequency
 */
document.addEventListener("DOMContentLoaded", function () {
  let postingFrequency = new PostingFrequency();
  let ribbon = new StatisticsRibbon();
  let postingFrequencyChart = new PostingFrequencyChart();
  let categories = new Categories();
  let subCategories = new SubCategories();
  let channelLocationTable = new ChannelLocation();
  let channelMap = new ChannelMap();
  let channelDetails = new ChannelDetails();

  channel.addObserver(postingFrequencyChart);
  channel.addObserver(ribbon);
  channel.addObserver(categories);
  channel.addObserver(subCategories);
});
