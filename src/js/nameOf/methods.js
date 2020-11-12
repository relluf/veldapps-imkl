define(function(require) {
	
	var lookup = (str) => require("../../lookup")(str);
	var guess = (obj) => require("../../guess")(obj);
	var joinNames = (names, ch) => names.filter(v => v).map(v=>js.nameOf(v)).join(ch || ": ");

	var lookup_entity = (obj) => obj.split("/").pop();

	require("js/nameOf").methods.push(
		(obj) => {
			var ent = guess(obj);
		},
		(obj) => (obj['imkl:name']),
		(obj) => (obj['imkl:naam'] || obj['imkl:omschrijving'] || obj['imkl:name'] || obj['imkl:kvkNummer'] || obj['imkl:bronhoudercode']),
		(obj) => (obj['imkl:contactpersoon'] && js.nameOf(obj['imkl:contactpersoon'])),
		(obj) => typeof obj === "string" && (
			obj.indexOf("http://definities.geostandaarden.nl/imkl2015/id/waarde/") === 0 ||
			obj.indexOf("http://inspire.ec.europa.eu/codelist/") === 0
			// obj.indexOf("http://definities.geostandaarden.nl/imkl2015/id/waarde/")
		) ? lookup_entity(obj) : undefined,
		(obj) => {
			var keys = Object.keys(obj);
			if(keys.length === 1) {
				obj = obj[keys[0]];
				// if(keys[0] === "imkl:Aanvrager") {
				// 	return js.nameOf(obj['imkl:contactpersoon']) || js.nameOf(obj['imkl:organisatie']);
				// }
				if(keys[0] === "imkl:Belanghebbende") {
					return joinNames([obj['imkl:bronhoudercode'], obj['imkl:netbeheerder']]);
				}
				if(keys[0] === "imkl:Beheerder") {
					return joinNames([obj['imkl:bronhoudercode'], obj['imkl:organisatie']]);
				}
				if(keys[0] === "imkl:Belang") {
					return joinNames([obj['imkl:thema'], obj['om:omschrijving']]);
				}
				if(keys[0] === "imkl:Bijlage") {
					var type = (obj['imkl:bijlageType']||"?").split("/").pop();
					var media = (obj['imkl:bestandMediaType']||"?").split("/").pop();
				}
				if(keys[0] === "imkl:NEN3610ID") {
					return obj['imkl:lokaalID'];
				}
				if(keys[0] === "imkl:Utiliteitsnet") {
					return joinNames([obj['imkl:thema'], obj['us-net-common:utilityNetworkType']], "/");
				}
			}
		},
	);
	require("js/nameOf").methods.after.push(
		(obj) => js.get(["imkl:identificatie", "imkl:NEN3610ID", "imkl:lokaalID"], obj),
		(obj) => (obj['imkl:id'])
	);
});