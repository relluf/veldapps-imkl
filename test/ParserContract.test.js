"use strict";

const path = require("path");
const parserRoot = path.resolve(__dirname, "../../veldapps-bxv-parser");
const { assertInstallIdempotent, runCases } = require(path.join(parserRoot, "test/Contract"));
const { createHarness } = require(path.join(parserRoot, "test/ParserHarness"));
const harness = createHarness();
const Gml = harness.loadAmd(path.resolve(__dirname, "../../veldapps-xml/src/gml.js"));
const Imkl = harness.loadAmd(path.resolve(__dirname, "../src/gml.js"), {
	"veldapps-xml/gml": Gml
});
const ImklDocument = harness.loadAmd(path.resolve(__dirname, "../src/Document.js"), {
	"veldapps-xml/gml": Gml,
	"./gml": Imkl
});
const XmlProfiles = harness.loadAmd(path.resolve(__dirname, "../src/profiles/xml.js"), {
	module: { id: "veldapps-imkl/profiles/xml" },
	"veldapps-xml/index": harness.Xml,
	"bxv/ResourceContent": harness.ResourceContent,
	"../Document": ImklDocument
}, { id: "veldapps-imkl/profiles/xml" });
const Bxv = harness.loadAmd(path.resolve(__dirname, "../src/bxv.js"), {
	"bxv/Profiles": harness.Profiles,
	"./profiles/xml": XmlProfiles
}, { id: "veldapps-imkl/bxv" });

assertInstallIdempotent(Bxv, harness.Profiles, ["xml"]);

runCases(harness.Parser, [{
	base: __dirname,
	fixture: "fixtures/imkl-2.0.xml",
	expect: {
		format: "bxv/formats/xml",
		profile: "veldapps-imkl/profiles/xml",
		type: "imkl/2.0",
		version: "2.0",
		facetUri: "veldapps-imkl/Tabs<Document.imkl>",
		capabilities: ["imkl", "xml", "view"],
		rootKeys: ["imkl:Elektriciteitskabel"]
	}
}, {
	base: __dirname,
	fixture: "fixtures/generic.xml",
	expect: { profile: "bxv/profiles/xml", type: "xml", version: "generic" }
}]).then(() => console.log("IMKL parser contract tests passed")).catch(error => {
	console.error(error);
	process.exitCode = 1;
});
