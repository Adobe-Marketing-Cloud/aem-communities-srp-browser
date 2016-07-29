(function (SCF) {
    "use strict";
    var Browser = SCF.Model.extend({
        modelName: "BrowserModel",
        defaults: {
            navData: [],
            path: "/",
            json: {},
            jsonString: "",
            size: 5
        },
        loadUGC: function (size) {
            var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + this.get("path") + "&offset=0&size="+size;
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
        getJSON: function(node,url) {
            var json = [];
            $.ajax({
                type: 'GET',
                url: url,
                async: false, 
                success: function (response) {
                json = response;
                }
            });
            return json;
        },
        loadFirst: function (size) {
            var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + "/content" + "&offset=0&size=" + size;
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
        loadTreeData: function(path, size) {
            var that = this;
            var json = {};
            var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + path + "&offset=0&size=" + size;
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
                        tree[i] = newNode;      
                    }
                }
            }
            this.navData = tree;
        },
        
    });
    var BrowserView = SCF.View.extend({
        viewName: "Browser",
        tagName: "div",
        className: "scf-browser",
        size: 5,
        init: function () {
            this.buildNav();
        },  
        fetch: function (e, size) {
            var size = 5;
            e.preventDefault();
            this.model.set("path", this.getField("path"));
            this.model.loadUGC(size);
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
            var that = this;
            var size = 5;
            this.model.set("path", this.getField("path"));
            this.model.loadFirst(size);
            var data = [];
            this.model.loadTreeData("/content");
            var bigNode = this.model.navData;
            data = bigNode;
            this.model.set("navData", data);
            $('#tree').treeview({
                data: this.model.get("navData"),
                levels: 0,
                showCheckbox: true,
                showIcon: false,
                onNodeSelected: function(event, node) {
                    var path = "/content" + that.breadcrumbs(node);
                    $('#bcrumbs').attr("value", path);
                },
                onNodeExpanded: function(event, node) {
                    var offset = 0;
                    if (!node.nodes.length) {
                        var path = "/content" + that.breadcrumbs(node);
                        var url = SCF.config.urlRoot + that.model.get('id') + ".srp.json?path=" + path + "&offset=" + offset + "&size="+size;
                        var json = that.model.getJSON(node, url);
                        that.updateTree(node, json, size);
                    }
                }
            });
            return false;
        },
        updateTree: function(node, json, size, offset){
            var that = this;
            if (json.children) {
                var i = 0;
                for (i = 0; i < json.children.length; i++) {
                    var newNode = {text: "", nodes: []};
                    var path = json.children[i].path;
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
                    var pid = node.nodeId;
                    $('#tree').treeview('addNode', [newNode, pid]);
                }
                if (json.children.length==size){
                        var newNode = {text:"See more", nodes:[]};
                        $('#tree').treeview('addNode', [newNode, pid]);
                    } 
            }
        },
        breadcrumbs: function(node) {
            var that = this;
            if (!(node.length)) {
                var parent = $('#tree').treeview('getParent', node);
                return that.breadcrumbs(parent) + "/" + node.text;
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
