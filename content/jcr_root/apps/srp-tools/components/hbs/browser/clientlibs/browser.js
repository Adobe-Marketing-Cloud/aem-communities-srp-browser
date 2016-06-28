(function (SCF) {
    "use strict";
    var Browser = SCF.Model.extend({
        modelName: "BrowserModel",
        defaults: {
            path: "/",
            json: {},
            jsonString: ""
        },
        loadUGC: function () {
            var url = SCF.config.urlRoot + this.get('id') + ".srp.json?path=" + this.get("path");
            var that = this;
            $.get(url, function (response) {
                that.set("json", response);
//                that.trigger('ugc:fetched', {
//                    'model': that
//                });                
            });
        }
    });
    var BrowserView = SCF.View.extend({
        viewName: "Browser",
        tagName: "div",
        className: "scf-browser",
        init: function () {
            this.listenTo(this.model, "ugc:fetched", this.render);
        },  
        fetch: function (e) {
            e.preventDefault();
            this.model.set("path", this.getField("path"));
            this.model.loadUGC();
            const formatter = new JSONFormatter(this.model.get("json"));
            var tree = document.getElementById("tree");
                if (!tree.hasChildNodes()){
                    tree.appendChild(formatter.render());
                }
                else{
                    tree.replaceChild(formatter.render(), document.getElementById("srprd"));
                }
            return false;
        }
    });
    SCF.Browser = Browser;
    SCF.BrowserView = BrowserView;
    SCF.registerComponent('srp-tools/components/hbs/browser', SCF.Browser, SCF.BrowserView);

})(SCF);
