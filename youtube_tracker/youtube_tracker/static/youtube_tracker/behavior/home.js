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

    // General

    class General {

        constructor() {

            this.document1 = document.body;
            this.document2 = document.documentElement;
            this.scrollClass = "scroll";
            this.range = 100;
            this.initialize();

        }

        initialize() {

            window.addEventListener("scroll", this.windowScroll.bind(this));

        }

        windowScroll() {

            if ((this.document1.scrollTop > this.range) || (this.document2.scrollTop > this.range)) {

                header.addCSSClass(this.scrollClass);
                search.addCSSClass(this.scrollClass);
                search.resizeSearchBox();
                options.addCSSClass(this.scrollClass);
                returnTop.addCSSClass(this.scrollClass);
                separator.addCSSClass(this.scrollClass);

            } else {

                header.removeCSSClass(this.scrollClass);
                search.removeCSSClass(this.scrollClass);
                search.resizeSearchBox();
                options.removeCSSClass(this.scrollClass);
                returnTop.removeCSSClass(this.scrollClass);
                separator.removeCSSClass(this.scrollClass);

            }

        }

    }

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

        constructor(contentManager) {
            
            this.search = document.querySelector("section#search");
            this.searchBox = document.querySelector("section#search input#searchBox");
            this.searchIcon = document.querySelector("section#search div#searchIcon");
            this.searchSuggestion = document.querySelector("section#search datalist#searchSuggestions");
            this.contentManager = contentManager;
            this.editingClass = "editing";
            this.displayedClass = "displayed";
            this.maxWidth = 0.8;
            this.initialize();

        }

        initialize() {

            this.searchIcon.classList.add(this.displayedClass);
            this.searchBox.addEventListener("focus", this.searchBoxFocusListener.bind(this));
            this.searchBox.addEventListener("blur", this.searchBoxBlurListener.bind(this));
            this.searchBox.addEventListener("input", this.searchBoxInputListener.bind(this));
            this.searchBox.addEventListener("keyup", this.searchBoxKeyUpListener.bind(this));
            window.addEventListener("resize", this.resizeSearchBox.bind(this));
            this.resizeSearchBox();

        }

        searchBoxFocusListener() {

            if (!this.searchIcon.classList.contains(this.editingClass)) {

                this.searchIcon.classList.add(this.editingClass);
                this.searchIconClickListenerCopy = this.searchIconClickListener.bind(this);
                this.searchIcon.addEventListener("click", this.searchIconClickListenerCopy);

            }

        }

        searchBoxBlurListener() {

            if (!this.searchBox.value && this.searchIcon.classList.contains(this.editingClass)) {

                this.searchIcon.classList.remove(this.editingClass);
                this.searchIcon.removeEventListener("click", this.searchIconClickListenerCopy);

            }

        }

        searchBoxInputListener() {

            this.resizeSearchBox();
            this.suggest();

        }

        searchBoxKeyUpListener(event) {

            if (event.key === "Enter") {

                this.searchBox.blur();
                counters.show();
                counters.center();
                contentManager.resetCards();
                contentManager.updateContent();

            }

            if (event.key === "Escape") {
                
                this.searchBox.blur();

            }

        }

        searchIconClickListener() {
            
            this.searchIcon.classList.remove(this.editingClass);
            this.searchIcon.removeEventListener("click", this.searchIconClickListenerCopy);
            this.searchBox.value = "";
            this.resizeSearchBox();
            counters.hide();

        }

        resizeSearchBox() {

            let content = "";

            if (this.searchBox.value) {

                content = this.searchBox.value;

            } else {

                content = this.searchBox.getAttribute("placeholder");

            }
            
            let contentWidth = parseInt(this.getContentWidth(content));
            let windowWidth = parseInt(window.innerWidth * this.maxWidth);

            if (contentWidth < windowWidth) {

                this.searchBox.style.width = contentWidth + "px";

            } else {
                
                this.searchBox.style.width = windowWidth + "px";

            }

        }

        getContentWidth(content) {

            // https://stackoverflow.com/questions/16478836/measuring-length-of-string-in-pixel-in-javascript

            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");
            let font = getComputedStyle(this.searchBox).fontWeight + " " + getComputedStyle(this.searchBox).fontSize + " " + getComputedStyle(this.searchBox).fontFamily; 
            ctx.font = font;     
            let width = ctx.measureText(content).width;
            canvas = null;
            ctx = null;

            return width;

        }

        getSuggestions() {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: '/search/autoSuggest?term=' + this.searchBox.value,
                    type: 'GET',
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

       suggest() {
            this.getSuggestions().then(data => {
                let newSuggestion = "";
                for (let i = 0; i < data['searchResults']['suggestionGroups'][0]['searchSuggestions'].length; i++) {
                    newSuggestion += '<option class="dropdown-item" value=\'' + data['searchResults']['suggestionGroups'][0]['searchSuggestions'][i]['displayText'] + '\' >'
                }
                this.searchSuggestion.innerHTML = newSuggestion;
                })
                .catch(error => {
                    console.log(error);
                });
        }

        addCSSClass(cssClass) {

            this.search.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.search.classList.remove(cssClass);

        }

    }

    // Separator

    class Separator {

        constructor() {

            this.separator = document.querySelector("div#separator");
            this.initialize();

        }

        initialize() {



        }

        addCSSClass(cssClass) {

            this.separator.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.separator.classList.remove(cssClass);

        }

    }

    // Options

    class Options {

        constructor() {

            this.options = document.querySelector("section#options");
            this.initialize();

        }

        initialize() {



        }

        addCSSClass(cssClass) {

            this.options.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.options.classList.remove(cssClass);

        }

    }

    class Counters {

        constructor() {

            this.counters = document.querySelector("section#options p#counters");
            this.videosCounter = document.querySelector("section#options p#counters span#videoCounter");
            this.channelsCounter = document.querySelector("section#options p#counters span#channelsCounter");
            this.hiddenClass = "hidden";
            this.initialize();

        }

        initialize() {

        }

        show() {
            
            this.counters.classList.remove(this.hiddenClass);
            
        }

        hide() {
            
            this.counters.classList.add(this.hiddenClass);
            
        }

        updateCounter(totalResults) {
            this.videosCounter.innerHTML = formatNumber(totalResults);
        }

        center() {
            
            document.querySelector("section#options p#counters").classList.add("center");

        }

    }

    class Filters {

        constructor() {

            this.options = document.querySelector("section#options");
            this.filters = document.querySelectorAll("section#options ul#filters li.filter");
            this.filtersLabel = document.querySelector("section#options ul#filters span#sortLabel");
            this.filterButtons = document.querySelectorAll("section#options ul#filters li.filter button.filter:not(.more)");
            this.moreButton = document.querySelector("section#options ul#filters li.filter button.filter.more");
            this.selectedClass = "selected";
            this.hiddenClass = "hidden";
            this.centerClass = "center";
            this.maxLength = 0;
            this.initialize();

        }

        initialize() {

            this.resize();

            let url = new URL(window.location);
            this.orderType = url.searchParams.get("sp");
            if (this.orderType == null) {
                this.orderType = "relevance";
            }
            if (this.orderType == "relevance") {
                this.filtersLabel.textContent = "Relevance";
            }

            this.pba = url.searchParams.get("pba");
            if (this.pba == null) {
                this.pba = "none";
            }

            for (let i = 0; i < this.filterButtons.length; i++) {

                this.filterButtons[i].addEventListener("click", this.filterButtonsClickListener.bind(this));

            }

        }

        filterButtonsClickListener(event) {

            let textContent = event.target.textContent;
            this.decide(textContent);
            
        }

        select(target) {

            target.classList.add(this.selectedClass);

        }

        deselect(target) {

            target.classList.remove(this.selectedClass);

        }

        deselectAll() {

            for (let i = 0; i < this.filterButtons.length; i++) {

                this.filterButtons[i].classList.remove(this.selectedClass);

            }

        }

        resize() {

            if ((this.filters.length - 1) > this.maxLength) {

                for (let i = this.maxLength; i < (this.filters.length - 1); i++) {
                    
                    moreMenu.insertItem(this.filters[i]);

                }

                this.moreButton.classList.remove(this.hiddenClass);
                this.moreButton.addEventListener("click", this.moreButtonClickListener.bind(this));

            }

        }

        moreButtonClickListener() {

            if (moreMenu.moreMenu.classList.contains(this.hiddenClass)) {
                
                moreMenu.show();

            } else {

                moreMenu.hide();

            }

        }

        decide(textContent) {

            this.filtersLabel.textContent = textContent;
            this.orderType = "relevance";
            this.pba = "none";

            switch (textContent) {
            
                case "Relevance": {
                    break;
                }
            
                case "Today": {
                    this.pba = "day";
                    break;
                }
            
                case "This week": {
                    this.pba = "week";
                    break;
                }
            
                case "This month": {
                    this.pba = "month";
                    break;
                }
            
                case "Date": {
                    this.orderType = "date";
                    break;
                }
            
                case "Views": {
                    this.orderType = "viewCount";
                    break;
                }
            
                case "Rating": {
                    this.orderType = "rating";
                    break;
                }
            
                case "Title": {
                    this.orderType = "title";
                    break;
                }
            
                case "Video Count": {
                    this.orderType = "videoCount";
                    break;
                }
            }

            contentManager.resetCards();
            contentManager.updateContent();

        }

    }

    class Views {

        constructor() {

            this.views = document.querySelector("section#options div#views");
            this.buttons = document.querySelectorAll("section#options div#views button");
            this.selectedClass = "selected";
            this.initialize();

        }

        initialize() {

            for (let i=0; i < this.buttons.length; i++) {

                this.buttons[i].addEventListener("click", this.buttonsClickListener.bind(this));

            }

        }

        buttonsClickListener(event) {
            
            if (!event.target.classList.contains("selected")) {

                for (let i = 0; i < this.buttons.length; i++) {

                    this.buttons[i].classList.remove(this.selectedClass);

                }

                event.target.classList.add(this.selectedClass);

                this.decide(event.target.id);

            }
            
        }

        decide(id) {

            switch (id) {

                case "gridView": {

                    cards.setGridView();
                    console.log("gridView");
                    break;

                }

                case "listView": {

                    cards.setListView();
                    console.log("listView");
                    break;

                }

            }

        }

    }

    class MoreMenu {

        constructor() {

            this.moreMenuDummy = document.querySelector("div#moreMenu.dummy");
            this.moreButton = document.querySelector("section#options ul#filters li.filter button.filter.more");
            this.dummyClass = "dummy";
            this.hiddenClass = "hidden";
            this.initialize();

        }

        initialize() {

            this.clone();

        }

        clone() {

            this.moreMenu = this.moreMenuDummy.cloneNode(true);
            this.moreMenu.classList.remove(this.dummyClass);
            this.moreButton.parentElement.prepend(this.moreMenu);

        }

        show() {

            // https://stackoverflow.com/questions/33859113/javascript-removeeventlistener-not-working-inside-a-class
            // https://stackoverflow.com/questions/36695438/detect-click-outside-div-using-javascript

            filters.select(this.moreButton);
            this.moreMenu.classList.remove(this.hiddenClass);
            this.windowClickListenerCopy = this.windowClickListener.bind(this);
            window.addEventListener("touchend", this.windowClickListenerCopy);
            window.addEventListener("click", this.windowClickListenerCopy);

        }

        hide() {

            filters.deselect(this.moreButton);
            this.moreMenu.classList.add(this.hiddenClass);
            window.removeEventListener("touchend", this.windowClickListenerCopy);
            window.removeEventListener("click", this.windowClickListenerCopy);


        }

        insertItem(item) {

            item.classList.add("more");
            document.querySelector("div#moreMenu ul#list").append(item);

        }

        windowClickListener(event) {

            if (!((event.target.classList.contains("more")) && (event.target.classList.contains("filter")))) {

                this.hide();

            }

        }

    }

    class Cards {

        constructor() {

            this.selectedClass = "selected";
            this.numberOfSelectedVideos = 0;
            this.numberOfSelectedChannels = 0;
            this.update();

        }

        update() {
            this.cards = document.querySelector("main#content ul#cards");
            this.content = document.querySelectorAll("main#content ul#cards li#card");
            this.thumbnails = document.querySelectorAll("main#content ul#cards li#card div#thumbnail");
            this.checkMarks = document.querySelectorAll("main#content ul#cards li#card div#thumbnail button#checkMark");
            this.favorButtons = document.querySelectorAll("main#content ul#cards li#card div#thumbnail button#favor");
            this.videoTitle = document.querySelectorAll("main#content ul#cards li#card.video div#detailsWrapper div#details p#title span");
            this.channelTitle = document.querySelectorAll("main#content ul#cards li#card.channel div#detailsWrapper div#details p#title span");
            this.trackStatusButtons = document.querySelectorAll("main#content ul#cards li#card div#wrapper button#trackStatusButton");

            // Bind events to the latest items added
            for (let i = totalItemsLoaded - itemQueryCount; totalItemsLoaded > 0 && i < this.thumbnails.length; i++) {

                this.thumbnails[i].addEventListener("click", this.thumbnailClickListener.bind(this));
                this.trackStatusButtons[i].addEventListener("click", this.trackStatusButtonClickListener.bind(this));

            }
            this.updateTrackingButtons();

            // Bind events to the latest items added
            for (let i = totalItemsLoaded - itemQueryCount; totalItemsLoaded > 0 && i < this.videoTitle.length; i++) {

                this.videoTitle[i].addEventListener("click", this.videoTitleClickListener.bind(this));

            }

            for (let i = totalItemsLoaded - itemQueryCount; totalItemsLoaded > 0 && i < this.channelTitle.length; i++) {

                this.channelTitle[i].addEventListener("click", this.videoTitleClickListener.bind(this));

            }

        }

        resetCards(){
            while (this.cards.firstChild) {
                this.cards.removeChild(this.cards.firstChild);
            }
            totalItemsLoaded = 0;
        }

        queryTrackerRelationship(contentIds) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: 'tracker/queryTrackerRelationship',
                    headers: getCsrfTokenHeader(),
                    data: {
                        contentIds: contentIds
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

        updateTrackingButtons() {
            let contentIds = [];
            for (let i = 0; i < this.content.length; i++) {
                contentIds.push(this.content[i].getAttribute("contentId"));
            }

            this.queryTrackerRelationship(contentIds).then(data => {
                if (data.totalTracking) {
                    for (let i = 0; i < this.trackStatusButtons.length; i++) {
                        let id = this.trackStatusButtons[i].parentElement.parentElement.parentElement.getAttribute("contentId");
                        let n = data.totalTracking[id];
                        this.trackStatusButtons[i].innerHTML = n + ' TRACKS';
                        if (n > 0) {
                            this.trackStatusButtons[i].classList.add("tracking");
                        }
                        else {
                            this.trackStatusButtons[i].classList.remove("tracking");
                        }
                    }
                }
            })
            .catch(error => {
                console.log(error);
            });
        }

        videoTitleClickListener(event) {
            this.openModal(event);
        }

        thumbnailClickListener(event) {
            if (event.target.id == "favor") {

                this.favorClick(event);

            } else if (event.target.id == "checkMark") {

                this.checkMarkClick(event);

            } else {

                this.thumbnailClick(event);
            }

        }

        favorClick(event) {

            event.target.classList.toggle(this.selectedClass);
            console.log("favor");

        }

        thumbnailClick(event) {
            this.openModal(event);
        }

        openModal(event) {
            let contentId = event.target.parentElement.parentElement.getAttribute('contentId');

            if (event.currentTarget.parentElement.classList.contains("video"))  {
                modals.show();
                videoModal.show(contentId);
            } else if (event.currentTarget.parentElement.classList.contains("channel")) {
                modals.show();
                channelModal.show(contentId);
            }
            else if (event.currentTarget.parentElement.parentElement.parentElement.parentElement.classList.
            contains("video")){
                let contentId = event.target.parentElement.parentElement.parentElement.parentElement.
                getAttribute('contentId');
                modals.show();
                videoModal.show(contentId);
            }
            else if (event.currentTarget.parentElement.parentElement.parentElement.parentElement.classList.
            contains("channel")){
                let contentId = event.target.parentElement.parentElement.parentElement.parentElement.
                getAttribute('contentId');
                modals.show();
                channelModal.show(contentId);
            }
            else {
                console.log("Element is incorrectly tagged (class must contain 'video' or 'channel')");
            }
        }

        checkMarkClick(event) {

            this.selectDeselect(event);
            this.updateSelectionCounters(event);
            bottomMessage.update();

        }

        selectDeselect(event) {

            event.currentTarget.classList.toggle(this.selectedClass);

        }

        deselectAll() {

            this.numberOfSelectedChannels = 0;
            this.numberOfSelectedVideos = 0;
            let selectedCards = this.cards.querySelectorAll("li#card div#thumbnail.selected");

            for (let i = 0; i < selectedCards.length; i++) {

                selectedCards[i].classList.remove(this.selectedClass);

            }

        }

        updateSelectionCounters(event) {

            if (event.currentTarget.classList.contains(this.selectedClass)) {

                if (event.currentTarget.parentElement.classList.contains("video")) {

                    this.numberOfSelectedVideos += 1;

                } else {

                    this.numberOfSelectedChannels += 1;

                }

            } else {

                if (event.currentTarget.parentElement.classList.contains("video")) {

                    this.numberOfSelectedVideos -= 1;

                } else {

                    this.numberOfSelectedChannels -= 1;

                }

            }

        }

        trackStatusButtonClickListener(event) {

            if (event.target.classList.contains("selected") != true) {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();
                event.target.classList.add("selected");
                trackMenu.create("card", event.target.parentElement.parentElement.parentElement.getAttribute("contentId"));
                event.target.parentElement.prepend(trackMenu.trackMenuCopy);
                this.clickOutside();

            } else {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();

            }

        }

        deselectAllTrackStatusButtons() {

            let trackStatusButtonsSelected = document.querySelectorAll("main#content ul#cards li#card div#wrapper button#trackStatusButton.selected");

            for (let i = 0; i < trackStatusButtonsSelected.length; i++) {

                trackStatusButtonsSelected[i].classList.remove("selected");

            }

        }

        clickOutside() {

            // https://stackoverflow.com/questions/33859113/javascript-removeeventlistener-not-working-inside-a-class
            // https://stackoverflow.com/questions/36695438/detect-click-outside-div-using-javascript

            this.windowClickListenerCopy = this.windowClickListener.bind(this);
            window.addEventListener("touchend", this.windowClickListenerCopy);
            window.addEventListener("click", this.windowClickListenerCopy);

        }

        windowClickListener(event) {

            if (event.target.id != this.trackStatusButtons[0].id) {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();

            }

        }

        removeWindowListener() {

            window.removeEventListener("touchend", this.windowClickListenerCopy);
            window.removeEventListener("click", this.windowClickListenerCopy);

        }

        setGridView() {

            this.cards.classList.remove("listView");

        }

        setListView() {

            this.cards.classList.add("listView");

        }

        removeTrackMenu() {

            if (document.querySelector("button#trackStatusButton.selected")) document.querySelector("button#trackStatusButton.selected").parentElement.querySelector("div#trackMenu").remove();

        }

    }

    // Return Top

    class ReturnTop {

        constructor() {

            this.returnTop = document.querySelector("button#returnTop");
            this.initialize();

        }

        initialize() {

            this.returnTop.addEventListener("click", this.returnTopClickListener.bind(this));

        }

        returnTopClickListener() {

            window.scrollTo(0, 0);

        }

        addCSSClass(cssClass) {

            this.returnTop.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.returnTop.classList.remove(cssClass);

        }

    }

    // Bottom message

    class BottomMessage {

        constructor() {

            this.noSelectionMessage = "Select Videos/Channels to track.";
            this.message = document.querySelector("section#bottom div#message");
            this.details = document.querySelector("section#bottom div#message div#wrapper p#details");
            this.trackButton = document.querySelector("section#bottom div#message div#wrapper div#buttonWrapper button#track");
            this.closeButton = document.querySelector("section#bottom div#message button#close");
            this.selectedClass = "selected";
            this.selectingClass = "selecting";
            this.selectionStatus = false;
            this.initialize();

        }

        initialize() {

            this.setMessage(this.noSelectionMessage);

        }

        update() {

            if ((cards.numberOfSelectedVideos + cards.numberOfSelectedChannels) > 0) {

                if (!this.selectionStatus) {
                    
                    this.startCancelSelection(true);

                }
                
                this.setMessage(this.buildMessage());

            } else {

                this.startCancelSelection(false);

            }

        }

        buildMessage() {

            let multiVideos = "";
            let multiChannels = "";
            let videosLabel = "";
            let channelsLabel = "";
            let separator = "";
            if (cards.numberOfSelectedVideos > 1) multiVideos = "s";
            if (cards.numberOfSelectedChannels > 1) multiChannels = "s";
            if ((cards.numberOfSelectedVideos >= 1) && (cards.numberOfSelectedChannels)) separator = " · ";
            if (cards.numberOfSelectedVideos > 0) videosLabel = cards.numberOfSelectedVideos + " Video" + multiVideos;
            if (cards.numberOfSelectedChannels > 0) channelsLabel = cards.numberOfSelectedChannels + " Channel" + multiChannels;
            return videosLabel + separator + channelsLabel + " selected";

        }

        startCancelSelection(selection) {

            if (selection) {

                this.addCSSClass(this.selectingClass);
                this.trackButtonClickListenerCopy = this.trackButtonClickListener.bind(this);
                this.closeButtonClickListenerCopy = this.closeButtonClickListener.bind(this);
                this.trackButton.addEventListener("click", this.trackButtonClickListenerCopy);
                this.closeButton.addEventListener("click", this.closeButtonClickListenerCopy);
                this.selectionStatus = true;

            } else {

                this.trackButton.removeEventListener("click", this.trackButtonClickListenerCopy);
                this.closeButton.removeEventListener("click", this.closeButtonClickListenerCopy);
                this.removeCSSClass(this.selectingClass);
                this.setMessage(this.noSelectionMessage);
                this.selectionStatus = false;

            }

        }

        trackButtonClickListener(event) {

            if (event.target.classList.contains(this.selectedClass) != true) {

                this.selectDeselectTrackButton(true);
                trackMenu.create("footer");
                event.target.parentElement.prepend(trackMenu.trackMenuCopy);
                overlay.addCSSClass(overlay.displayedClass);
                document.querySelector('body').classList.add('noScroll');
                this.clickOutside();

            } else {

                this.removeTrackMenu();
                this.selectDeselectTrackButton(false);
                overlay.removeCSSClass(overlay.displayedClass);
                document.querySelector('body').classList.remove('noScroll');

            }

        }

        selectDeselectTrackButton(selection) {

            if (selection) {

                this.trackButton.classList.add(this.selectedClass);

            } else {

                this.trackButton.classList.remove(this.selectedClass);

            }

        }

        clickOutside() {

            this.windowClickListenerCopy = this.windowClickListener.bind(this);
            window.addEventListener("touchend", this.windowClickListenerCopy);
            window.addEventListener("click", this.windowClickListenerCopy);

        }

        windowClickListener() {
            
            if (event.target != this.trackButton) {

                this.selectDeselectTrackButton(false);
                this.removeTrackMenu();
                this.removeWindowListener();
                overlay.removeCSSClass(overlay.displayedClass);
                document.querySelector('body').classList.remove('noScroll');

            }

        }

        removeWindowListener() {

            window.removeEventListener("touchend", this.windowClickListenerCopy);
            window.removeEventListener("click", this.windowClickListenerCopy);

        }

        removeTrackMenu() {

            if (this.trackButton.parentElement.querySelector("div#trackMenu")) this.trackButton.parentElement.querySelector("div#trackMenu").remove();

        }

        closeButtonClickListener(event) {

            this.selectDeselectTrackButton(false);
            this.removeTrackMenu();
            document.querySelector('body').classList.remove('noScroll');
            overlay.removeCSSClass(overlay.displayedClass);
            this.startCancelSelection(false);
            cards.deselectAll();

        }

        setMessage(message) {

            this.details.textContent = message;

        }

        addCSSClass(cssClass) {

            this.message.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.message.classList.remove(cssClass);

        }

    }

    // Overlay
    
    class Overlay {

        constructor() {

            this.overlay = document.querySelector("div#overlay");
            this.displayedClass = "displayed";
            this.initialize();

        }

        initialize() {

            

        }

        addCSSClass(cssClass) {

            this.overlay.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.overlay.classList.remove(cssClass);

        }

    }

    // Modals

    class Modals {

        constructor() {

            this.modals = document.querySelector("section#modals");
            this.displayedClass = "displayed";
            this.initialize();

        }

        initialize() {

            this.modals.addEventListener("click", this.close.bind(this));

        }

        close(event) {

            if (event.target == event.currentTarget) {

                if (videoModal.modal.classList.contains(this.displayedClass)) videoModal.closeClickListener();
                if (channelModal.modal.classList.contains(this.displayedClass)) channelModal.closeClickListener();

            }

        }

        show() {

            this.addCSSClass(this.displayedClass);

        }

        hide() {

            this.removeCSSClass(this.displayedClass);

        }

        addCSSClass(cssClass) {

            this.modals.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.modals.classList.remove(cssClass);

        }

    }

    class VideoModal {

        constructor() {

            this.modal = document.querySelector("section#modals div#video");
            this.close = document.querySelector("section#modals div#window button#close");
            this.playerWindow = document.querySelector("section#modals div#video.modal div#player");
            this.toolsWindow = document.querySelector("section#modals div#video.modal div#tools");
            this.video = document.querySelector("section#modals div#video.modal div#player div#wrapper div#videoLink");
            this.trackersWindow = document.querySelector("section#modals div#video.modal div#tools div#trackers ul#trackers");
            this.trackers = document.querySelectorAll("section#modals div#video.modal div#tools div#trackers ul#trackers li");
            this.search = document.querySelector("section#modals div#video.modal div#tools div#trackers input#search");
            this.createTrackerForm = document.querySelector("section#modals div#video.modal div#tools div#trackers form#createTrackerForm");
            this.trackerName = document.querySelector("section#modals div#video.modal div#tools div#trackers form#createTrackerForm input#trackerName");
            this.trackerDesc = document.querySelector("section#modals div#video.modal div#tools div#trackers form#createTrackerForm textArea#trackerDescription");
            this.addTrackerButton = document.querySelector("section#modals div#video.modal div#tools div#trackers form#createTrackerForm button#addTracker");
            this.createTrackerButton = document.querySelector("section#modals div#video.modal div#tools div#trackers form#createTrackerForm button#createTracker");
            this.cancelButton = document.querySelector("section#modals div#video.modal div#tools div#trackers form#createTrackerForm button#cancel");
            this.relatedVideosContainer = document.querySelector("section#modals div#video.modal div#tools div#relatedVideos ul#cards");
            this.thumbnails = this.relatedVideosContainer.querySelectorAll("li#card div#thumbnail");
            this.favorButtons = this.relatedVideosContainer.querySelectorAll("li#card div#thumbnail button#favor");
            this.trackStatusButtons = this.relatedVideosContainer.querySelectorAll("li#card div#wrapper button#trackStatusButton");
            this.loadingIcon = document.querySelector("section#modals div#video.modal div#tools div#relatedVideos div#loading");
            this.detailsContainer = document.querySelector("section#modals div#video div#tools div#details");
            this.trackMenuDummy = document.querySelector("div#trackMenu.dummy");
            this.displayedClass = "displayed";
            this.selectedClass = "selected";
            this.player = null;
            this.maxRelatedVideos = 10;
            this.contentId = null;
            this.initialize();

        }

        initialize(player) {
            this.player = player;
        }

        queryVideoModal(contentId) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: "/getVideoModal?contentId=" + contentId,
                    type: 'GET',
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

        queryRelatedVideos(contentId, maxResults) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: "/getRelatedVideos?contentId=" + contentId + "&maxResults=" + maxResults,
                    type: 'GET',
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

        show(contentId) {

            document.querySelector('body').classList.add('noScroll');
            this.loadingIcon.style.display = "block";
            this.contentId = contentId;
            this.addCSSClass(this.displayedClass);
            this.registerEvents();
            this.setupCreateTracker();

            //Populate data
            this.player.cueVideoById(this.contentId);
            this.queryVideoModal(this.contentId).then (data => {
                //Video Data
                if (data.videoData.snippet.title == null){
                    this.detailsContainer.querySelector("div#titleWrapper p#title").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#titleWrapper p#title").innerHTML = data.videoData.snippet.title;
                }
                if (data.videoData.totalTracking == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#tracks p ").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#tracks p ").innerHTML = data.videoData.totalTracking;
                }
                if (data.videoData.globalTracking == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#globalTracks p ").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#globalTracks p ").innerHTML = data.videoData.globalTracking;
                }
                if (data.videoData.viewCount == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#views p ").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#views p ").innerHTML = data.videoData.viewCount;
                }
                if (data.videoData.likeCount == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#likes p ").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#likes p ").innerHTML = data.videoData.likeCount;
                }
                if (data.videoData.dislikeCount == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#dislikes p ").innerHTML ="";
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#dislikes p ").innerHTML = data.videoData.dislikeCount;
                }
                if (data.videoData.commentCount == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#comments p ").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#comments p ").innerHTML = data.videoData.commentCount;
                }
                if (data.videoData.snippet.description == null){
                    this.detailsContainer.querySelector("div#description p").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#description p").innerHTML = data.videoData.snippet.description;
                }

                // Channel Data
                if (data.channelData.snippet.thumbnails.default.url == null){
                    this.detailsContainer.querySelector("div#channel div#profile img#photo ").src ="";
                }
                else{
                    this.detailsContainer.querySelector("div#channel div#profile img#photo ").src =  data.channelData.snippet.thumbnails.default.url;
                }
                if(data.channelData.snippet.title == null){
                    this.detailsContainer.querySelector("div#channel div#nameWrapper p#name ").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#channel div#nameWrapper p#name ").innerHTML = data.channelData.snippet.title;
                }
                if(data.channelData.snippet.publishedAt == null){
                    this.detailsContainer.querySelector("div#channel div#nameWrapper p#published ").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#channel div#nameWrapper p#published ").innerHTML = new Date(data.channelData.snippet.publishedAt).toDateString();
                }
                // Trackers Data
                let trackerContainer = document.querySelector("section#modals div#video div#tools div#trackers ul#trackers ");
                for (var tracker in data.trackerList){
                    let element = document.createElement("li");
                    element.appendChild(document.createElement("span"));
                    element.querySelector("span").innerHTML= data.trackerList[tracker].tracker_name;
                    element.appendChild(document.createElement("button"));
                    element.querySelector("button").setAttribute("id", "checkMark");
                    if (data.trackerList[tracker].contentIsInTracker){
                        element.querySelector("button").setAttribute("class", "selected")}
                    element.setAttribute("trackerId", data.trackerList[tracker].tracker_id);
                    trackerContainer.appendChild(element);
                    element.addEventListener("click", this.trackersClickListener.bind(this));
                }
                // this.playerWindow.addEventListener("scroll", this.playerWindowScrollListener);
                //Related Videos Data
                this.queryRelatedVideos(this.contentId, this.maxRelatedVideos).then (data => {
                    if (data.related_videos.length == 0){
                        document.querySelector("section#modals div#video.modal div#tools div#relatedVideos p#label").innerHTML = "No Related Videos";
                        this.loadingIcon.style.display = "none";
                    }
                    else{
                    let doc = new DOMParser().parseFromString(data.related_videos, 'text/html');
                    doc.body.childNodes.forEach(child => this.relatedVideosContainer.append(child));
                    //Formatting Duration
                    let durations = this.relatedVideosContainer.querySelectorAll("li div#thumbnail div#duration")
                    for (let i = 0; i < durations.length; i++) {
                        if(durations[i].innerHTML == "undefined"){
                            durations[i].innerHTML = "";
                        }
                        else{
                            durations[i].innerHTML = formatTime(durations[i].innerHTML);
                        }
                    }
                    this.thumbnails = document.querySelectorAll("section#modals div#video.modal div#tools div#relatedVideos ul#cards li#card div#thumbnail");
                    this.trackStatusButtons = document.querySelectorAll("section#modals div#video.modal div#tools div#relatedVideos ul#cards li#card div#wrapper button#trackStatusButton");
                    for (let i = 0; i < this.thumbnails.length; i++) {
                        this.thumbnails[i].addEventListener("click", this.thumbnailClickListener.bind(this));
                        this.trackStatusButtons[i].addEventListener("click", this.trackStatusButtonClickListener.bind(this));
                    }
                    this.loadingIcon.style.display = "none";}
                })
                .catch(error => {
                    console.log(error);
                    this.loadingIcon.style.display = "none";
                });
            })
            .catch(error => {
                console.log("API error. Full error below.");
                console.log(error);
            });

        }

        playerWindowScrollListener(event) {


            // if (event.target.scrollTop < 20) {

            //     videoModal.scrollDown.classList.remove("scroll");

            // } else {

            //     videoModal.scrollDown.classList.add("scroll");

            // }

        }

        registerEvents() {

            this.closeClickListenerCopy = this.closeClickListener.bind(this);
            this.close.addEventListener("touchend", this.closeClickListenerCopy);
            this.close.addEventListener("click", this.closeClickListenerCopy);

        }

        setupCreateTracker() {

            this.addTrackerClickListenerCopy = this.addTrackerClickListener.bind(this);
            this.addTrackerButton.addEventListener("click", this.addTrackerClickListenerCopy);
            this.createTrackerButton.addEventListener("click", this.createTrackerClickHandler.bind(this));
            this.cancelButton.addEventListener("click", this.addTrackerClickListenerCopy);

        }

        addTrackerClickListener(event) {

            event.preventDefault();
            this.createTrackerForm.classList.toggle("creating");

        }

        createTrackerClickHandler(event) {
            event.preventDefault();
            trackMenu.createTrackerAction.apply(this);
        }

        trackersClickListener(event) {

            let button = event.target.parentElement.querySelector("button#checkMark");
            let adding = !button.classList.contains('selected');
            let trackerId = button.parentElement.getAttribute("trackerId");
            let contentIds = [];

            contentIds.push(this.contentId);
            button.classList.toggle("selected");
            trackersClickHandler(trackerId, contentIds, adding).then(data => {
                cards.updateTrackingButtons();
            })
            .catch(error => {
                console.log(error);
                button.classList.toggle("selected");
            })

        }

        onPlayerReady(event) {
            // event.target.stopVideo();
        }

        videoChangeStateListener(event) {

            switch (event.data) {

                case 1 : {

                    break;

                }

                case 2 : {

                    break;

                }

            }

        }

        closeClickListener() {

            this.reset();
            this.hide();
            modals.hide();
            document.querySelector('body').classList.remove('noScroll');

        }

        reset() {

            this.close.removeEventListener("touchend", this.closeClickListenerCopy);
            this.close.removeEventListener("click", this.closeClickListenerCopy);
            this.player.stopVideo();

            this.search.value = "";
            this.trackerName.value = "";
            this.trackerDesc.value = "";
            this.createTrackerForm.classList.remove("creating");
            this.addTrackerButton.removeEventListener("click", this.addTrackerClickListenerCopy);
            this.createTrackerButton.removeEventListener("click", this.addTrackerClickListenerCopy);
            this.cancelButton.removeEventListener("click", this.addTrackerClickListenerCopy);
            this.playerWindow.scrollTop = 0;
            this.toolsWindow.scrollTop = 0;
            this.trackersWindow.scrollTop = 0;

            while(this.trackersWindow.firstChild) {
                this.trackersWindow.removeChild(this.trackersWindow.firstChild);
            }

            while(this.relatedVideosContainer.firstChild) {
                this.relatedVideosContainer.removeChild(this.relatedVideosContainer.firstChild);
            }

            this.playerWindow.removeEventListener("scroll", this.playerWindowScrollListener);

        }

        thumbnailClickListener(event) {

            if (event.target.id == "favor") {

                this.favorClick(event);

            } else if (event.target.id == "checkMark") {

                this.checkMarkClick(event);

            } else {

                this.thumbnailClick(event);

            }

        }

        favorClick(event) {

            event.target.classList.toggle(this.selectedClass);

            // THOMAS

        }

        thumbnailClick(event) {
            // let contentId = event.target.parentElement.parentElement.getAttribute('contentId');
            // this.queryYoutube(contentId).then(data => {
            //     modals.show();
            //     videoModal.show(contentId);
            //     })
            //     .catch(error => {
            //         console.log(error);
            //     });
        }



        trackStatusButtonClickListener(event) {

            if (event.target.classList.contains("selected") != true) {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();
                event.target.classList.add("selected");
                trackMenu.create("card");
                event.target.parentElement.prepend(trackMenu.trackMenuCopy);
                this.clickOutside();

            } else {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();

            }

        }

        deselectAllTrackStatusButtons() {

            let trackStatusButtonsSelected = document.querySelectorAll("section#modals div#video.modal div#tools div#relatedVideos ul#cards li#card div#wrapper button#trackStatusButton.selected");

            for (let i = 0; i < trackStatusButtonsSelected.length; i++) {

                trackStatusButtonsSelected[i].classList.remove("selected");

            }

        }

        clickOutside() {

            // https://stackoverflow.com/questions/33859113/javascript-removeeventlistener-not-working-inside-a-class
            // https://stackoverflow.com/questions/36695438/detect-click-outside-div-using-javascript

            this.windowClickListenerCopy = this.windowClickListener.bind(this);
            window.addEventListener("touchend", this.windowClickListenerCopy);
            window.addEventListener("click", this.windowClickListenerCopy);

        }

        windowClickListener(event) {

            if (event.target.id != this.trackStatusButtons[0].id) {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();

            }

        }

        removeWindowListener() {

            window.removeEventListener("touchend", this.windowClickListenerCopy);
            window.removeEventListener("click", this.windowClickListenerCopy);

        }

        removeTrackMenu() {

            if (document.querySelector("section#modals div#video.modal div#tools div#relatedVideos ul#cards li#card div#wrapper button#trackStatusButton.selected")) document.querySelector("section#modals div#video.modal div#tools div#relatedVideos ul#cards li#card div#wrapper button#trackStatusButton.selected").parentElement.querySelector("div#trackMenu").remove();

        }

        hide() {

            this.removeCSSClass(this.displayedClass);

        }

        addCSSClass(cssClass) {

            this.modal.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.modal.classList.remove(cssClass);

        }

    }

    class ChannelModal {

        constructor() {

            this.modal = document.querySelector("section#modals div#channel.modal");
            this.close = document.querySelector("section#modals div#window button#close");
            this.master = document.querySelector("div#master");
            this.side = this.modal.querySelector("div#side");
            this.trackersWindow = this.modal.querySelector("div#side div#trackers ul#trackers");
            this.trackers = this.modal.querySelectorAll("div#side div#trackers ul#trackers li");
            this.search = this.modal.querySelector("div#side div#trackers input#search");
            this.createTrackerForm = this.modal.querySelector("div#side div#trackers form#createTrackerForm");
            this.trackerName = this.modal.querySelector("div#side div#trackers form#createTrackerForm input#trackerName");
            this.trackerDesc = this.modal.querySelector("div#side div#trackers form#createTrackerForm textArea#trackerDescription");
            this.addTrackerButton = this.modal.querySelector("div#side div#trackers form#createTrackerForm button#addTracker");
            this.createTrackerButton = this.modal.querySelector("div#side div#trackers form#createTrackerForm button#createTracker");
            this.cancelButton = this.modal.querySelector("div#side div#trackers form#createTrackerForm button#cancel");
            this.channelVideosContainer = document.querySelector("section#modals div#channel.modal div#master div#content div#videos ul#cards");
            this.videoThumbnails = this.channelVideosContainer.querySelectorAll("li#card div#thumbnail");
            this.videoFavorButtons = this.channelVideosContainer.querySelectorAll("li#card div#thumbnail button#favor");
            // this.videoTracks = this.channelVideosContainer.querySelectorAll("li#card div#wrapper button#trackStatusButton");
            this.featuredChannelsContainer = document.querySelector("section#modals div#channel.modal div#side div#relatedChannels ul#cards");
            this.thumbnails = this.featuredChannelsContainer.querySelectorAll("li#card div#thumbnail");
            this.favorButtons = this.featuredChannelsContainer.querySelectorAll("li#card div#thumbnail button#favor");
            // this.trackStatusButtons = this.featuredChannelsContainer.querySelectorAll("li#card div#wrapper button#trackStatusButton");
            this.loadingIcon = document.querySelector("section#modals div#channel.modal div#master div#content div#videos div#loading");
            this.featuredLoadingIcon = document.querySelector("section#modals div#channel.modal div#side div#relatedChannels div#loading");
            this.titleFavorButton = this.modal.querySelector("div#master div#content div#details div#channel div#topWrapper button#favor");
            this.scrollDown = this.modal.querySelector("button#scrollDown");
            this.detailsContainer = this.master.querySelector("div#content div#details");
            this.videosContainer = this.master.querySelector("div#content div#videos");
            this.trackMenuDummy = document.querySelector("div#trackMenu.dummy");
            this.displayedClass = "displayed";
            this.selectedClass = "selected";
            this.contentId = null;
            this.initialize();

        }

        initialize() {

            this.titleFavorButton.addEventListener("click", this.titleFavorButtonClickListener.bind(this));

        }



        queryChannelModal(contentId) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: "/getChannelModal?contentId=" + contentId,
                    type: 'GET',
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

        queryChannelVideos(contentId) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: "/getChannelVideos?contentId=" + contentId,
                    type: 'GET',
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

        queryFeaturedChannels(contentId) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: "/getFeaturedChannels?contentId=" + contentId,
                    type: 'GET',
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

        show(contentId) {

            document.querySelector('body').classList.add('noScroll');
            this.loadingIcon.style.display = "block";
            this.featuredLoadingIcon.style.display = "block";
            document.querySelector("section#modals div#channel.modal div#master div#content div#videos p#label").innerHTML = "Featured Videos";
            document.querySelector("section#modals div#channel.modal div#side div#relatedChannels p#label").innerHTML = "Featured Channels";
            this.contentId = contentId;
            this.addCSSClass(this.displayedClass);
            this.registerEvents();
            this.setupCreateTracker();

            this.queryChannelModal(this.contentId).then (data => {
                //Channel Data
                this.detailsContainer.querySelector("div#nameWrapper p#name").innerHTML = data.channelData.snippet.title;
                this.detailsContainer.querySelector("div#nameWrapper p#published").innerHTML = new Date(data.channelData.snippet.publishedAt).toDateString();
                // this.master.querySelector("div#banner img").src = data.channelData.brandingSettings.image.bannerImageUrl;
                // this.detailsContainer.querySelector("div#channel div#statistics div#tracks p ").innerHTML = data.channelData.totalTracking;
                // this.detailsContainer.querySelector("div#channel div#statistics div#globalTracks p ").innerHTML = data.channelData.globalTracking;
                this.detailsContainer.querySelector("div#channel div#statistics div#views p ").innerHTML = data.channelData.statistics.viewCount;
                this.detailsContainer.querySelector("div#channel div#statistics div#videos p ").innerHTML = data.channelData.statistics.videoCount;
                this.detailsContainer.querySelector("div#channel div#statistics div#subscribers p ").innerHTML = data.channelData.statistics.subscriberCount;
                this.detailsContainer.querySelector("div#channel div#statistics div#location p ").innerHTML = data.channelData.snippet.country;
                this.detailsContainer.querySelector("div#channel div#profile img#photo ").src = data.channelData.snippet.thumbnails.default.url;
                this.detailsContainer.querySelector("div#description p").innerHTML = data.channelData.snippet.description;

                if (this.detailsContainer.querySelector("div#channel div#statistics div#location p ").innerHTML == 'undefined')
                {
                    this.detailsContainer.querySelector("div#channel div#statistics div#location").remove();
                }

                // Trackers Data
                let trackerContainer = this.trackersWindow;
                for (var tracker in data.trackerList) {
                    let element = document.createElement("li");
                    element.appendChild(document.createElement("span"));
                    element.querySelector("span").innerHTML = data.trackerList[tracker].tracker_name;
                    element.appendChild(document.createElement("button"));
                    element.querySelector("button").setAttribute("id", "checkMark");
                    if (data.trackerList[tracker].contentIsInTracker) {
                        element.querySelector("button").setAttribute("class", "selected")
                    }
                    element.setAttribute("trackerId", data.trackerList[tracker].tracker_id);
                    trackerContainer.appendChild(element);
                    element.addEventListener("click", this.trackersClickListener.bind(this));
                }

                this.master.addEventListener("scroll", this.masterScrollListener);

                // Channel Videos Data
                this.queryChannelVideos(this.contentId).then(data => {
                    if (data.channelVideos === "null" && data.responseCode === "200"){
                        document.querySelector("section#modals div#channel.modal div#master div#content div#videos p#label").innerHTML = "No Featured Videos";
                        this.loadingIcon.style.display = "none"
                    }

                    else if (data.channelVideos === "null" && data.responseCode === "403"){
                        document.querySelector("section#modals div#channel.modal div#master div#content div#videos p#label").innerHTML = "Unable to fetch Videos. Please try again later";
                        this.loadingIcon.style.display = "none"
                    }

                    else if (data.channelVideos === "null" && data.responseCode === "500"){
                        document.querySelector("section#modals div#channel.modal div#master div#content div#videos p#label").innerHTML = "Unable to fetch Videos. Please try again later";
                        this.loadingIcon.style.display = "none"
                    }

                    else{
                    let doc = new DOMParser().parseFromString(data.channelVideos, 'text/html');
                    doc.body.childNodes.forEach(child => this.channelVideosContainer.append(child));


                    //Formatting Duration, Counter and Dates
                    let durations = this.channelVideosContainer.querySelectorAll("li div#thumbnail div#duration");
                    let counters = this.channelVideosContainer.querySelectorAll("li p#counter");
                    let publicationDates = this.channelVideosContainer.querySelectorAll("div#details div#wrapper h4#date");

                    for (let i = 0; i < counters.length; i++) {
                        counters[i].innerHTML = formatNumber(counters[i].innerHTML);
                    }

                    for (let i = 0; i < durations.length; i++) {
                        durations[i].innerHTML = formatTime(durations[i].innerHTML);
                    }

                    for (let i = 0; i < publicationDates.length; i++) {
                        publicationDates[i].innerHTML = new Date(publicationDates[i].innerHTML).toDateString();
                    }

                    this.videoThumbnails = document.querySelectorAll("section#modals div#channel.modal div#master div#content div#video ul#cards li#card div#thumbnail");
                    this.videoTracks = document.querySelectorAll("section#modals div#channel.modal div#master div#content div#video ul#cards li#card div#detailsWrapper div#wrapper button#trackStatusButton");
                    for (let i = 0; i < this.videoThumbnails.length; i++) {
                        this.videoThumbnails[i].addEventListener("click", this.videoClickListener.bind(this));
                        this.videoTracks[i].addEventListener("click", this.trackStatusButtonClickListener.bind(this));
                    }
                    this.loadingIcon.style.display = "none";}
                })
                    .catch(error => {
                        console.log(error);
                        document.querySelector("section#modals div#channel.modal div#master div#content div#videos p#label").innerHTML = "Unable to fetch Videos. Please try again later";
                        this.loadingIcon.style.display = "none";
                    });

                // Featured Channels Data
                this.queryFeaturedChannels(this.contentId).then(data => {
                    if (data.featuredChannels === "null"){
                        document.querySelector("section#modals div#channel.modal div#side div#relatedChannels p#label").innerHTML = "No Featured Channels";
                        this.featuredLoadingIcon.style.display = "none"
                    }
                    else{
                    let doc = new DOMParser().parseFromString(data.featuredChannels, 'text/html');
                    doc.body.childNodes.forEach(child => this.featuredChannelsContainer.append(child));

                    // Formatting Counters and Date
                    let counters = this.featuredChannelsContainer.querySelectorAll("li p#counter");
                    let publicationDates = this.featuredChannelsContainer.querySelectorAll("div#details h4#created span#date");

                    for (let i = 0; i < counters.length; i++) {
                        counters[i].innerHTML = formatNumber(counters[i].innerHTML);
                    }

                    for (let i = 0; i < publicationDates.length; i++) {
                        publicationDates[i].innerHTML = new Date(publicationDates[i].innerHTML).toDateString();
                    }

                    this.thumbnails = document.querySelectorAll("section#modals div#video.modal div#side div#relatedVideos ul#cards li#card div#thumbnail");
                    this.trackStatusButtons = document.querySelectorAll("section#modals div#video.modal div#side div#relatedVideos ul#cards li#card div#wrapper button#trackStatusButton");
                    for (let i = 0; i < this.thumbnails.length; i++) {
                        this.thumbnails[i].addEventListener("click", this.videoClickListener.bind(this));
                        this.trackStatusButtons[i].addEventListener("click", this.trackStatusButtonClickListener.bind(this));
                    }
                    this.featuredLoadingIcon.style.display = "none";}
                })
                    .catch(error => {
                        console.log(error);
                        this.featuredLoadingIcon.style.display = "none";
                    });

            })
            .catch(error => {
                console.log("API error. Full error below.");
                console.log(error);
            });

        }

        titleFavorButtonClickListener(event) {

            this.titleFavorButton.classList.toggle(this.selectedClass);

        }

        masterScrollListener(event) {


            if (event.target.scrollTop < 20) {

                channelModal.scrollDown.classList.remove("scroll");

            } else {

                channelModal.scrollDown.classList.add("scroll");

            }

        }

        registerEvents() {

            this.closeClickListenerCopy = this.closeClickListener.bind(this);
            this.close.addEventListener("touchend", this.closeClickListenerCopy);
            this.close.addEventListener("click", this.closeClickListenerCopy);


        }

        setupCreateTracker() {

            this.addTrackerClickListenerCopy = this.addTrackerClickListener.bind(this);
            this.addTrackerButton.addEventListener("click", this.addTrackerClickListenerCopy);
            this.createTrackerButton.addEventListener("click", this.createTrackerClickHandler.bind(this));
            this.cancelButton.addEventListener("click", this.addTrackerClickListenerCopy);

        }

        addTrackerClickListener(event) {

            event.preventDefault();
            this.createTrackerForm.classList.toggle("creating");

        }

        createTrackerClickHandler(event) {
            event.preventDefault();
            trackMenu.createTrackerAction.apply(this);
        }

        trackersClickListener(event) {

            let button = event.target.parentElement.querySelector("button#checkMark");
            let adding = !button.classList.contains('selected');
            let trackerId = button.parentElement.getAttribute("trackerId");
            let contentIds = [];

            contentIds.push(this.contentId);
            button.classList.toggle("selected");
            trackersClickHandler(trackerId, contentIds, adding).then(data => {
                cards.updateTrackingButtons();
            })
            .catch(error => {
                console.log(error);
                button.classList.toggle("selected");
            })

        }

        closeClickListener() {

            this.reset();
            this.hide();
            modals.hide();
            document.querySelector('body').classList.remove('noScroll');

        }

        reset() {

            this.close.removeEventListener("touchend", this.closeClickListenerCopy);
            this.close.removeEventListener("click", this.closeClickListenerCopy);

            this.search.value = "";
            this.trackerName.value = "";
            this.trackerDesc.value = "";
            this.createTrackerForm.classList.remove("creating");
            this.addTrackerButton.removeEventListener("click", this.addTrackerClickListenerCopy);
            this.createTrackerButton.removeEventListener("click", this.addTrackerClickListenerCopy);
            this.cancelButton.removeEventListener("click", this.addTrackerClickListenerCopy);
            this.master.scrollTop = 0;
            this.side.scrollTop = 0;
            this.trackersWindow.scrollTop = 0;

            while(this.trackersWindow.firstChild) {
                this.trackersWindow.removeChild(this.trackersWindow.firstChild);
            }

            while(this.channelVideosContainer.firstChild) {
                this.channelVideosContainer.removeChild(this.channelVideosContainer.firstChild);
            }

            while(this.featuredChannelsContainer.firstChild) {
                this.featuredChannelsContainer.removeChild(this.featuredChannelsContainer.firstChild);
            }


            this.master.removeEventListener("scroll", this.masterScrollListener);

        }

        thumbnailClickListener(event) {

            if (event.target.id == "favor") {

                this.favorClick(event);

            } else if (event.target.id == "checkMark") {

                this.checkMarkClick(event);

            } else {

                this.thumbnailClick(event);

            }

        }

        videoClickListener(event){
            if (event.target.id == "favor") {

                this.favorClick(event);

            }
            else if(event.target.id =="checkMark"){
                this.checkMarkClick(event);
            }
            else {

                this.videoThumbnailClick(event);

            }
        }

        favorClick(event) {

            event.target.classList.toggle(this.selectedClass);

            // THOMAS

        }

        thumbnailClick(event) {
            let contentId = event.target.parentElement.parentElement.getAttribute('contentId');
            this.queryYoutube(contentId).then(data => {
                modals.show();
                ChannelModal.show(contentId);
                })
                .catch(error => {
                    console.log(error);
                });
        }

        videoThumbnailClick(event) {

        }

        trackStatusButtonClickListener(event) {

            if (event.target.classList.contains("selected") != true) {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();
                event.target.classList.add("selected");
                trackMenu.create("card");
                event.target.parentElement.prepend(trackMenu.trackMenuCopy);
                this.clickOutside();

            } else {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();

            }

        }

        deselectAllTrackStatusButtons() {

            let trackStatusButtonsSelected = document.querySelectorAll("section#modals div#channel.modal div#side div#relatedChannels ul#cards li#card div#wrapper button#trackStatusButton.selected");
            let videoTracksSelected = document.querySelectorAll("section#modals div#channel.modal div#master div#content div#video ul#cards li#card div#wrapper button#trackStatusButton.selected");

            for (let i = 0; i < trackStatusButtonsSelected.length; i++) {

                trackStatusButtonsSelected[i].classList.remove("selected");

            }

            for (let i = 0; i < videoTracksSelected.length; i++) {

                videoTracksSelected[i].classList.remove("selected");

            }

        }

        clickOutside() {

            // https://stackoverflow.com/questions/33859113/javascript-removeeventlistener-not-working-inside-a-class
            // https://stackoverflow.com/questions/36695438/detect-click-outside-div-using-javascript

            this.windowClickListenerCopy = this.windowClickListener.bind(this);
            window.addEventListener("touchend", this.windowClickListenerCopy);
            window.addEventListener("click", this.windowClickListenerCopy);

        }

        windowClickListener(event) {

            if (event.target.id != this.videoTracks[0].id || event.target.id != this.trackStatusButtons[0].id) {

                this.removeTrackMenu();
                this.deselectAllTrackStatusButtons();
                this.removeWindowListener();

            }

        }

        removeWindowListener() {

            window.removeEventListener("touchend", this.windowClickListenerCopy);
            window.removeEventListener("click", this.windowClickListenerCopy);

        }

        removeTrackMenu() {

            if (document.querySelector("section#modals div#channel.modal div#side div#relatedChannels ul#cards li#card div#wrapper button#trackStatusButton.selected")){
                document.querySelector("section#modals div#channel.modal div#side div#relatedChannels ul#cards li#card div#wrapper button#trackStatusButton.selected").parentElement.querySelector("div#trackMenu").remove();
            }

            if (document.querySelector("section#modals div#channel.modal div#master div#content div#video ul#cards li#card div#wrapper button#trackStatusButton.selected")){
                document.querySelector("section#modals div#channel.modal div#master div#content div#video ul#cards li#card div#wrapper button#trackStatusButton.selected").parentElement.querySelector("div#trackMenu").remove();
            }

        }

        hide() {

            this.removeCSSClass(this.displayedClass);

        }

        addCSSClass(cssClass) {

            this.modal.classList.add(cssClass);

        }

        removeCSSClass(cssClass) {

            this.modal.classList.remove(cssClass);

        }

    }

    class ContentManager {

        constructor(cards) {
            this.cards = cards;
            this.container = cards.cards;
            this.paging = false;
            this.nextPageToken = "";
        }

        initialize() {
       
            window.addEventListener('scroll', this.scrollEventListener.bind(this));

            this.updateContent();
        }

        resetCards() {
            this.cards.resetCards();
            this.nextPageToken = "";
        }

        scrollEventListener() {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight
                && this.paging == false && this.nextPageToken != null) {
                this.updateContent();
            }
        }

        buildURL() {
            let url = "/getContentCards?q=" + search.searchBox.value.split(' ').join('+')
                + "&order=" + filters.orderType
                + "&pba=" + filters.pba
                + "&queryCount=" + itemQueryCount; //Max = 60
            if (this.nextPageToken.length > 0) {
                url += "&nextPageToken=" + this.nextPageToken;
            }
            return url;
        }

        queryYoutube() {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: this.buildURL(),
                    type: 'GET',
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

        formatCards(cards) {

            let counters = cards.querySelectorAll("li p#counter");
            let durations = cards.querySelectorAll("div#thumbnail div#duration");

            for (let i = 0; i < counters.length; i++) {
                counters[i].innerHTML = formatNumber(counters[i].innerHTML);
            }

            for (let i = 0; i < durations.length; i++) {
                durations[i].innerHTML = formatTime(durations[i].innerHTML);
            }
        }

        updateContent() {
            this.paging = true;
            this.queryYoutube().then(data => {
                totalItemsLoaded += itemQueryCount;
                let doc = new DOMParser().parseFromString(data.render, 'text/html');
                this.formatCards(doc.body);
                doc.body.childNodes.forEach(child => this.container.append(child));
                this.cards.update();

                if (data.noKey) {
                    $("#content").html('<a>Please supply an api key to search youtube.<br><br></a>');
                }
                this.nextPageToken = (data.nextPageToken == 'null' ? generateNextPageToken() : data.nextPageToken);
                this.paging = false;
                counters.updateCounter(data.totalResults);
            })
            .catch(error => {
                console.log("API Error. Make sure you are logged in or did not exceed your daily quota.");
                console.log(error);
                this.paging = false;
            });
        }
    }



    // Initialization

    let totalItemsLoaded = 0;
    let itemQueryCount = 20;

    let modals = new Modals();
    let videoModal = new VideoModal();
    let channelModal = new ChannelModal();
    let header = new Header();
    let moreMenu = new MoreMenu();
    let cards = new Cards();
    let trackMenu = new TrackMenu(cards); // Defined in trackerFunctions.js
    let views = new Views();
    let counters = new Counters();
    let options = new Options();
    let returnTop = new ReturnTop();
    let separator = new Separator();
    let general = new General();
    let bottomMessage = new BottomMessage();
    let overlay = new Overlay();
    let contentManager = new ContentManager(cards);
    let search = new Search(contentManager);
    let filters = new Filters(contentManager);
    
    contentManager.initialize();

    document.getElementById("homeLink").classList.toggle("selected");
   
    // YouTubePlayer
    var tag = document.createElement('script');
    tag.id = 'iframe-demo';
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;
    window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player(videoModal.video.getAttribute("id"), {
            events: {
                'onStateChange': videoModal.videoChangeStateListener,
                'onReady': videoModal.onPlayerReady
            },
            playerVars : {
                'autoplay' : 0,
                'modestbranding' : 1,
            },
        });
        videoModal.initialize(player);
    }

    $(document).on('click', 'section#modals div#channel.modal div#master div#content div#video ul#cards li#card div#detailsWrapper div#wrapper button#trackStatusButton', function(event){
    channelModal.trackStatusButtonClickListener(event)
} )

    $(document).on('click', 'section#modals div#channel.modal div#master div#content div#videos ul#cards li#card div#thumbnail button#favor', function(event){
    channelModal.favorClick(event)
} )
    $(window).keydown(function (event){
    if (event.key ==="Escape"){
        videoModal.closeClickListener()
        channelModal.closeClickListener()
    }

})


})

