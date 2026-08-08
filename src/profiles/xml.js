define(["module", "veldapps-xml/index", "bxv/ResourceContent", "../Document"], function(module, Xml, ResourceContent, Document) {

	return [{
		id: module.id,
		types: ["imkl"],
		match(text) {
			text = Xml.skipPrologue(text);
			return /xmlns.*="http:\/\/www\.geostandaarden\.nl\/imkl\/2015\/wion\//s.test(text) ||
				/xmlns.*="http:\/\/www\.geostandaarden\.nl\/imkl\/wibon"/s.test(text);
		},
		version(text) {
			const match = String(text || "").match(/imkl\/2015\/wion\/([^\"]*)/s);
			return match ? match[1] : "2.0";
		},
		interpret(ctx, root, done) {
			const text = ResourceContent.text(ctx.resource);
			done(Document.parse(text, {
				xml: root,
				version: this.version(text)
			}));
		}
	}];
});
