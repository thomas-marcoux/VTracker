// Functions used in the main Tracker pages

window.getCookieByName = function (name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
};

function getCsrfTokenHeader() {
    return {"X-CSRFToken": getCookieByName("csrftoken")};
}

    /** Tracker Sidebar START **/

// Switches visuals between Added/Removed to/from Tracker
function toggleTrackerButton(element) {
    if (element.classList.contains("btn-outline-secondary")) {
        element.classList.remove("btn-outline-secondary");
        element.classList.add("btn-success");
    }
    else if (element.classList.contains("btn-success")) {
        element.classList.remove("btn-success");
        element.classList.add("btn-outline-secondary");
    }
}

// Toggle Content-Tracker relationship
function clickedOnTracker(contentId, trackerId) {
    var trackerButton = document.getElementById(trackerId + "_tracker_button");
    $.ajax({
        type: 'POST',
        url: 'tracker/clickedOnTracker',
        headers: getCsrfTokenHeader(),
        data: {
            trackerId: trackerId,
            contentId: contentId,
            adding: !trackerButton.classList.contains("btn-success"),
        },
        success: function () {
            toggleTrackerButton(trackerButton);
        },
        error: function(error) {
            let error_message = error.responseJSON.message;
            console.log(error_message);
        }
    });
}

//  Add tracker button to the Tracker Sidebar
function createTrackerSidebarButton(trackerId, trackerName, contentId) {
    var newButton = document.createElement("button");
    newButton.classList.add("btn", "mb-1", "w-100", "text-left", "btn-outline-secondary")
    newButton.id = trackerId + "_tracker_button";
    newButton.innerHTML = trackerName;
    newButton.onclick = function(){ clickedOnTracker(contentId, trackerId); };
    return newButton;
}

    /** Tracker Sidebar END **/

//  Add Tracker details button to the Tracker Dashboard
// DEPRECATED - NEED NEW VERSION TO REFLECT LATEST TRACKER DASHBOARD
function createTrackerDashboardButton(trackerId, trackerName) {
    var newLink = document.createElement("a");
    var newButton = document.createElement("button");
    newButton.classList.add("btn", "btn-info", "mb-1", "mr-1");
    newButton.id = trackerId + "_tracker_button";
    newButton.innerHTML = trackerName;
    newLink.href = 'tracker/details/' + trackerId;
    newLink.innerHTML = newButton.outerHTML;
    return newLink;
}

// Send request to add Tracker to DB and add button to the HTML Tracker list
function addTracker(contentId = null) {
    var trackerName = document.getElementById("createTrackerInput").value;
    var errorElement = document.getElementById("trackerErrorMessage");
    var list = document.getElementById("trackerList");
    $.ajax({
        type: 'POST',
        url: 'tracker/addTracker',
        headers: getCsrfTokenHeader(),
        data: {
            trackerName: trackerName,
        },
        success: function (data) {
            if (!data.error) {
                var newListItem = document.createElement("li");
                newListItem.classList.add("d-inline");
                list.insertBefore(newListItem, list.childNodes[0]);
                // If the tracker is being added from the sidebar
                if (contentId) {
                    newListItem.appendChild(createTrackerSidebarButton(data.trackerId, trackerName, contentId));
                    clickedOnTracker(contentId, data.trackerId);
                }
                else {
                    newListItem.appendChild(createTrackerDashboardButton(data.trackerId, trackerName));
                }
                errorElement.style.display = "none"
            }
            else {
                errorElement.innerHTML = data.message;
                errorElement.style.display = "inline"
            }
        }
    });
}

class TrackMenu {

    constructor(cards = null) {

        this.trackMenuDummy = document.querySelector("div#trackMenu.dummy");
        this.cards = cards;
        this.initialize();

    }

    initialize() {

    }

    clone(type) {

        this.trackMenuCopy = this.trackMenuDummy.cloneNode(true);
        this.trackMenuCopy.classList.remove("dummy");
        this.show();
        
        this.trackMenuCopy.classList.add(type);

        this.trackersWindow = this.trackMenuCopy.querySelector('div#menu ul#trackers');
        this.createTrackerForm = this.trackMenuCopy.querySelector("form#createTrackerForm");
        this.addTrackerButton = this.trackMenuCopy.querySelector("form#createTrackerForm button#addTracker");
        this.createTrackerButton = this.trackMenuCopy.querySelector("form#createTrackerForm button#createTracker");
        this.trackerName = this.createTrackerForm.querySelector('input#trackerName')
        this.trackerDesc = this.createTrackerForm.querySelector('textarea#trackerDescription')
        this.searchBox = this.trackMenuCopy.querySelector("input#searchBox");
        this.trackMenuCopy.addEventListener("touchend", this.menuClickListener);
        this.trackMenuCopy.addEventListener("click", this.menuClickListener);
        this.searchBox.addEventListener("keyup", this.searchBoxKeyUpListener.bind(this));
    }

    searchBoxKeyUpListener() {            
        let trackers = event.target.parentElement.querySelector("ul#trackers").getElementsByTagName('li');
        let searchValue = event.target.value;
        //Dynamic Search List
        if(searchValue.length == 0 ){ //Reset list
            for(var i=0; i < trackers.length; i++){
                trackers[i].style.display = 'block';}
        }
        for(var i=0; i < trackers.length; i++){//Reset list after backspacing
            if((trackers[i].getElementsByTagName('span')[0].innerHTML).toUpperCase().includes(searchValue.toUpperCase())){
                trackers[i].style.display = 'block';
            }
            else if(!(trackers[i].getElementsByTagName('span')[0].innerHTML).toUpperCase().includes(searchValue.toUpperCase())){//Hide unmatched search results
                trackers[i].style.display = 'none';
            }
        }
    }

