define(function(require) {
	const Gml = require("veldapps-xml/gml");
	const Imkl = require("./gml");

	function parse(text, options) {
		options = options || {};
		text = String(text || "");
		const started = Date.now();
		const version = options.version || Imkl.versionFromText(text);
		const scan = Gml.scan(text, {
			domain: "imkl",
			version: version,
			onFeature: Imkl.scanFeature
		});
		const index = Gml.index(scan);
		const layers = Imkl.planLayers(index);
		const view = Gml.featureView(index);
		const summary = Gml.summaryView(index, layers);

		return {
			type: scan.version ? "imkl/" + scan.version : "imkl",
			version: scan.version,
			facetUri: "veldapps-imkl/Tabs<Document.imkl>",
			root: view,
			view: view,
			summary: summary,
			xml: options.xml,
			text: text,
			imkl: {
				scan: scan,
				index: index,
				layers: layers
			},
			timing: {
				scan: scan.stats.duration,
				total: Date.now() - started
			},
			capabilities: {
				gml: true,
				imkl: true,
				map: true,
				view: true
			}
		};
	}

	return {
		parse: parse
	};
});
