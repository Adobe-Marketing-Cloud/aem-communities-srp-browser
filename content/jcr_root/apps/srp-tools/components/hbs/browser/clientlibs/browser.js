(function (SCF) {
    "use strict";
    var Browser = SCF.Model.extend({
        modelName: "BrowserModel",
        defaults: {
            navData: [],
            path: "/",
            json: {},
            jsonString: ""
        },
        loadUGC: function () {
            var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + this.get("path");
            var that = this;
            $.get(url, function (response) {
                that.set("json", response);
                that.trigger('ugc:fetched', {
                    'model': that
                });                
            });
        },
        loadFirst: function () {
            var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + "/content/";
            var that = this;
            $.ajax({
                type: 'GET',
                url: url,
                async: false, 
                success: function (response) {
                    that.set("json", response);
                }
                });
        },
        loadTreeData: function(path) {
            var that = this;
            var json = {};
            var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + path;
            $.ajax({
                type: 'GET',
                url: url,
                async: false, 
                success: function (response) {
                    json = response;
                }
                });
            var tree = [];
            if (json.path){
                if (json.children){
                    var i = 0;
                    for (i = 0; i < json.children.length; i++){
                        var newNode = {text: "", nodes: []};
                        var path = json.children[i].path;
                        var final = path.substr(path.lastIndexOf('/') + 1); 
                        newNode.text = final;
                        newNode.nodes = that.loadTreeData(path);
                        tree[i] = newNode;      
                    }
                }
            }
            return tree;
        }
    });
    var BrowserView = SCF.View.extend({
        viewName: "Browser",
        tagName: "div",
        className: "scf-browser",
        init: function () {
            //this.listenTo(this.model, "ugc:fetched", this.render);
            this.buildNav();
        },  
        fetch: function (e) {
            e.preventDefault();
            this.model.set("path", this.getField("path"));
            this.model.loadUGC();
            const formatter = new JSONFormatter(this.model.get("json"));
            var tree = document.getElementById("json");
                if (!tree.hasChildNodes()){
                    tree.appendChild(formatter.render());
                }
                else{
                    tree.replaceChild(formatter.render(), document.getElementById("srprd"));
                }
            return false;
        },
        buildNav: function () {
            //e.preventDefault();
            var that = this;
            this.model.set("path", this.getField("path"));
            this.model.loadFirst();
            var data = [];
            var bigNode = this.model.loadTreeData("/content");
            data = bigNode;
            this.model.set("navData", data);
            $('#tree').treeview({
                data: this.model.get("navData"),
                levels: 0,
                onNodeSelected: function(event, node) {
                    var path = "/content/" + that.breadcrumbs(node);
                    $('#bcrumbs').attr("value", path);
                    console.log(path);
                }
//                onNodeExpanded: function(event, node) {
//                    if (!node.nodes.length) {
//                        var path = "/content/" + that.breadcrumbs(node);
//                        var newTree = that.model.loadTreeData(path);
//                        node.nodes = newTree;
//                        this.model.set("navData")
//                    }
//                }
            });
            return false;
        },
        breadcrumbs: function(node) {
            var that = this;
            //console.log(parent.text);
            if (!(node.length)) {
                var parent = $('#tree').treeview('getParent', node);
                return node.text + "/" + that.breadcrumbs(parent);
            }
            else{
                return "";
            }
        }
    });
    SCF.Browser = Browser;
    SCF.BrowserView = BrowserView;
    SCF.registerComponent('srp-tools/components/hbs/browser', SCF.Browser, SCF.BrowserView);
})(SCF);
