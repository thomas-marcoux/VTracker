/*



	" Reimplement the wheel to either learn, or make it better. "

    http://www.hayder.design/
    https://www.youtube.com/watch?v=QOlTGA3RE8I
    
    Product Name: YouTubeTracker,
	Description: Tracking YouTube"s data.
	Beneficiary: COSMOS
	
	Copyright © 1992 - 2019 HAYDER, All Rights Reserved.
	
	
	
*/



document.addEventListener("DOMContentLoaded", function() {

    // Header

    class Header {

        constructor() {

            this.header = document.querySelector("header");
            this.initialize();

        }

        initialize() {

            

        }

        addCSSClass(cssClass) {

            this.header.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.header.classList.remove(cssClass);

        }

    }

    // Search

    class Search {
        
        // This class extends the functionality of a text input to be resizable to its content in realtime, and adds other useful search features.

        constructor(itemsManager) {
            this.search = document.querySelector("form#search");
            this.searchBox = this.search.querySelector("input#searchBox");
            this.maxWidth = 0.8;
            this.itemsManager = itemsManager;
            this.initialize();

        }

        initialize() {
            this.search.addEventListener("submit", function(event) {event.preventDefault();});
            this.searchBox.addEventListener("keyup", this.searchBoxKeyUpListener.bind(this));
        }

        searchBoxKeyUpListener(event) {
            event.preventDefault();
            if (event.key === "Enter") {
                this.searchBox.blur();
                this.itemsManager.search(this.searchBox.value);
            }
            if (event.key === "Escape") {
                this.searchBox.blur();
            }
        }

    }

    class ItemsManager {

        constructor() {
        // constructor(trackMenu) {
            this.pageOffset = 1;
            this.pageNumber = 1;
            this.itemsPerPage = 4; //Should not be changed, item container height is fixed
            this.barcodeWidth = 2048;
            this.itemIDs = [];
            // this.trackMenu = trackMenu;
            this.videoCount = parseInt(document.querySelector("div#videos div#count").innerHTML, 10);
            this.maxPage = Math.ceil(this.videoCount / this.itemsPerPage);
            this.trackerId = document.querySelector("div#head").getAttribute("trackerId");
            this.pageContainer = document.querySelector("div#pagination");
            this.container = document.querySelector("div#videosChannels ul#list");
            this.backArrow = document.querySelector("div#arrows div#backArrow");
            this.forwardArrow = document.querySelector("div#arrows div#forwardArrow")
            this.loadingIcon = document.querySelector("ul#list div#loading");
            this.initialize();
        }

        initialize() {
            this.backArrow.addEventListener("click", this.previousPageEvent.bind(this));
            this.forwardArrow.addEventListener("click", this.nextPageEvent.bind(this));
            this.updateItemList();
        }

        search(searchValue) {
            this.searchValue = searchValue;
            this.updateItemList();
        }

        update(pageNumber) {
            this.pageNumber = (pageNumber == null ? 1 : pageNumber);
            this.clearItems();
            this.updatePages();
            this.updateItems();
        }

        previousPageEvent(event) {
            let targetPage = this.pageNumber - 1;
            if (targetPage > 0) {
                this.update(targetPage);
            }
        }

        nextPageEvent(event) {
            let targetPage = this.pageNumber + 1;
            if (targetPage <= this.maxPage) {
                this.update(targetPage);
            }
        }

        pageClickEvent(event) {
            let targetPage = parseInt(event.target.innerHTML, 10);
            if (targetPage != this.pageNumber) {
                this.update(targetPage);
            }
        }

        clearItems() {
            while(this.pageContainer.firstChild){
                this.pageContainer.removeChild(this.pageContainer.firstChild);
            }
            while(this.container.childElementCount > 2){
                this.container.removeChild(this.container.lastChild);
            }
        }

        updatePages() {
            let i = 1;
            let offset = this.pageOffset;
            let pageItem = document.createElement('div');
            pageItem.classList.add('page');
            while (i <= this.maxPage) {
                let p = pageItem.cloneNode();
                p.classList.remove('selected');
                if (i == this.pageNumber) {
                    p.classList.add('selected');
                }
                if (i <= offset || (i >= this.pageNumber - offset && i <= this.pageNumber + offset) || i >= this.maxPage - offset) {
                    p.innerText = i;
                    p.addEventListener("click", this.pageClickEvent.bind(this));
                    this.pageContainer.appendChild(p);
                }
                i = i + 1;
            }
        }

        queryPageItems(itemIDs, barcodeWidth) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: '/tracker/getPaginatedVideos',
                    type: 'POST',
                    headers: getCsrfTokenHeader(),
                    data: {
                        itemIDs: itemIDs,
                        barcodeWidth: barcodeWidth,
                    },
                    dataType: 'json',
                    success: function (data) {
                        resolve(data);
                    },
                    error: function(error) {
                        reject(error);
                    }
                });
            });
        }

        // trackStatusButtonClickListener(event) {
        //         event.target.classList.add("selected");
        //         trackMenu.create("card", event.target.parentElement.parentElement.getAttribute("id"));
        //         event.target.parentElement.prepend(trackMenu.trackMenuCopy);
        //     }

        updateItems() {
            this.loadingIcon.style.display = "block";
            let start = (this.pageNumber - 1) * this.itemsPerPage;
            let end = (this.pageNumber * this.itemsPerPage < this.itemIDs.length ? (this.pageNumber * this.itemsPerPage) : this.itemIDs.length);
            let targetIDs = this.itemIDs.slice(start, end);
            this.queryPageItems(targetIDs, this.barcodeWidth).then(data => {
                let doc = new DOMParser().parseFromString(data.render, 'text/html');
                doc.body.childNodes.forEach(child => {
                    let deleteFromTrackerButton = child.querySelector("button#delete");
                    if (deleteFromTrackerButton) {
                        deleteFromTrackerButton.addEventListener("click", this.deleteContentButtonClickListener.bind(this));
                    }
                    // let trackStatusButton = child.querySelector("button#trackStatusButton");
                    // trackStatusButton.addEventListener("click", this.trackStatusButtonClickListener.bind(this));
                    this.container.append(child)
                });
                this.loadingIcon.style.display = "none";
            })
            .catch(error => {
                this.loadingIcon.style.display = "none";
                console.log(error);
            });

        }

        updateItemList() {
            this.queryTrackerItems(this.trackerId, this.searchValue).then(data => {
                this.itemIDs = data.itemIDs;
                this.maxPage = Math.ceil(this.itemIDs.length / this.itemsPerPage);
                this.update();
            })
            .catch(error => {
                console.log(error);
            });
        }

        queryTrackerItems(trackerId, searchValue) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: '/tracker/getTrackerVideos',
                    type: 'POST',
                    headers: getCsrfTokenHeader(),
                    data: {
                        trackerId: trackerId,
                        searchValue: searchValue,
                    },
                    dataType: 'json',
                    success: function (data) {
                        resolve(data);
                    },
                    error: function(error) {
                        reject(error);
                    }
                });
            });
        }

        deleteContentButtonClickListener(event) {
            let callingItem = event.target.parentElement.parentElement;
            let contentType = callingItem.className;
            let contentId = callingItem.getAttribute("id");
            this.deleteContentFromTracker(this.trackerId, contentId).then(data => {
                let counter = $('div#' + contentType + 's div#count');
                let value = parseInt(counter.html());
                counter.html(value - 1);
                this.itemIDs = this.itemIDs.filter(function(e) { return e !== contentId })
                this.maxPage = Math.ceil(this.itemIDs.length / this.itemsPerPage);
                this.update();
            })
            .catch(error => {
                console.log(error);
                alert('Error when deleting the content.');
            });
        }

        deleteContentFromTracker(tracker_id, content_id) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: 'POST',
                    url: '/tracker/content/delete',
                    headers: getCsrfTokenHeader(),
                    data: {
                        tracker_id: tracker_id,
                        content_id: content_id
                    },
                    datatype: 'json',
                    success: function (data) {
                        resolve(data);
                    },
                    error: function(error) {
                        reject(error);
                    }
                });
            });
        }
    }

    // Initialization

    let header = new Header();
    let itemsManager = new ItemsManager();
    // let trackMenu = new TrackMenu(); // Defined in trackerFunctions.js
    // let itemsManager = new ItemsManager(trackMenu);
    let search = new Search(itemsManager);

    let errorElement = $("#trackerErrorMessage");
    let trackerId = $("#container").attr("trackerId");
    let renameButton = $("#renameButton");
    let trackerIsEditable = false;

    errorElement.hide();

    renameButton.on("click", function() {
        if (trackerIsEditable) {
            renameTracker($(this), trackerId);
        }
        else {
            enableRename($(this));
        }
        trackerIsEditable = !trackerIsEditable;
      });

});


