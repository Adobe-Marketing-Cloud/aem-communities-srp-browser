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
        loadTreeData: function(path, size, type) {
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
        buildContentNav: function (treeSelector) {
            var that = this;
            var size = 5;
            //this.model.set("path", this.getField("path"));
            var data = [];
            var bigNode = this.model.loadTreeData("/content", size, "content");
            data = bigNode;
            //this.model.set("navData", data);
            treeSelector.treeview({
                data: data,
                levels: 0,
                showCheckbox: true,
                showIcon: false,
                onNodeSelected: function(event, node) {
                    var path = node.path;
                    $('#bcrumbs').attr("value", path);
                },
                onNodeExpanded: function(event, node) {
                    var offset = 0;
                    var url = SCF.config.urlRoot + that.model.get('id') + ".srp.json?path=" + node.path + "&offset=" + offset + "&size="+size;
                    var json = that.model.getJSON(node, url);
                    if (json.contentChildren != 0){
                        that.updateTree(treeSelector, node, json, size);
                    }
                    if (json.children.length!=0){
                        that.buildUGCNav($('#tree2'), json, size);
                    }
                }
            });
            return false;
        },
        buildUGCNav: function (treeSelector, json, size) {
            var that = this;
            treeSelector.treeview({
                data: this.model.loadTreeData(json.path, size, "ugc"),
                levels: 0,
                showCheckbox: true,
                showIcon: false,
                onNodeSelected: function(event, node) {
                    var path = node.path;
                    $('#bcrumbs').attr("value", path);
                }
//                onNodeExpanded: function(event, node) {
//                    var offset = 0;
//                    var url = SCF.config.urlRoot + that.model.get('id') + ".srp.json?path=" + node.path + "&offset=" + offset + "&size="+size;
//                    var json = that.model.getJSON(node, url);
//                    if (json.contentChildren){
//                        that.updateTree(treeSelector, node, json, size);
//                    }
//                    if (json.children){
//                        that.buildUGCNav($('#tree2'), json, size);
//                    }
//                }
            });
        },
        updateTree: function(selector,node, json, size, offset){
            var that = this;
            if (json.contentChildren && node.text != "See more") {
                var i = 0;
                for (i = 0; i < json.contentChildren.length; i++) {
                    var path = json.contentChildren[i].path;
                    var newNode = {text: "", nodes: [], count: 0, path: path, type: "content"};
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
                    var pid = node.nodeId;
                    selector.treeview('addNode', [newNode, pid]);
                }
                if (json.contentChildren.length==size){
                        var newCount = node.count + 1;
                        var newNode = {text:"See more", nodes:[], count: newCount, path: ""};
                        
                        selector.treeview('addNode', [newNode, pid]);
                    } 
            }
        },
        appendChildren: function(selector, parent, selected, json, size, offset){
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
                    var newNode = {text: "", nodes: [], count: 0, color: "#4E0FE3", type: "UGC"};
                    var path = json.children[i].path;
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
                    var pid = parent.nodeId;
                    selector.treeview('addNode', [newNode, pid]);
                }
                if (json.children.length==size){
                        var newCount = parent.count + 1;
                        var newNode = {text:"See more", nodes:[], count: newCount, color: "#4E0FE3"};
                        selector.treeview('addNode', [newNode, pid]);
                    } 
            }
        },
        breadcrumbs: function(selector, node) {
            var that = this;
            if (!(node.length) && node.text != "See more") {
                var parent = selector.treeview('getParent', node);
                return that.breadcrumbs(selector, parent) + "/" + node.text;
            }
            else if (!(node.length) && node.text == "See more"){
                var parent = selector.treeview('getParent', node);
                return that.breadcrumbs(selector, parent);
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
