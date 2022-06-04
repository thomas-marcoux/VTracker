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
 * @fileoverview Implementation of Tabulator.js library for tables in YouTubeTracker pages.
 * @author Ivory Okeke
 * @author Oluwaseyi Adeliyi
 * @copyright COSMOS 2021
 */


/**
 * @classdesc General Tabulator function implementation for standard tables
 */



class DataTable{

    /**
   * Format data to be displayed in the table.
   * @param {Object} columns optional columns to be shown.
   */

    constructor(columns = null){
        this.params = {
            layout: "fitColumns",
            autoColumns: true,
            // pagination: "local",
            //
            ajaxProgressiveLoad:"scroll",
            ajaxURL:"contentAnalysisVideoDetails",
            paginationSize: 50,
            // sizeSelector: [3, 6, 8, 10],
            // isMovable: true,
            // height: "400px",
            placeholder: "No Data Set"
        }
        if (columns) {
            this.params['columns'] = columns;
            this.params.autoColumns = false;
        }
        this.table = null;
    }


    /**
   * Format data to be displayed in the table.
   * @param {Object} data response data.
   */
    drawTable(data, container) {
        this.params['data'] = data.data;
        this.table = new Tabulator(container, this.params);
    }
}


/**
 * @classdesc Tabulator function implementation for Content Analysis video comments table.
 * @augments DataTable
 */

 class DataTableVideoComments extends DataTable{

    constructor(commentsTable)
    {
        super();
        this.commentsTable = commentsTable;
        this.params['autoColumns']=false,
        this.params['columns']=[
            {title:"Title", field:"Title"},
            {title:"Emotion", field:"Emotion"},
        ];
        this.params['dataLoaded'] = (data) =>
            this.updateComments(this.commentsTable, data[0]['video_id']);
        this.params['rowClick'] = (_event, row) =>
            this.updateComments(this.commentsTable, row.getData()["video_id"]);
    }
    
    updateComments(commentsTable, video_id) {
        let queryParams = { videoId: video_id };
        let commentsUrl = "contentAnalysisPaginatedComments";
        let commentsWrapper = document.querySelector(
            "figure#videoDescriptionLanguageDiagram div#commentsWrapper"
        );
        fetchData(queryParams, "/" + commentsUrl).then(
            (response) => {
                commentsTable.drawTable(response, commentsWrapper);
            }
        );
    }
}


/**
 * @classdesc Tabulator function implementation for Content Engagement video player table.
 *  Handles behavior when clicking on a video. Loading the video's player.
 * @augments DataTable
 */

 class DataTableVideoPlayer extends DataTable{

    constructor()
    {
        super();
        this.params['autoColumns']=false,
        this.params['columns']=[
            {title:"Title", field:"video_title"},
            {title:"Views", field:"total_views"},
        ];
        this.params['dataLoaded'] = function(data){
            window.document.getElementById("videoPlayer").src =
                "https://www.youtube.com/embed/" + data[0]['video_id'];
        };
        this.params['rowClick'] = function(_event, row){
            window.document.getElementById("videoPlayer").src =
            "https://www.youtube.com/embed/" + row.getData()["video_id"];
        };
    };
}