    // Check tracker Ids for existing tracker relationships
    queryTrackerRelationship(trackerIds, contentId) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/tracker/queryTrackerRelationship',
                headers: getCsrfTokenHeader(),
                data: {
                    trackerIds: trackerIds,
                    contentId: contentId,
                },
                success: function (data) {
                    resolve(data);
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
    }

    setupTrackers(type, contentId) {

        this.trackers = this.trackMenuCopy.querySelectorAll("div#menu ul#trackers li");

        let trackerIds = [];
        for (let i = 0; i < this.trackers.length; i++) {
            this.trackers[i].addEventListener("click", this.trackersClickListener.bind(this));
            trackerIds.push(this.trackers[i].getAttribute("trackerId"));
        }

        if (type == "footer") {
            return;
        }
        
        this.contentId = contentId;
        this.queryTrackerRelationship(trackerIds, contentId)
        .then(data => {
            if (data.trackerRelationships) {
                let relationships = data.trackerRelationships;
                for (let i = 0; i < this.trackers.length; i++) {
                    let button = this.trackers[i].querySelector('button#checkMark');
                    let trackerId = this.trackers[i].getAttribute("trackerId");
                    if (relationships[trackerId] == true) {
                        button.classList.add('selected');
                    }
                    else {
                        button.classList.remove('selected');
                    }
                }
            }
        })
        .catch(error => {
            console.log(error);
        });
    }

    trackersClickListener() {
        
        let button = event.target.parentElement.querySelector("button#checkMark");
        let adding = !button.classList.contains('selected');
        let trackerId = button.parentElement.getAttribute("trackerId");
        let contentIds = [];

        // Card - Single selection
        if (this.trackMenuCopy.classList.contains('card')) {
            contentIds.push(this.contentId);
        }
        // Footer - Multi-selection
        else if (this.trackMenuCopy.classList.contains('footer')) {
            let selectedThumbnails = document.querySelectorAll('main#content ul#cards li#card div#thumbnail.selected');

            for (let i = 0; i < selectedThumbnails.length; i++) {
                contentIds.push(selectedThumbnails[i].parentElement.getAttribute("contentId"));
            }
        }
        else {
            console.log('Incorrect type');
            return;
        }

        trackersClickHandler(trackerId, contentIds, adding).then(data => {
            button.classList.toggle("selected");
            if (this.cards) {
                this.cards.updateTrackingButtons();
            }
        })
        .catch(error => {
            let error_message = error.responseJSON.message;
            console.log(error_message);
        })
    }

    setupCreateTracker() {

        this.addTrackerButton.addEventListener("click", this.addTrackerClickListener.bind(this));
        this.createTrackerButton.addEventListener("click", this.createTrackerClickHandler.bind(this));

    }

    addTrackerClickListener(event) {

        event.preventDefault();
        this.createTrackerForm.classList.toggle("creating");
        // Reset field values in case of previous tracker creation
        this.createTrackerForm.querySelector('input#trackerName').value = '';
        this.createTrackerForm.querySelector('textarea#trackerDescription').value = '';
    }

    createTrackerClickHandler(event) {
        event.preventDefault();
        this.createTrackerAction();
    }

    createTrackerAction() {
        let trackerName = this.trackerName.value.trim();
        let trackerDesc = this.trackerDesc.value;
        let trackerListDummy = this.trackMenuDummy.querySelector('div#menu ul#trackers');
        let trackerListCopy = this.trackersWindow;

        if(trackerName.length != 0){//Empty field for tracker name
            createTracker(trackerName, trackerDesc).then(data => {
                if (!data.error) {
                        let newListItem = document.createElement("li");
                        newListItem.setAttribute("trackerId", data.trackerId);
                        newListItem.innerHTML = '<span>' + trackerName.substring(0,15) + '</span><button id="checkMark"></button>';
                        trackerListDummy.insertBefore(newListItem.cloneNode(true), trackerListDummy.childNodes[0]);
                        trackerListCopy.insertBefore(newListItem, trackerListCopy.childNodes[0]);
                        newListItem.addEventListener('click', this.trackersClickListener.bind(this));
                        if (document.querySelector('p#errorMessage') != undefined) {
                            $('p#errorMessage').remove()
                            $('div#createTrackerFormWrapper input#trackerName').css({"border-color":""})
                        }
                    }
                else {
                    if (document.querySelector('p#errorMessage') == undefined){
                        $('div#createTrackerFormWrapper').append("<p id='errorMessage' style='color:red;'>There is another tracker with the same name.</p>")
                        $('div#createTrackerFormWrapper input#trackerName').css({"border-color": "red"})
                    }
                    console.log(data.message);

                }
                }).catch(error => {
                    console.log(error);
                });
                createTrackerForm.classList.toggle('creating');
            }
        }           
        

    show() {

        this.trackMenuCopy.classList.remove("hidden");

    }

    hide() {

        this.trackMenuCopy.classList.add("hidden");

    }

    create(type, content=null) {

        this.clone(type);
        this.setupTrackers(type, content);
        this.setupCreateTracker();

    }

    menuClickListener(event) {
        if (document.querySelector('p#errorMessage') != undefined) {
            $('p#errorMessage').remove()
            $('div#createTrackerFormWrapper input#trackerName').css({"border-color":""})
        }
        event.stopPropagation(); // https://stackoverflow.com/questions/152975/how-do-i-detect-a-click-outside-an-element

    }

}

function trackersClickHandler(trackerId, contentIds, adding) {
    return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: 'tracker/clickedOnTracker',
                dataType: 'json',
                headers: getCsrfTokenHeader(),
                data: {
                    trackerId: trackerId,
                    contentIds: contentIds,
                    adding: adding,
                },
                success: function(data) {
                    resolve(data);
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
}