//* AJAX *//

function createTracker(trackerName, trackerDesc) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: 'tracker/addTracker',
            headers: getCsrfTokenHeader(),
            data: {
                trackerName: trackerName,
                trackerDesc: trackerDesc,
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

//* UTILITIES *//

window.getCookieByName = function (name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
};

function getCsrfTokenHeader() {
    return {"X-CSRFToken": getCookieByName("csrftoken")};
}

function formatNumber(n) {
    return numeral(n).format('0a').toUpperCase();
}

function formatTime(t) {
    t = t.trim();
    let out = "";
    for (var i =0; i <= t.length; i++){
        if(t[i] != "0" && t[i] != ":"){ //First H/M/S
            if(t[i+1] != ':'){//Check for HH or MM
                if(i >= 3 && t[6] >= 3){//Rounding
                    if(parseInt(t[i+1])+1 == 10){//9 Rounding to 10
                        t = (parseInt(t[i],10)+1).toString() + "0";}
                    else{t = t[i] + (parseInt(t[i+1],10)+1).toString();}
                }
                else{t = t.slice(i, i+2);}
            }
            else{//Only H or M
                if(i >= 3 && t[6] >= 3){//Rounding
                    t = (parseInt(t[i],10)+1).toString();}
                else{t = t[i];}
            }
            if(i < 2){//hour
                out = t + " Hour";}
            else if (i < 5){//min
                out = t + " Min";}
            else if (i < 5){//sec
                out =  "< 1 Min";}
            else if (i >= 6){//Live
                out =  "Live";
            }
            break;
        }
    }
    return out;
}

// This generator will attempt to produce YouTube tokens for searches.
// This is because the YouTube API sometimes fails to provide a token for loading subsequential results.
// Source:
// https://stackoverflow.com/questions/30263293/youtube-subscriptions-list-api-v3-nextpagetoken-isnt-available/
function* generateNextPageToken() {
    var d0 = "AEIMQUYcgkosw048";
    var d1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var d2 = d1;
    var d1c = 0;
    var d2c = 0;
    var overflowSuffix = "Q";
    var direction = "AA";
    var d2OverflowCounter = 0;
    var pageSize = 50;

    for (i = 0; i < 1024; i++) {
        if (i % pageSize == 0) {
            yield "C" + d1.charAt((d1c / d0.length) % d1.length) + d0.charAt(i % d0.length) + overflowSuffix + direction, ":", i;
        }
        if (++d1c % (1 << 8) == 0) {
            d1c = 1 << 7;
        }
        if (++d2c % (1 << 7) == 0) {
            overflowSuffix = d2.charAt(++d2OverflowCounter) + "E";
        }
    }
}