window.getCookieByName = function (name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
};

function getCsrfTokenHeader() {
    return {"X-CSRFToken": getCookieByName("csrftoken")};
}

function showError(data) {
    let errorElement = $("#trackerErrorMessage");
    errorElement.html(data.message);
    errorElement.show();
}

function enableRename(renameButton) {
    let titleElement = $("#trackerNameField");
    renameButton.html("Submit");
    let trackerName = titleElement.text().trim();
    titleElement.replaceWith('<input id="trackerInputField" class="form-control mr-2" required value="'
        + trackerName + '"/>');
}

function renameTracker(renameButton, trackerId) {
    let inputElement = $("#trackerInputField");
    let newTrackerName = inputElement.val().trim();
    $.ajax({
        type: 'POST',
        url: '/tracker/rename',
        headers: {"X-CSRFToken": getCookieByName("csrftoken")},
        data: {
            tracker_id: trackerId,
            new_name: newTrackerName
        },
        datatype: 'text',
        success: function(data) {
            if (!data.error) {
                $("#trackerErrorMessage").hide();
                inputElement.replaceWith('<h4 id="trackerNameField" class="card-title">'
                + newTrackerName + '</h4>');
                renameButton.html("Rename");
                alert('Tracker renamed successfully.');
                trackerName = newTrackerName;
            }
            else {
                showError(data);
            }
        },
        error: function(data) {
            showError(data);
        }
    });
}

function deleteTracker() {
    let trackerName = event.target.parentElement.getAttribute("trackerName");
    $.ajax({
        type: 'POST',
        url: '/tracker/delete',
        headers: getCsrfTokenHeader(),
        data: {
            tracker_name: trackerName,
        },
        datatype: 'text',
        success: function () {
            window.location.href = '/trackers';
        },
        error: function (data) {
            console.info(data);
            alert('Tracker could not be deleted. Try again.');
        }
    });
}
