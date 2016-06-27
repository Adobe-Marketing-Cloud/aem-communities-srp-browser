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
                that.set("jsonString",JSON.stringify(response));
                that.trigger('ugc:fetched', {
                    'model': that
                });
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
            console.log("goo");
            this.model.set("path", this.getField("path"));
            this.model.loadUGC();
            return false;
        }
    });
    SCF.Browser = Browser;
    SCF.BrowserView = BrowserView;
    SCF.registerComponent('srp-tools/components/hbs/browser', SCF.Browser, SCF.BrowserView);

})(SCF);
