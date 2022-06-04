class NodeCluster {

    constructor(chartID) {

        this.chartID = chartID;
        this.body = document.querySelector(`#${this.chartID}`);
        this.filtersContainer = document.querySelector("section#filters ul");
        this.filters = this.filtersContainer.querySelectorAll("li");
        this.moreInfoModal = document.querySelector("section#moreInfoModal");
        this.moreInfoModalShadow = document.querySelector("section#moreInfoModal div#shadow");
        this.moreInfoModalContent = document.querySelector("section#moreInfoModal div#messageContent");
        this.moreInfoCloseButton = document.querySelector("section#moreInfoModal div#messageBox button#closeButton");
        this.bottomMessage = document.querySelector("section#notifications");

        this.displayedClass = "displayed";
        this.activeClass = "active";
        this.freezeDocumentScrollingClass = "freeze";

        this.color = ["#e377c2", "#8c564b", "#9467bd", "#d62728", "#2ca02c", "#ff7f0e", "#1f77b4", "#7f7f7f"];

        this.initialize();

    }

    initialize() {

        this.moreInfoCloseButton.addEventListener("click", this.moreInfoCloseButtonClickListener.bind(this));
        this.moreInfoModalShadow.addEventListener("click", this.moreInfoModalShadowClickListener.bind(this));
        document.addEventListener("keydown", this.escapeKeyListener.bind(this));

    }

    clearChart() {
        d3.select(`div#${this.chartID}`).selectAll("svg").remove();
    }

    clear() {
        this.clearChart();
        while (this.filtersContainer.firstChild) {
            this.filtersContainer.removeChild(this.filtersContainer.firstChild);
        }
        this.moreInfoCloseButtonClickListener();
    }

    filtersClickListener(event) {
        if (event.currentTarget.classList.contains(this.activeClass)) {
            event.currentTarget.style.backgroundColor = "transparent";
        }
        else {
            let index = Array.prototype.indexOf.call(event.currentTarget.parentNode.children, event.currentTarget)
            event.currentTarget.style.backgroundColor = this.color[index];
        }
        event.currentTarget.classList.toggle(this.activeClass);
        this.filterData();
    }

    fetchVideoData(videoId) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: '/getVideo?videoId='+videoId,
                dataType: 'json',
                success: function (data) {
                    resolve(data);
                },
                error: function (error) {
                    reject(error)
                }
            })
        });
    }

    circleClickListener(event) {
        let clusterIndex = event.cluster
        this.freezeDocumentScrolling();
        this.moreInfoModal.classList.add(this.displayedClass);
        this.resetScrolling(this.moreInfoModalContent);
        this.moreInfoModalContent.querySelector("div.detailsWrapper p#emotion span#videoEmotion").innerHTML = this.getLabel(this.clustersKeys[clusterIndex]);
        this.moreInfoModalContent.querySelector("div.detailsWrapper p#emotion span#videoEmotion").style.backgroundColor = this.color[clusterIndex];
        this.moreInfoModalContent.querySelector("div.detailsWrapper ul#details li#Source p#value").innerHTML = '';
        this.moreInfoModalContent.querySelector("div.detailsWrapper ul#details li#published").innerHTML = '';
        this.moreInfoModalContent.querySelector("img#videoImage").removeAttribute('src');
        this.fetchVideoData(event.text).then(data => {
            this.moreInfoModalContent.querySelector("div.detailsWrapper p#title span#videoTitle").innerHTML = data.video_title;
            this.moreInfoModalContent.querySelector("div.detailsWrapper ul#details li#published").innerHTML = moment.utc(data.published_date).format('lll');
            this.moreInfoModalContent.querySelector("div.detailsWrapper ul#details li#Source").style.display = "block";
            this.moreInfoModalContent.querySelector("div.detailsWrapper ul#details li#Source p#value").innerHTML = data.category;
            this.moreInfoModalContent.querySelector("img#videoImage").setAttribute('src', data.thumbnails_medium_url);
            this.moreInfoModalContent.querySelector("img#videoImage").style.display = "block";
        })
        .catch(error => {
            this.moreInfoModalContent.querySelector("div.detailsWrapper p#title span#videoTitle").innerHTML = error.responseJSON.message;
            this.moreInfoModalContent.querySelector("div.detailsWrapper ul#details li#Source").style.display = "none";
            this.moreInfoModalContent.querySelector("img#videoImage").style.display = "none";
        });

    }

    moreInfoCloseButtonClickListener() {

        this.moreInfoModal.classList.remove(this.displayedClass);
        this.unfreezeDocumentScrolling();

    }

    moreInfoModalShadowClickListener() {

        this.moreInfoModal.classList.remove(this.displayedClass);
        this.unfreezeDocumentScrolling();

    }

    freezeDocumentScrolling() {

        this.body.classList.add(this.freezeDocumentScrollingClass);

    }

    unfreezeDocumentScrolling() {

        this.body.classList.remove(this.freezeDocumentScrollingClass);

    }

    resetScrolling(object) {

        object.scrollTop = 0;

    }

    escapeKeyListener() {

        if (window.event.keyCode == 27) {
            this.moreInfoCloseButtonClickListener();
        }
    }

    getLabel(str) {
        str = String(str);
        return str.substring(str.lastIndexOf('_') + 1, str.length).toLowerCase();
    }

    updateFilters(clustersKeys) {
        this.clustersKeys = clustersKeys;
        let filterButtonsString = "";
        let formattedKeys = clustersKeys.map(this.getLabel);
        for (let i = 0; i < formattedKeys.length; i++) {
            let value = formattedKeys[i];
            let label = value.charAt(0).toUpperCase() + value.slice(1);
            filterButtonsString += `<li id='${clustersKeys[i]}' class='active'>${label}</li> `;
        }
        let doc = new DOMParser().parseFromString(filterButtonsString, 'text/html');
        doc.body.childNodes.forEach(child => this.filtersContainer.append(child));
        this.filterButtons = this.filtersContainer.querySelectorAll('li');
        for (let i = 0; i < this.filterButtons.length; i++) {
            let element = this.filterButtons[i];
            element.addEventListener("click", this.filtersClickListener.bind(this));
            element.style.backgroundColor = this.color[i];
        }
    }

    buildClusterChart(d3inputData, clustersKeys){
        this.clustersKeys = clustersKeys;
        this.updateFilters(clustersKeys);
        this.data = d3inputData;
        let cs = Array.from(this.clustersKeys);
        let data = this.data;
        let color = this.color;
        var n = data.length, // total number of nodes
            m = cs.length; // number of distinct clusters

        var height = 490,
        padding = 3, // separation between same-color nodes
        clusterPadding = 5, // separation between different-color nodes
        maxRadius = 2;
        var d3Container = d3.select(`#${this.chartID}`),
                        margin = {top: 5, right: 50, bottom: 20, left: 70},
                        width = d3Container.node().getBoundingClientRect().width - margin.left - margin.right,
                        height = height - margin.top - margin.bottom - 5;

        var container = d3Container.append("svg");

        var svg = container
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        
        var generalObject = this;
        //create clusters and nodes
        var clusters = new Array(m);
        var nodes = [];
        for (var i = 0; i<n; i++){
            nodes.push(create_nodes(data,i));
        }

        var force = d3.layout.force()
            .nodes(nodes)
            .size([width, height])
            .gravity(.02)
            .charge(0)
            .on("tick", tick)
            .start();

        var node = svg.selectAll("circle")
            .data(nodes)
            .enter().append('circle')
            .call(force.drag)
            .style('fill', function (d) {
                return color[d.cluster]; 
            })
            .attr("r", function(d){
                return d.radius
            })
            .on("mouseover", function(d) {
                d3.select(this).style("cursor", "pointer");
            })
            .on("mouseout", function(d) {
                d3.select(this).style("cursor", "default");
            })
            .on("click", generalObject.circleClickListener.bind(generalObject));
            
        function create_nodes(data,node_counter) {
            var i = cs.indexOf(data[node_counter][1]), // Node category/label
                r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
                d = {
                    cluster: i,
                    radius: data[node_counter][2]*5, // Node weight/score
                    text: data[node_counter][0], // Node ID
                    x: Math.cos(i / m * 2 * Math.PI) * 200 + width / 2 + Math.random(),
                    y: Math.sin(i / m * 2 * Math.PI) * 200 + height / 2 + Math.random()
                };
            if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
            return d;
        };
        
        function tick(e) {
            node
                .each(cluster(10 * e.alpha * e.alpha))
                .each(collide(.5))
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        }

        // Move d to be adjacent to the cluster node.
        function cluster(alpha) {
            return function(d) {
                var cluster = clusters[d.cluster];
                if (cluster === d) return;
                var x = d.x - cluster.x,
                    y = d.y - cluster.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + cluster.radius;
                if (l != r) {
                l = (l - r) / l * alpha;
                d.x -= x *= l;
                d.y -= y *= l;
                cluster.x += x;
                cluster.y += y;
                }
            };
        }

        // Resolves collisions between d and all other circles.
        function collide(alpha) {
            var quadtree = d3.geom.quadtree(nodes);
            return function(d) {
                var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;
                quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                    if (l < r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }

        
    }

    filterData() {
        let filters = document.querySelectorAll("section#filters ul li");
        let nodes = d3.selectAll("circle");
        let activeClusterIDs = [];
        filters.forEach(function (filter, i) {
            if (filter.classList.contains(this.activeClass)) {
                activeClusterIDs.push(i);
            }
        }, this);
        nodes.style("visibility", function(d) {
            return (activeClusterIDs.includes(d.cluster) ? "visible" : "hidden");
        });
    }
}