(function (SCF) {
    "use strict";
    var Browser = SCF.Model.extend({
        modelName: "BrowserModel",
        defaults: {
            size: 5
        },
        
        // construct a url from the path, size, and offset 
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
        
        // fetch json by making an ajax call to the url 
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
        basePath: "/content",
        jsonInitLevel: 1,
        init: function () {
            var selector = $("#"+this.contentDisplayId);
            this.buildContentTree(selector);
        },
        
        // create a node from a dictionary of key value pairings
        createNode: function(dict) {
            var node = {};
            var keys = [];
            for (var key in dict) {
                if (dict.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            for (key in dict) {
                node[key] = dict[key];
            }
            return node;
        },
        
        // return pagination size 
        getSize: function() {
            return 5;
        },
        
        // fetch JSON based on text in the text path bar
        fetch: function (e) {
            e.preventDefault();
            var url = this.model.constructURL(this.getField("path"));
            var json = this.model.getJSON(url);
            this.renderJSON(json);
            return false;
        },
        
        // displays the JSON under the JSON display using json formatting clientlib 
        renderJSON: function(json){
            // no need to show the child nodes because they are displayed in the content/ugc trees
            delete json.contentChildren;
            delete json.children;
            const formatter = new JSONFormatter(json, this.jsonInitLevel);
            var tree = document.getElementById(this.jsonDisplayId);
                if (!tree.hasChildNodes()){
                    tree.appendChild(formatter.render());
                }
                else{
                    tree.replaceChild(formatter.render(), document.getElementById("srprd"));
                }
        },
        
        // render a path in the text path bar 
        displayPath: function(path) {
            var pathSelector = $("#" + this.pathDisplayId);
            pathSelector.attr("value", path)
        },
        
        // Content tree Logic
        
        // content array is used to render the content tree via bootstrap-treeview clientlib
        buildContentArray: function(path, size) {
            var url = this.model.constructURL(path, size, 0);
            var json = this.model.getJSON(url);
            var tree = [];
            var i = 0;
            for (i = 0; i < json.contentChildren.length; i++) {
                var path = json.contentChildren[i].path;
                var final = path.substr(path.lastIndexOf('/') + 1); 
                var newNode = this.createNode({text:final, path:path, type:"content", nodes: [], count: 0});
                tree[i] = newNode;
            }
            this.navData = tree;
            return tree; 
        },
        
        // building content tree via bootstrap-treeview clientlib
        buildContentTree: function (treeSelector, size) {
            var that = this;
            var data = this.buildContentArray(this.basePath, size);
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
                    if (node.nodes.length == 0) {
                        var url = that.model.constructURL(node.path);
                        var json = that.model.getJSON(url);
                        // update the content tree
                        that.updateContentTree(treeSelector, node, json, size);
                        // show new UGC tree in the middle column
                        var ugcDisplaySelector = $('#'+that.ugcDisplayId);
                        that.buildUGCTree(ugcDisplaySelector, json, that.getSize(), 0, node);
                    }
                }
            });
            return false;
        },
        
        // update content tree on node expand 
        updateContentTree: function(selector,node, json, size, offset){
            var i = 0;
            for (i = 0; i < json.contentChildren.length; i++) {
                var path = json.contentChildren[i].path;
                var final = path.substr(path.lastIndexOf('/') + 1); 
                var newNode = this.createNode({text: final, path: path, type:"content", nodes: [], count: 0});
                var pid = node.nodeId;
                selector.treeview('addNode', [newNode, pid]);
            }
        },
        
        // UGC tree logic 
        
        // ugc array is used to render the ugc tree via bootstrap-treeview clientlib
        buildUGCArray: function(path, size, type) {
            var url = this.model.constructURL(path, size, 0);
            var json = this.model.getJSON(url);
            var tree = [];
            var i = 0;
            for (i = 0; i < json.children.length; i++){
                var path = json.children[i].path;
                var final = path.substr(path.lastIndexOf('/') + 1); 
                var newNode = this.createNode({text:final, color: this.ugcNodeColor, path: path, type:"UGC", nodes: []})
                tree[i] = newNode;      
            }  
            if (json.children.length == size) {
                var newNode = this.createNode({text: "See more", nodes: [], color: this.ugcNodeColor, path: path, type: "expand"});
                tree[json.children.length] = newNode;
            }
            return tree; 
        },
        
        // rendering ugc tree via bootstrap-treeview clientlib
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
                    if (node.nodes.length == 0) {                        
                        if (node.type != "expand"){
                            var url = that.model.constructURL(node.path, size, offset);
                            var json = that.model.getJSON(url); 
                            that.updateUGCTree(treeSelector, node, json);
                        }
                        else if (node.type == "expand") {
                            contentParent.count++;
                            var size = that.getSize();
                            var offset = contentParent.count*size;
                            var contentParentURL = that.model.constructURL(contentParent.path, size, offset);
                            var contentParentJson = that.model.getJSON(contentParentURL);
                            that.appendUGCChildren(treeSelector, contentParent, node, contentParentJson, size);
                        }
                    }
                }
            });
        },
        
        // update the ugc tree upon node expand 
        updateUGCTree: function(selector,node, json){
            if (json.children && node.nodes.length == 0) {
                var i = 0;
                for (i = 0; i < json.children.length; i++) {
                    var path = json.children[i].path;
                    var newNode = {text: "", nodes: [], path: path, type: "content", color: this.ugcNodeColor};
                    var final = path.substr(path.lastIndexOf('/') + 1); 
                    newNode.text = final;
                    var pid = node.nodeId;
                    selector.treeview('addNode', [newNode, pid]);
                }
            }
        },
        
        // append additonal children to the UGC tree upon expansion of a see more node
        appendUGCChildren: function(selector, contentParent, selected, json, size, offset){
            selector.treeview('removeRoot', [selected]);
            for (var i = 0; i < json.children.length; i++) {
                var path = json.children[i].path;
                var final = path.substr(path.lastIndexOf('/') + 1); 
                var newNode = this.createNode({text: final, nodes: [], count: 0, color: this.ugcNodeColor, type: "UGC", path:json.children[i].path });
                selector.treeview('addNode', [newNode]);                
            }
            if (json.children.length==size){
                var newNode = this.createNode({text:"See more", nodes:[], color: this.ugcNodeColor, type:"expand"});
                selector.treeview('addNode', [newNode]);
            } 
        }
    });
    SCF.Browser = Browser;
    SCF.BrowserView = BrowserView;
    SCF.registerComponent('srp-tools/components/hbs/browser', SCF.Browser, SCF.BrowserView);
})(SCF);
