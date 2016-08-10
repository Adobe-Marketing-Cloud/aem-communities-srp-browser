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
        loadContentData: function(path, size, type) {
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
                if (json.children && type == "ugc"){
                    var i = 0;
                    for (i = 0; i < json.children.length; i++){
                        var path = json.children[i].path;
                        var newNode = {text: "", nodes: [], color: "#4E0FE3", path: path, type: "UGC"};
                        var final = path.substr(path.lastIndexOf('/') + 1); 
                        newNode.text = final;
                        tree[i] = newNode;      
                    }
                }
                if (json.contentChildren && type == "content") {
                var i = 0;
                for (i = 0; i < json.contentChildren.length; i++) {
                    var path = json.contentChildren[i].path;
                    var newNode = {text: "", nodes: [], path: path, type: "content"};
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
                    tree[i] = newNode;
                }
            }
            }
            this.navData = tree;
            return tree; 
        },
        loadUGCData: function(path, size, type) {
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
                if (json.children && type == "ugc"){
                    var i = 0;
                    for (i = 0; i < json.children.length; i++){
                        var path = json.children[i].path;
                        var newNode = {text: "", nodes: [], color: "#4E0FE3", path: path, type: "UGC"};
                        var final = path.substr(path.lastIndexOf('/') + 1); 
                        newNode.text = final;
                        tree[i] = newNode;      
                    }  
                }
                if (json.children.length == size) {
                    var newNode = {text: "See more", nodes: [], color: "#4E0FE3", path: path, type: "expand"};
                    tree[json.children.length] = newNode;
                }
            }
            this.navData = tree;
            return tree; 
        },
        
    });
    var BrowserView = SCF.View.extend({
        viewName: "Browser",
        tagName: "div",
        className: "scf-browser",
        size: 5,
        init: function () {
            var selector = $('#tree1');
            this.buildContentNav(selector);
        },
        constructURL: function(path, size, offset) {
            var that = this;
            if (size != null || offset != null) {
                var url = SCF.config.urlRoot + that.model.get('id') + ".srp.json?path=" + path + "&offset=" + offset + "&size="+size;
            }
            else {
                var url = SCF.config.urlRoot + that.model.get('id') + ".srp.json?path=" + path;
            }
            return url;
        }, 
        getSize: function() {
            return 5;
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
        getPathArray: function(e) {
            this.model.set("path", this.getField("path"));
            var path = this.getField("path");
            var array = path.split("/");
            for (var i = 0; i < array.length; i++){
                var nodes = $('#tree1').treeview('search', [ array[i], {
                    ignoreCase: true,     // case insensitive
                    exactMatch: true,    // like or equals
                    revealResults: false,  // reveal matching nodes
                }]);
                if (nodes.length > 0){
                    $('#tree1').treeview("expandNode", [nodes[0]]);
                    $('#tree1').treeview("clearSearch");
                }
            }
            $('#tree1').treeview("selectNode", [nodes[0]]);
            return false;
        },
        buildContentNav: function (treeSelector, size) {
            var that = this;
            var data = [];
            var bigNode = this.model.loadContentData("/content", size, "content");
            data = bigNode;
            treeSelector.treeview({
                data: data,
                levels: 0,
                showCheckbox: true,
                showIcon: false,
                onNodeSelected: function(event, node) {
                    var path = node.path;
                    $('#bcrumbs').attr("value", path);
                    that.fetch(event, that.getSize());
                },
                onNodeExpanded: function(event, node) {
                    var url = that.constructURL(node.path);
                    var json = that.model.getJSON(node, url);
                    // update the content tree
                    that.updateContentTree(treeSelector, node, json, size);
                    // show new UGC tree in the middle column
                    that.buildUGCNav($('#tree2'), json, that.getSize(), 0, node);
                }
            });
            return false;
        },
        updateContentTree: function(selector,node, json, size, offset){
            var that = this;
                var i = 0;
                for (i = 0; i < json.contentChildren.length; i++) {
                    var path = json.contentChildren[i].path;
                    var newNode = {text: "", nodes: [], count: 0, path: path, type: "content"};
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
                    var pid = node.nodeId;
                    selector.treeview('addNode', [newNode, pid]);
            }
        },
        buildUGCNav: function (treeSelector, json, size, index, contentParent) {
            var that = this;
            if (json.children.length == size) {
                contentParent.count++;
            }
            treeSelector.treeview({
                data: this.model.loadUGCData(json.path, size, "ugc"),
                levels: 0,
                showCheckbox: true,
                showIcon: false,
                contentParent: contentParent,
                size: size,
                onNodeSelected: function(event, node) {
                    var path = node.path;
                    $('#bcrumbs').attr("value", path);
                    that.fetch(event, size);
                },
                onNodeExpanded: function(event, node) {
                    var size = 5;
                    var offset = contentParent.count*size;
                    var root = treeSelector.treeview('getParent', node);
                    var url = that.constructURL(node.path, size, offset);
                    var json = that.model.getJSON(node, url); 
                    var contentParentURL = that.constructURL(contentParent.path, size, offset);
                    var contentParentJson = that.model.getJSON(contentParent, contentParentURL);
                    if (node.type != "expand"){
                        that.updateUGCTree(treeSelector, node, json, size, offset);
                    }
                    else {
                        that.appendChildren(treeSelector, contentParent, root, node, contentParentJson, size, offset)          
                    }
                }
            });
        },
        updateUGCTree: function(selector,node, json, size, offset){
            var that = this;
            if (json.children && node.nodes.length == 0) {
                var i = 0;
                for (i = 0; i < json.children.length; i++) {
                    var path = json.children[i].path;
                    var newNode = {text: "", nodes: [], count: 0, path: path, type: "content", color: "#4E0FE3"};
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
                    var pid = node.nodeId;
                    selector.treeview('addNode', [newNode, pid]);
                }
            }
        },
        appendChildren: function(selector, contentParent, root, selected, json, size, offset){
            var that = this;
            if (json.children && selected.text == "See more") {
                var i = 0;
                var pid = selected.nodeId;
                var path = json.children[i].path;
                var final = path.substr(path.lastIndexOf('/') + 1); 
                selector.treeview('updateNodeText', [pid, final]);
                selector.treeview('updateNodeColor', [pid, "#4E0FE3"]);
                $('#tree').treeview('updateNodePath', [pid, path]);
                for (i = 1; i < json.children.length; i++) {
                    var newNode = {text: "", nodes: [], count: 0, color: "#4E0FE3", type: "UGC", path:json.children[i].path };
                    var path = json.children[i].path;
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
//                    var pid = parent.nodeId;
                    selector.treeview('addRoot', [newNode]);
                }
                if (json.children.length==size){
                        contentParent.count = contentParent.count + 1;
                        var newNode = {text:"See more", nodes:[], color: "#4E0FE3", type:"expand"};
                        selector.treeview('addRoot', [newNode]);
                } 
            }
        }
    });
    SCF.Browser = Browser;
    SCF.BrowserView = BrowserView;
    SCF.registerComponent('srp-tools/components/hbs/browser', SCF.Browser, SCF.BrowserView);
})(SCF);
