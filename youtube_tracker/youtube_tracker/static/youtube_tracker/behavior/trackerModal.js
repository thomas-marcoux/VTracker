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

        getVideoBarcode(videoId, barcodeWidth, barcodeHeight, asList) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: '/tracker/getSingleVideoBarcode',
                    type: 'POST',
                    headers: getCsrfTokenHeader(),
                    data: {
                        videoId: videoId,
                        barcodeWidth: barcodeWidth,
                        barcodeHeight: barcodeHeight,
                        asList: asList
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



        show(contentId) {

            document.querySelector('body').classList.add('noScroll');
            this.loadingIcon.style.display = "block";
            this.contentId = contentId;
            this.addCSSClass(this.displayedClass);
            this.registerEvents();
            this.setupCreateTracker();

            //Populate data
            this.player.cueVideoById(this.contentId);

            // Video Barcode
            this.barcodeContainer = document.querySelector("section#modals div#video.modal div#movieBarCodeWrapper div#movieBarCode");
            this.barcodeWidth = Math.floor(this.barcodeContainer.offsetWidth / 16);
            this.barcodeHeight = this.barcodeContainer.offsetHeight;
            this.barcodeAsList = true;
            let rgbToHex = function(rgb){
                let hex = Number(rgb).toString(16)
                if (hex.length < 2){
                    hex = "0" + hex
                }
                return hex
            }

            let fullHexValue = function(r,g,b){
                let red = rgbToHex(r)
                let green = rgbToHex(g)
                let blue = rgbToHex(b)
                return "#"+red+green+blue
            }

            this.getVideoBarcode(this.contentId, this.barcodeWidth, this.barcodeHeight, this.barcodeAsList).then(data => {
                // let doc = new DOMParser().parseFromString(data.render, 'text/html');
                // let barcodeImage = doc.getElementById("movieBarCode").children;
                let barcodeJSON = data.barcode
                let barcodeList = barcodeJSON.movie_barcode[0]
                let videoDuration = data.duration
                barcodeList.forEach((item, index)=>{
                    let timestamp = String(Math.floor(index/(parseInt(this.barcodeWidth)/videoDuration)))
                    let barcodeElement = document.createElement("div")
                    barcodeElement.classList.add("barcode-frame")
                    barcodeElement.setAttribute('data-ts', timestamp)
                    barcodeElement.style.height = this.barcodeHeight+"px"
                    barcodeElement.style.backgroundColor = fullHexValue(item[0], item[1], item[2])
                    this.barcodeContainer.append(barcodeElement)
                })
                // this.barcodeContainer.append(barcodeImage[0]);
                }).catch(error => {
                    console.log(error);
                });

            this.queryVideoModal(this.contentId).then (data => {
                //Video Data
                if (data.videoData.snippet.title == null){
                    this.detailsContainer.querySelector("div#titleWrapper p#title").innerHTML = "";
                }
                else{
                    this.detailsContainer.querySelector("div#titleWrapper p#title").innerHTML = data.videoData.snippet.title;
                }
                if (data.videoData.totalTracking == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#tracks").remove();
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#tracks p ").innerHTML = numeral(String(data.videoData.totalTracking)).format('0,0');
                }
                if (data.videoData.globalTracking == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#globalTracks").remove();
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#globalTracks p ").innerHTML = numeral(String(data.videoData.globalTracking)).format('0,0');
                }
                if (data.videoData.viewCount == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#views").remove();
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#views p ").innerHTML = numeral(String(data.videoData.viewCount)).format('0,0');
                }
                if (data.videoData.likeCount == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#likes").remove();
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#likes p ").innerHTML = numeral(String(data.videoData.likeCount)).format('0,0');
                }
                if (data.videoData.dislikeCount == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#dislikes").remove();
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#dislikes p ").innerHTML = numeral(String(data.videoData.dislikeCount)).format('0,0');
                }
                if (data.videoData.commentCount == null){
                    this.detailsContainer.querySelector("div#head div#statistics div#comments").remove();
                }
                else{
                    this.detailsContainer.querySelector("div#head div#statistics div#comments p ").innerHTML = numeral(String(data.videoData.commentCount)).format('0,0');
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

                    this.trackStatusButtons = document.querySelectorAll("section#modals div#video.modal div#tools div#relatedVideos ul#cards li#card div#wrapper button#trackStatusButton");
                    for (let i = 0; i < this.trackStatusButtons.length; i++) {
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

            while(this.barcodeContainer.firstChild) {
                this.barcodeContainer.removeChild(this.barcodeContainer.firstChild);
            }

            this.playerWindow.removeEventListener("scroll", this.playerWindowScrollListener);

        }


        favorClick(event) {

            event.target.classList.toggle(this.selectedClass);

            // THOMAS

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


$(document).keydown(function (event){
    if (event.key ==="Escape"){
        videoModal.closeClickListener()
    }


})

// Initialization
let modals = new Modals();
let videoModal = new VideoModal();

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

    $(document).on('click', 'div.barcode-frame', function(event){
        let ts = parseInt(event.target.getAttribute('data-ts'))
        player.seekTo(ts)
            })


$(document).on('click', 'li.video div#wrapper h2#title a', function(event){
        let contentId = event.target.parentElement.parentElement.parentElement.getAttribute('id');
            if (contentId != 'undefined'){
                modals.show();
                videoModal.show(contentId);
            }
})

$(document).on('click', 'li#card div#thumbnail button#favor', function(event){
    videoModal.favorClick(event)
} )



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
