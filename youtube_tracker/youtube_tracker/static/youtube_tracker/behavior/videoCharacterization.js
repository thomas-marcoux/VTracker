

/*



	" Reimplement the wheel to either learn, or make it better. "

    http://www.haydex.com/
    https://www.youtube.com/watch?v=QOlTGA3RE8I
    
    Product Name: VTracker
	Description: Tracking Video data.
	Beneficiary: COSMOS
	
	Copyright © 1988 - 2021 HAYDEX, All Rights Reserved.
	
	
	
*/

const contextData = JSON.parse(JSONContextData);


document.addEventListener("DOMContentLoaded", function() {

    // General

    class General {

        constructor() {

            this.body = document.querySelector("body");
            this.sideBar = document.querySelector("div#sideBar");
            this.datasetButtons = document.querySelectorAll('div#data ul#dataList li');
            this.dimensionList = document.querySelector('div#dimensions ul#dimensionsList');
            this.dimensionButtons = document.querySelectorAll('div#dimensions ul#dimensionsList li');
            this.visualizationButtons = document.querySelectorAll('div#visualization ul#visualizationList li');
            this.chartContainers = document.querySelectorAll("div.chartBlock");

            this.hiddenClass = "hidden";
            this.selectedClass = "selected";
            this.enabledClass = "enabled";

            this.full_df = null;
            this.active_df = null;
            this.displayed_df = null;
            this.activeDimensions = new Set();
            this.activeDatasets = new Set();
            this.index_field = 'video_id';
            this.set_field = 'data_set';
            this.title_field = 'video_title';

            this.visualizations = {
                'treemapVisualization': new TreeMap('treemapVisualization'),
                'twoDClusterVisualization': new TwoDimensionalCluster('twoDClusterVisualization'),
            };

        }

        initialize() {

            this.chartContainers.forEach(element =>{
                element.style.display = 'block';
            })


            this.sideBar.addEventListener("click", this.sideBarClickListener.bind(this));

            // Get default datasets
            this.datasetButtons.forEach(element => {
                if (element.classList.contains('selected')) {
                    this.activeDatasets.add(element.id);
                }
            });

            // Get default dimensions
            this.dimensionButtons.forEach(element => {
                if (element.classList.contains('selected')) {
                    this.activeDimensions.add(element.id);
                }
            });

            // Get default visualization
            this.visualizationButtons.forEach(element => {
                if (element.classList.contains('selected')) {
                this.chartContainers.forEach(container =>{
                container.style.display = 'none';
                })
                let chartBlock = document.querySelector("div#"+element.id);
                chartBlock.style.display = 'block';
                this.activeVisualization = this.visualizations[element.id];

                }
            });
            (this.activeVisualization.multiDimensional) ? this.switchToMultiDimensional() : this.switchToSingleDimension();

            let df = new dfd.DataFrame(contextData);
            this.full_df = df;
            this.active_df = df;
            this.displayed_df = df;
            this.update();
        }

        addDataSet(label) {
            if (!this.activeDatasets.has(label)) {
                this.active_df = this.active_df.append(this.full_df.query({ column: this.set_field, is: "==", to: label}));
                this.activeDatasets.add(label);
                this.update();
            }
        }

        hideDataSet(label) {
            if (this.activeDatasets.has(label)) {
                this.active_df = this.active_df.query({ column: this.set_field, is: "!=", to: label})
                this.activeDatasets.delete(label);
                this.update();
            }
        }

        addDimension(label) {
            if (!this.activeDimensions.has(label)) {
                this.activeDimensions.add(label);
                this.update();
            }
        }

        hideDimension(label) {
            if (this.activeDimensions.has(label)) {
                this.activeDimensions.delete(label);
                this.update();
            }
        }

        update() {
            this.updateDimensions();
            this.activeVisualization.updateData(this.displayed_df, this.activeDimensions, this.set_field, this.active_df);
            this.activeVisualization.updatePlot();
        }

        updateDimensions() {
            let activeDimensions = Array.from(this.activeDimensions);
            this.displayed_df = this.active_df.loc({columns: activeDimensions.concat([this.index_field, this.set_field, this.title_field])});
        }

        switchToSingleDimension() {
            this.dimensionList.classList.remove("multi");
            let firstSelection = null;
            this.activeDimensions.clear();
            for (let i = 0; i < this.dimensionButtons.length; i++) {
                if (firstSelection == null && this.dimensionButtons[i].classList.contains(this.selectedClass)) {
                    firstSelection = this.dimensionButtons[i];
                }
                else {
                    this.dimensionButtons[i].classList.remove(this.selectedClass);
                }
            }
            this.activeDimensions.add(firstSelection.getAttribute("id"));
        }

        switchToMultiDimensional() {
            this.dimensionList.classList.add("multi");
        }

        selectDataSet(event) {
            if (event.target.parentNode.parentNode.id == 'dataList') {
                let dataLabel = event.target.parentNode.id;
                if (!event.target.parentNode.classList.contains(this.selectedClass)) {
                    this.addDataSet(dataLabel);
                }
                else if (this.activeDatasets.size > 1) {
                    this.hideDataSet(dataLabel);
                }
                else {
                    return false;
                }
            }
            return true;
        }

        selectDimension(event) {
            let dimensionLabel = event.target.parentNode.id;
            if (!event.target.parentNode.parentNode.classList.contains("multi")) {
                this.activeDimensions.clear();
                for (let i = 0; i < this.dimensionButtons.length; i++) {
                    this.dimensionButtons[i].classList.remove(this.selectedClass);
                }
            }
            if (!event.target.parentNode.classList.contains(this.selectedClass)) {
                this.addDimension(dimensionLabel);
            }
            else if (this.activeDimensions.size > 1 && (event.target.parentNode.parentNode.classList.contains("multi"))) {
                this.hideDimension(dimensionLabel);
            }
            else {
                return false;
            }
            return true;
        }

        selectVisualization(event) {
            let listItems = event.target.parentNode.parentNode.querySelectorAll("li");
            for (let i = 0; i < listItems.length; i++) {
                listItems[i].classList.remove(this.selectedClass);
            }
            for (let visualization in this.visualizations) {
                this.visualizations[visualization].wrapper.style.display = "none";
            }
            let visualizationName = event.target.parentNode.id;
            this.activeVisualization.clearPlot();
            this.activeVisualization = this.visualizations[visualizationName];
            this.activeVisualization.wrapper.style.display = "block";
            (this.activeVisualization.multiDimensional) ? this.switchToMultiDimensional() : this.switchToSingleDimension();
            this.update();
        }

        sideBarClickListener(event) {
            let toggle = true;
            if (event.target.parentNode.parentNode.classList.contains("sideBarOptionsList") && !event.target.parentNode.classList.contains("disabled")) {
                if (event.target.parentNode.parentNode.id == 'dataList') {
                    toggle = this.selectDataSet(event);
                }
                if (event.target.parentNode.parentNode.id == 'dimensionsList') {
                    toggle = this.selectDimension(event);
                }
                if (event.target.parentNode.parentNode.id == 'visualizationList') {
                    this.selectVisualization(event);
                }
                if (toggle) {
                    event.target.parentNode.classList.toggle(this.selectedClass);
                }
            }
        }
    }

    class TreeMap {

        constructor(wrapperID) {

            this.data = [];
            this.wrapperID = wrapperID;
            this.wrapper = document.getElementById(wrapperID);
            this.multiDimensional = true;
        }

        clearPlot() {
            Plotly.purge(this.wrapperID);
        }

        updatePlot() {
            Plotly.newPlot(this.wrapperID, this.data);
        }

        updateData(displayed_df, activeDimensions, set_field, _) {
            let ids = [];
            let labels = [];
            let parents = [];
            let df = displayed_df.drop({ columns: [set_field], axis: 1});
            let non_dimension_fields = ['video_id', 'video_title'];
            let dimensions = Array.from(activeDimensions);

            function updateArrays(row, i, label) {
                let parent_path = row.slice(0, i);
                ids.push(parent_path.concat(label).join('-'))
                parents.push(parent_path.join('-'));
                labels.push(label);
            }

            function nodeRec(node, i, k) {
                // Leaf
                if (i == k) {
                    let rows = node.data;
                    let label;
                    for (let j = 0; j < rows.length; j++) {
                        label = node['video_title'].data[j];
                        updateArrays(rows[j], i, label);
                    }
                    return;
                }
                
                let column_label = dimensions[i];
                let groups = node.groupby([column_label]);
                let columnValues = node[column_label].unique().data;
                // Node
                if (i > 0) {
                    columnValues.forEach(value => {
                        let group = groups.get_groups([value]);
                        updateArrays(group.iloc({rows: [0]}).data[0], i, value);
                    });
                }
                // Root
                else {
                    columnValues.forEach(value => {
                        ids.push(value);
                        labels.push(value);
                        parents.push(undefined);
                    });
                }
                // Next
                columnValues.forEach(value => {
                    let group = groups.get_groups([value]);
                    nodeRec(group, i + 1, k);
                });
            }

            nodeRec(df, 0, df.shape[1] - non_dimension_fields.length);

            this.data = [{
                type: "treemap",
                branchvalues: "total",
                ids: ids,
                labels: labels,
                count: "leaves",
                parents: parents
            }];
        }
    }

    class TwoDimensionalCluster {


        constructor(wrapperID) {

            this.chartID = 'd3-emotion-cluster-chart';
            this.nodeCluster = new NodeCluster(this.chartID);
            this.data = [];
            this.wrapper = document.getElementById(wrapperID);
            this.clusterKeys = [];
            this.multiDimensional = false;
        }

        clearPlot() {
            this.nodeCluster.clear();
        }

        updatePlot() {
            this.clearPlot();
            this.nodeCluster.buildClusterChart(this.data, this.clusterKeys);
        }

        updateData(displayed_df, activeDimensions, _, active_df) {
            let default_weight = 0.7;
            let node_size_multiplier = 5;
            let selectedDimension = Array.from(activeDimensions)[0];
            let df = displayed_df.loc({columns: ['video_id', selectedDimension]});
            
            let weight_column = [];
            let weight_column_name = selectedDimension + "_weight";
            if (active_df.columns.includes(weight_column_name)) {
                weight_column = active_df.loc({columns: [weight_column_name]}).values;
            }
            else {
                weight_column = Array(df.shape[0]).fill(default_weight);
            }
            weight_column = weight_column.map(function(weight) { return weight * node_size_multiplier;})
            df.addColumn({ "column": "weight", "value": weight_column });
            this.data = df.values;
            this.clusterKeys = df[selectedDimension].unique().data;
        }

    }

    // Initialization

    let general = new General();
    general.initialize();
});
