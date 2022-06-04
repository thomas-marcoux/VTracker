/*



	" Reimplement the wheel to either learn, or make it better. "

    https://www.hayder.io/
    https://www.youtube.com/watch?v=QOlTGA3RE8I
    
    Product Name: Btracker
	Description: Tracking Blog's data.
	Beneficiary: COSMOS
	
	Copyright © 1988 - 2021 HAYDEX, All Rights Reserved.
	
	
	
*/



document.addEventListener("DOMContentLoaded", function() {

    // Narrative Tree

    class NarrativeTree extends BaseAnalytics { 

        constructor() {
            super();

            /* Entities Column */
            this.entitiesNoOfItems = document.querySelector("div#narrative-tree div#entities-column div.head div.counter span");
            this.entities = document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li");
            this.entitiesItemsList = document.querySelector("div#narrative-tree div#entities-column ul.items-list");
            this.choices = document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li div#choice");
            this.controls = document.querySelector("div#narrative-tree div#entities-column div#entities-controls");
            this.entitiesCancelButton = document.querySelector("div#narrative-tree div#entities-column div#entities-controls button#cancel-button");
            this.entitiesGroupButton = document.querySelector("div#narrative-tree div#entities-column div#entities-controls button#group-button");
            this.noOfChosenItemsElement = document.querySelector("div#narrative-tree div#entities-column div#entities-controls button#group-button div#group-count");
            this.numberOfSelectedEntities = 0;

            /* Narratives Column */
            this.narrativesNoOfItems = document.querySelector("div#narrative-tree div#narratives-column div.head div.counter span");
            this.narratives = document.querySelectorAll("div#narrative-tree div#narratives-column ul.items-list > li");
            this.narrativesItemsList = document.querySelector("div#narrative-tree div#narratives-column ul.items-list");
            this.narrativesEditButton = document.querySelectorAll("div#narrative-tree div#narratives-column ul.items-list > li div#narratives-controls button#narratives-edit-button");
            this.narrativesConfirmButton = document.querySelectorAll("div#narrative-tree div#narratives-column ul.items-list > li div#narratives-controls button#narratives-confirm-button");
            this.narrativesCancelButton = document.querySelectorAll("div#narrative-tree div#narratives-column ul.items-list > li div#narratives-controls button#narratives-cancel-button");
            this.narrativesColumn = document.querySelector("div#narrative-tree div#narratives-column");
            
            /* Posts Column */
            this.postsNoOfItems = document.querySelector("div#narrative-tree div#posts-column div.head div.counter span");
            this.posts = document.querySelectorAll("div#narrative-tree div#posts-column ul.items-list > li");
            this.postsItemsList = document.querySelector("div#narrative-tree div#posts-column ul.items-list");
            this.postsColumn = document.querySelector("div#narrative-tree div#posts-column");
            this.postSelected = 
            
            /* Preview Column */
            this.preview = document.querySelector("div#narrative-tree div#preview-column .items-list.post");
            this.previewColumn = document.querySelector("div#narrative-tree div#preview-column");
            this.previewImage = document.querySelector("div#narrative-tree div#preview-column .items-list.post img.post-image");

            /* Submenu */
            this.submenu = document.querySelector("ul#submenu");
            this.sortWrapper = document.querySelectorAll("div#narrative-tree div.column div.head div#sort-items div#sort-wrapper");
            this.sortType = document.querySelectorAll("div#narrative-tree div.column div.head div#sort-items p#sort-type");
            
            /* Other */
            this.editMode = false;
            this.selectedClass= "selected";
            this.displayedClass= "displayed";
            this.activeClass = "active";
            this.chosenClass = "chosen";
            this.groupClass = "group";
            this.editingClass = "editing";
            this.focusedClass = "focused";
            this.originalText = "";

            this.initialize();

        }

        initialize() {
            super.initialize();

            this.entitiesNoOfItems.innerHTML = this.entities.length;

            this.entitiesCancelButton.addEventListener("click", this.entitiesCancelButtonClickListener.bind(this));
            this.entitiesGroupButton.addEventListener("click", this.entitiesGroupButtonClickListener.bind(this));

            /* Submenu */
            for (var i = 0; i < this.sortWrapper.length; i++) {

                this.sortWrapper[i].addEventListener("click", this.sortWrapperClickListener.bind(this));

            }


            for (var i = 0; i < this.entities.length; i++) {

                this.entities[i].addEventListener("click", this.entitiesClickListener.bind(this));

            }

            for (var i = 0; i < this.narratives.length; i++) {

                this.narratives[i].addEventListener("click", this.narrativesClickListener.bind(this));

            }

            for (var i = 0; i < this.posts.length; i++) {

                this.posts[i].addEventListener("click", this.postsClickListener.bind(this));

            }

            for (var i = 0; i < this.choices.length; i++) {

                this.choices[i].addEventListener("click", this.choicesClickListener.bind(this));

            }

            for (var i = 0; i < this.narrativesEditButton.length; i++) {

                this.narrativesEditButton[i].addEventListener("click", this.narrativesEditButtonClickListener.bind(this));

            }

            for (var i = 0; i < this.narrativesCancelButton.length; i++) {

                this.narrativesCancelButton[i].addEventListener("click", this.narrativesCancelButtonClickListener.bind(this));

            }

            for (var i = 0; i < this.narrativesConfirmButton.length; i++) {

                this.narrativesConfirmButton[i].addEventListener("click", this.narrativesConfirmButtonClickListener.bind(this));

            }

        }

        sortWrapperClickListener(event) {

            var submenus = document.querySelectorAll("ul#submenu.displayed");
            var eventCurrentTarget = event.currentTarget;
                
            for (var i=0; i < submenus.length; i++) {
                submenus[i].remove();
            }
            /* Clone submenu */
            var clone = this.submenu.cloneNode(true);

            /* Insert cloned submenu into sort-wrapper div */
            event.currentTarget.appendChild(clone);

            /* Setup event listeners */
            event.currentTarget.querySelector("ul#submenu").addEventListener("click", function(event) {
                
                if (event.target.classList.contains("submenuItem")) {
                    eventCurrentTarget.querySelector("p#sort-type").innerHTML = event.target.innerHTML;
                }
                var submenus = document.querySelectorAll("ul#submenu.displayed");
                
                for (var i=0; i < submenus.length; i++) {
                    submenus[i].remove();
                }

                event.stopPropagation();
            });

            /* Show submenu */
            event.currentTarget.querySelector("ul#submenu").classList.add(this.displayedClass);

            /* Listen to window click event */
            window.addEventListener("click", function(event) {
                
                var submenus = document.querySelectorAll("ul#submenu.displayed");
                
                for (var i=0; i < submenus.length; i++) {
                    submenus[i].remove();
                }

                event.stopPropagation();
            });

            event.stopPropagation();
        }

        narrativesConfirmButtonClickListener(event) {

            event.currentTarget.parentElement.parentElement.classList.remove(this.editingClass);
            event.currentTarget.parentElement.parentElement.querySelector("p").setAttribute("contenteditable", "false");

            event.stopPropagation();

        }

        narrativesCancelButtonClickListener(event) {

            event.currentTarget.parentElement.parentElement.querySelector("p").innerHTML = this.originalText;

            event.currentTarget.parentElement.parentElement.classList.remove(this.editingClass);
            event.currentTarget.parentElement.parentElement.querySelector("p").setAttribute("contenteditable", "false");

            event.stopPropagation();

        }

        narrativesEditButtonClickListener(event) {

            this.originalText = event.currentTarget.parentElement.parentElement.querySelector("p").innerHTML;

            event.currentTarget.parentElement.parentElement.classList.add(this.editingClass);
            event.currentTarget.parentElement.parentElement.querySelector("p").setAttribute("contenteditable", "true");
            event.currentTarget.parentElement.parentElement.querySelector("p").focus();

            event.stopPropagation();

        }

        entitiesGroupButtonClickListener(event) {

            /* Get list of chosen entities */
            var entitiesChosen = document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li div#choice.chosen");

            /* Create a new group of chosen entities by cloning the first item in the entities list */
            if (entitiesChosen.length > 1) {

                var clone = document.querySelector("div#narrative-tree div#entities-column ul.items-list > li").cloneNode(true);

                clone.classList.remove(this.selectedClass);
                clone.classList.add(this.groupClass);
                clone.querySelector("div#choice").classList.remove(this.chosenClass);
                clone.querySelector("ul.subitems-list").innerHTML = "";

                for (var i = 0; i < entitiesChosen.length; i++) {

                    var subitmes = entitiesChosen[i].parentElement.querySelectorAll("ul.subitems-list > li");

                    for (var j = 0; j < subitmes.length; j++) {

                        var subitemClone = subitmes[j].cloneNode(true);
                        clone.querySelector("ul.subitems-list").appendChild(subitemClone);

                    }

                }

                /* Setup event listeners for the new group */
                clone.querySelector("button.ungroup-button").addEventListener("click", this.ungroupButtonClickListener.bind(this));
                clone.addEventListener("click", this.entitiesClickListener.bind(this));
                clone.querySelector("div#choice").addEventListener("click", this.choicesClickListener.bind(this));
                var removeButtons = clone.querySelectorAll("button.remove-button");

                for (i=0; i < removeButtons.length; i++) {

                    removeButtons[i].addEventListener("click", this.removeButtonClickListener.bind(this));

                }

                /* Insert the newly created group into the beginning of the entities list */
                this.entitiesItemsList.insertBefore(clone, this.entitiesItemsList.firstChild);


                /* Scroll to top of the entities list */
                clone.scrollIntoView ({
                    block: "start",
                    behavior: "smooth",
                });


                /* Hide controls */
                this.controls.classList.remove(this.displayedClass);

                /* Deselect chosen entities */
                for (var i = 0; i < entitiesChosen.length; i++) {

                    entitiesChosen[i].classList.remove(this.chosenClass);

                }

            }

        }

        removeButtonClickListener(event) {

            var items = event.currentTarget.parentElement.parentElement.querySelectorAll("li");
            var ungroupButton = event.currentTarget.parentElement.parentElement.parentElement.querySelector("button.ungroup-button");

            if (items.length > 1) { 

                if (items.length == 2) { 
                        
                    ungroupButton.click();
                
                } else {
                    
                    var editingStatus = document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.editing");

                    if (!((editingStatus) && ((event.currentTarget.parentElement.parentElement.parentElement.classList.contains(this.selectedClass))))) {

                        event.currentTarget.parentElement.remove();
                        
                    } else {

                        editingStatus.scrollIntoView({
                            block: "center",
                            behavior: "smooth",
                        });
        
                        editingStatus.classList.add(this.focusedClass);
        
                        setTimeout(function () {
                            document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.focused").classList.remove("focused");
                        }, 600);
                    }
                
                }

            }

            event.stopPropagation();

        }

        ungroupButtonClickListener(event) {

            var editingStatus = document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.editing");

            if (!editingStatus) {

                if (event.currentTarget.parentElement.classList.contains(this.selectedClass)) {

                    event.currentTarget.parentElement.click();

                }

                event.currentTarget.parentElement.remove();

                var noOfChosenItems = document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li div#choice.chosen");

                if (noOfChosenItems.length) {

                    this.noOfChosenItemsElement.innerHTML = noOfChosenItems.length;

                } else {

                    this.controls.classList.remove(this.displayedClass);

                }
            } else if (!event.currentTarget.parentElement.classList.contains(this.selectedClass)) {

                event.currentTarget.parentElement.remove();

                var noOfChosenItems = document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li div#choice.chosen");

                if (noOfChosenItems.length) {

                    this.noOfChosenItemsElement.innerHTML = noOfChosenItems.length;

                } else {

                    this.controls.classList.remove(this.displayedClass);

                }

            } else {

                editingStatus.scrollIntoView({
                    block: "center",
                    behavior: "smooth",
                });


                editingStatus.classList.add(this.focusedClass);

                setTimeout(function () {
                    document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.focused").classList.remove("focused");
                }, 600);

            }

            event.stopPropagation();

        }

        entitiesCancelButtonClickListener(event) {

            this.controls.classList.remove(this.displayedClass);

            var entitiesChosen = document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li div#choice.chosen");

            for (var i = 0; i < entitiesChosen.length; i++) {

                entitiesChosen[i].classList.remove(this.chosenClass);

            }

        }

        entitiesClickListener(event) {

            var editingStatus = document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.editing");

            if (!editingStatus) {

                if (event.currentTarget.classList.contains(this.selectedClass)) {
                
                    event.currentTarget.classList.remove(this.selectedClass);
                    this.narrativesColumn.classList.remove(this.activeClass);
                    this.narrativesItemsList.scrollTop = 0;
                    this.narrativesItemsList.classList.remove(this.displayedClass);
                    this.narrativesNoOfItems.innerHTML = 0;
                    var narrativeSelected = document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.selected ");
                    if (narrativeSelected) narrativeSelected.click();

                } else {

                    this.narrativesColumn.classList.add(this.activeClass);
                    document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li").forEach(element => element.classList.remove(this.selectedClass));
                    event.currentTarget.classList.add(this.selectedClass);
                    this.narrativesItemsList.classList.add(this.displayedClass);
                    this.narrativesNoOfItems.innerHTML = this.narratives.length;
                    this.narrativesItemsList.scrollTop = 0;
                    var narrativeSelected = document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.selected ");
                    if (narrativeSelected) narrativeSelected.click();

                }
            } else {

                editingStatus.scrollIntoView({
                    block: "center",
                    behavior: "smooth",
                });

                
                editingStatus.classList.add(this.focusedClass);

                setTimeout(function () {
                    document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.focused").classList.remove("focused");
                }, 600);
                
                
            }

        }

        narrativesClickListener(event) {
            
            var editingStatus = document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.editing");
            
            if (!editingStatus) { 

                if (!event.currentTarget.classList.contains(this.editingClass)) {
                    if (event.currentTarget.classList.contains(this.selectedClass)) {

                        event.currentTarget.classList.remove(this.selectedClass);
                        this.postsColumn.classList.remove(this.activeClass);
                        this.postsItemsList.scrollTop = 0;
                        this.postsItemsList.classList.remove(this.displayedClass);
                        this.postsNoOfItems.innerHTML = 0;
                        var postSelected = document.querySelector("div#narrative-tree div#posts-column ul.items-list > li.selected ");
                        if (postSelected) postSelected.click();

                    } else {

                        this.postsColumn.classList.add(this.activeClass);
                        this.narratives.forEach(element => element.classList.remove(this.selectedClass));
                        event.currentTarget.classList.add(this.selectedClass);
                        this.postsItemsList.classList.add(this.displayedClass);
                        this.postsNoOfItems.innerHTML = this.posts.length;
                        this.postsItemsList.scrollTop = 0;
                        var postSelected = document.querySelector("div#narrative-tree div#posts-column ul.items-list > li.selected ");
                        if (postSelected) postSelected.click();

                    }
                }

            } else {
                
                editingStatus.scrollIntoView({
                    block: "center",
                    behavior: "smooth",
                });

                if (!event.currentTarget.classList.contains(this.editingClass)) {

                    editingStatus.classList.add(this.focusedClass);

                    setTimeout(function () {
                        document.querySelector("div#narrative-tree div#narratives-column ul.items-list > li.focused").classList.remove("focused");
                    }, 600);

                }

            }
            

        }

        postsClickListener(event) {

            if (event.currentTarget.classList.contains(this.selectedClass)) {

                event.currentTarget.classList.remove(this.selectedClass);
                this.previewColumn.classList.remove(this.activeClass);
                this.preview.scrollTop = 0;
                this.preview.classList.remove(this.displayedClass);
                this.previewImage.src = "";
                

            } else {

                this.previewColumn.classList.add(this.activeClass);
                this.posts.forEach(element => element.classList.remove(this.selectedClass));
                event.currentTarget.classList.add(this.selectedClass);
                this.previewImage.src = "youtube_tracker/images/tempImages/" + (Math.floor(Math.random() * 42) + 1) + ".jpg";
                this.preview.classList.add(this.displayedClass);
                this.preview.scrollTop = 0;

            }

        }

        choicesClickListener(event) {

            if (!event.currentTarget.classList.contains(this.chosenClass)) {

                event.currentTarget.classList.add(this.chosenClass);
                var noOfChosenItems = document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li div#choice.chosen");
                this.noOfChosenItemsElement.innerHTML = noOfChosenItems.length;
                this.controls.classList.add(this.displayedClass);

            } else {

                event.currentTarget.classList.remove(this.chosenClass);
                var noOfChosenItems = document.querySelectorAll("div#narrative-tree div#entities-column ul.items-list > li div#choice.chosen");

                if (noOfChosenItems.length) {

                    this.noOfChosenItemsElement.innerHTML = noOfChosenItems.length;

                } else {

                    this.controls.classList.remove(this.displayedClass);

                }

            }
            
            event.stopPropagation();
            

        }

    }

    // Initialization

    let narrativeTree = new NarrativeTree();

});