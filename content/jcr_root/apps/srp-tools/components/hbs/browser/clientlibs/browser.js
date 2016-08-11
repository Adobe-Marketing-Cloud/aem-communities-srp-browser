(function (SCF) {
    "use strict";
    var Browser = SCF.Model.extend({
        modelName: "BrowserModel",
        defaults: {
            navData: [],
            size: 5
        },
        constructURL: function(path, size, offset) {
            var that = this;
            if (size != null || offset != null) {
                var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + path + "&offset=" + offset + "&size="+size;
            }
            else {
                var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + path;
            }
            return url;
        }, 
        getJSON: function(url) {
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
        }
    });
    var BrowserView = SCF.View.extend({
        viewName: "Browser",
        tagName: "div",
        className: "scf-browser",
        contentDisplayId: "tree1",
        ugcDisplayId: "tree2",
        jsonDisplayId: "json",
        pathDisplayId: "path",
        ugcNodeColor: "#4E0FE3",
        init: function () {
            var selector = $("#"+this.contentDisplayId);
            this.buildContentTree(selector);
        },
        createNode: function(name, path, type) {
            var node = {text: name, nodes: [], path: path, type: type, count: 0};
            return node;
        },
        getSize: function() {
            return 5;
        },
        fetch: function (e) {
            var that = this;
            e.preventDefault();
            var url = that.model.constructURL(this.getField("path"));
            var json = that.model.getJSON(url);
            this.renderJSON(json);
            return false;
        },
        // displays the JSON under the JSON display using json formatting clientlib 
        renderJSON: function(json){
            // no need to show the child nodes because they are displayed in the content/ugc trees
            delete json.contentChildren;
            delete json.children;
            const formatter = new JSONFormatter(json,Infinity);
            var tree = document.getElementById(this.jsonDisplayId);
                if (!tree.hasChildNodes()){
                    tree.appendChild(formatter.render());
                }
                else{
                    tree.replaceChild(formatter.render(), document.getElementById("srprd"));
                }
        },
        displayPath: function(path) {
            var pathSelector = $("#" + this.pathDisplayId);
            pathSelector.attr("value", path)
        },
        
        // Content tree Logic
        
        // content array is used to render the content tree via bootstrap-treeview clientlib
        buildContentArray: function(path, size, type) {
            var that = this;
            var url = that.model.constructURL(path, size, 0);
            var json = that.model.getJSON(url);
            var tree = [];
            var i = 0;
            for (i = 0; i < json.contentChildren.length; i++) {
                var path = json.contentChildren[i].path;
                var final = path.substr(path.lastIndexOf('/') + 1); 
                var newNode = this.createNode(final, path, "content");
                tree[i] = newNode;
            }
            this.navData = tree;
            return tree; 
        },
        buildContentTree: function (treeSelector, size) {
            var that = this;
            var data = this.buildContentArray("/content", size, "content");
            // building tree via bootstrap-treeview clientlib
            treeSelector.treeview({
                data: data,
                levels: 0,
                showCheckbox: true,
                showIcon: false,
                onNodeSelected: function(event, node) {
                    var url = that.model.constructURL(node.path);
                    var json = that.model.getJSON(url);
                    that.displayPath(node.path);
                    that.renderJSON(json);
                },
                onNodeExpanded: function(event, node) {
                    var url = that.model.constructURL(node.path);
                    var json = that.model.getJSON(url);
                    // update the content tree
                    that.updateContentTree(treeSelector, node, json, size);
                    // show new UGC tree in the middle column
                    that.buildUGCTree($('#tree2'), json, that.getSize(), 0, node);
                }
            });
            return false;
        },
        updateContentTree: function(selector,node, json, size, offset){
            var that = this;
            var i = 0;
            for (i = 0; i < json.contentChildren.length; i++) {
                var path = json.contentChildren[i].path;
                var final = path.substr(path.lastIndexOf('/') + 1); 
                var newNode = that.createNode(final, path, "content");
                var pid = node.nodeId;
                selector.treeview('addNode', [newNode, pid]);
            }
        },
        
        // UGC tree logic 
        buildUGCArray: function(path, size, type) {
            var that = this;
            var url = that.model.constructURL(path, size, 0);
            var json = that.model.getJSON(url);
            var tree = [];
            if (json.path){
                if (json.children && type == "ugc"){
                    var i = 0;
                    for (i = 0; i < json.children.length; i++){
                        var path = json.children[i].path;
                        var newNode = {text: "", nodes: [], color: that.ugcNodeColor, path: path, type: "UGC"};
                        var final = path.substr(path.lastIndexOf('/') + 1); 
                        newNode.text = final;
                        tree[i] = newNode;      
                    }  
                }
                if (json.children.length == size) {
                    var newNode = {text: "See more", nodes: [], color: that.ugcNodeColor, path: path, type: "expand"};
                    tree[json.children.length] = newNode;
                }
            }
            this.navData = tree;
            return tree; 
        },
        buildUGCTree: function (treeSelector, json, size, index, contentParent) {
            var that = this;
            if (json.children.length == size) {
                contentParent.count++;
            }
            treeSelector.treeview({
                data: this.buildUGCArray(json.path, size, "ugc"),
                levels: 0,
                showCheckbox: true,
                showIcon: false,
                contentParent: contentParent,
                size: size,
                onNodeSelected: function(event, node) {
                    var url = that.model.constructURL(node.path);
                    var json = that.model.getJSON(url);
                    that.displayPath(node.path);
                    that.renderJSON(json);
                },
                onNodeExpanded: function(event, node) {
                    var root = treeSelector.treeview('getParent', node);
                    var url = that.model.constructURL(node.path, size, offset);
                    var json = that.model.getJSON(url); 
                    if (node.type != "expand"){
                        that.updateUGCTree(treeSelector, node, json);
                    }
                    else if (node.type == "expand") {
                        contentParent.count++;
                        var size = that.getSize();
                        var offset = contentParent.count*size;
                        var contentParentURL = that.model.constructURL(contentParent.path, size, offset);
                        var contentParentJson = that.model.getJSON(contentParentURL);
                        that.appendChildren(treeSelector, contentParent, root, node, contentParentJson, size);
                    }
                }
            });
        },
        updateUGCTree: function(selector,node, json){
            var that = this;
            if (json.children && node.nodes.length == 0) {
                var i = 0;
                for (i = 0; i < json.children.length; i++) {
                    var path = json.children[i].path;
                    var newNode = {text: "", nodes: [], count: 0, path: path, type: "content", color: this.ugcNodeColor};
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
                selector.treeview('updateNodeColor', [pid, that.ugcNodeColor]);
                $('#tree').treeview('updateNodePath', [pid, path]);
                for (i = 1; i < json.children.length; i++) {
                    var newNode = {text: "", nodes: [], count: 0, color: this.ugcNodeColor, type: "UGC", path:json.children[i].path };
                    var path = json.children[i].path;
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
                    selector.treeview('addRoot', [newNode]);
                }
                if (json.children.length==size){
                        var newNode = {text:"See more", nodes:[], color: this.ugcNodeColor, type:"expand"};
                        selector.treeview('addRoot', [newNode]);
                } 
            }
        }
    });
    SCF.Browser = Browser;
    SCF.BrowserView = BrowserView;
    SCF.registerComponent('srp-tools/components/hbs/browser', SCF.Browser, SCF.BrowserView);
})(SCF);
