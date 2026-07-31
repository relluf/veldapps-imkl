var sf = String.format;
var at__ = "@__";
var app = this.app(), me = this;
var ws = this.app().down("devtools/Workspace<imkl>"); if(!ws) alert("No workspace");
var resource = this.vars(["resource"]);

var prefix_url = "http://fews.wldelft.nl/schemas/version1.0/pi-schemas/";
var url_map = ws.vars(["devtools/Editor<xsd>/url_map", false, {}]);

var uri = js.normalize(resource.uri, "../../xsd/Leveringsinformatie-2.1.xsd");

	function parserNeeded(uri, callback) {
		var tab = ws.qs("#editor-needed").execute({
			dontBringToFront: true,
			resource: { uri: uri }});
		var parser = tab.qs(":root");
		if(parser && (parser = parser.vars("parser"))) {
			// must use a timeout because of promise()
			setTimeout(() => callback(tab, parser), 20);
		} else {
			tab._control.loadForm();
			// callback everytime or just once (which is default)
			tab.once("resource-rendered", function() {
				parserNeeded(uri, callback);
			});
		}
	}
	
	function promise(uri, promises) {
		return (promises[uri] = promises[uri] || new Promise(function(resolve, reject) {
			parserNeeded(uri, function(tab, parser) {
				var imps = parser.imps.map(_ => 
					promises[_[at__].uri] ? null : promise(_[at__].uri, promises));
					
				Promise.all(imps).then(function() {
					ws.print(uri.split("/").splice(-3).join("/"), promises[uri]);
					
					tab.qs(":root #console").clear();
					tab.qs(":root #render").execute();
					resolve({ parser: parser, tab: tab, imps: imps });
				});
					
			});
		}));
	}
	
	me.scope().loading.show();
	[uri, promise(uri, {}).then(function() {
		promise(uri, {}).then(function() {
			me.scope().loading.hide();		
			alert("All XSDs files are loaded");
		});
	})][1];
