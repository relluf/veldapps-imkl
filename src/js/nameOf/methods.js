define(function(require) {
	
	var lookup = (str) => require("../../lookup")(str);
	var guess = (obj) => require("../../guess")(obj);
	var joinNames = (names, ch) => names.filter(v => v).map(v=>js.nameOf(v)).join(ch || ": ");
	var lookup_entity = (obj) => obj.split("/").pop();
	
	var nameOf_entity = (obj, entity) => {
		var keys = Object.keys(obj);
		if(keys.length === 2 && keys[1] === "@_xlink:href-resolved") {
			if(obj[keys[1]] !== undefined) {
				return js.nameOf(obj[keys[1]]);
			} else {
				return js.nameOf(obj[keys[0]]);
			}
		}
		if(keys.length === 1) {
			obj = obj[keys[0]];
			// if(keys[0].startsWith("imkl:AnalyticResult")) {
			// 	var nv = obj['imkl:numericValue'];
			// 	return js.sf("%s %s %s", 
			// 		replace_xmlEntities(obj['imkl:limitSymbol'])||"", 
			// 		nv['#text'], js.get("Code", lookup(nv['@_uom'])) || "");
			// }
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
			// if(keys[0] === "imkl:PhysicalProperty") {
			// 	if(!obj.hasOwnProperty("imkl:parameter")) {
			// 		return [
			// 			obj['imkl:quantity'],
			// 			obj['imkl:condition']
			// 		].filter(v=>v).map(v=>js.nameOf(v)).join(": ");
			// 	} else {
			// 		return obj['imkl:parameter'] && js.nameOf(obj['imkl:parameter']);
			// 	}
			// }
			// if(keys[0] === "imkl:Package") {
			// 	return [
			// 		obj['imkl:packageType'],
			// 		obj['imkl:barcode']
			// 	].filter(v=>v).map(v=>js.nameOf(v)).join(": ");
			// }
			// if(keys[0] === "imkl:Person") {
			// 	return [
			// 		obj['imkl:lastName'],
			// 		obj['imkl:firstName'],
			// 	].filter(v=>v).map(v=>js.nameOf(v)).join(", ");
			// }
			// if(keys[0] === "imsikb0101:Activity") {
			// 	return js.sf("%s (%s-%s)", 
			// 		js.nameOf(obj['imsikb0101:UBI']) || "?", 
			// 		obj['imsikb0101:startTime'] || "?", 
			// 		obj['imsikb0101:endTime'] || "?");
			// }
			// if(keys[0] === "imsikb0101:Address") {
			// 	return [
			// 		obj['imsikb0101:publicSpace'],
			// 		obj['imsikb0101:zipcode'],
			// 		obj['imsikb0101:city']
			// 	].filter(v=>v).map(v=>js.nameOf(v)).join(", ");
			// }
			// if(keys[0] === "imsikb0101:ContaminationInformation") {
			// 	// var d = (depth) => js.get("imkl:value.#text", obj["imkl:" + depth + "Depth"], obj);
			// 	// return js.sf("%s-%s %n", d("upper"), d("lower"), obj['imsikb0101:exceededClass']||"?");
			// 	return obj['imsikb0101:exceededClass'] && js.nameOf(obj['imsikb0101:exceededClass']);
			// }
			// if(keys[0] === "imsikb0101:Cost") {
			// 	return [obj['imsikb0101:amount'], obj['imsikb0101:determinationMethod'] && 
			// 		js.nameOf(obj['imsikb0101:determinationMethod'])].filter(v=>v).join(", ");
			// }
			// if(keys[0] === "imsikb0101:CurrentUsage") {
			// 	var cu = obj['imsikb0101:landuseType'];
			// 	return cu && (js.sf("%s (%s%%)", js.nameOf(cu), obj['imsikb0101:coveragePercentage']) || "?");
			// }
			// if(keys[0] === "imsikb0101:Decision") {
			// 	return [
			// 		obj['imsikb0101:decisionType'],
			// 		obj['imsikb0101:statusOfDecision']
			// 	].filter(v => v).map(v => js.nameOf(v)).join(", ");
			// }
			// if(keys[0] === "imsikb0101:DestinationAfterRemediation") {
			// 	return js.nameOf(obj['imsikb0101:destinationType']);
			// }
			// if(keys[0] === "imsikb0101:Dossier") {
			// 	return [
			// 		obj['imsikb0101:dossierIdLocalAuthority'],
			// 		obj['imsikb0101:dossierIdNotLocalAuthority']
			// 	].filter(v=>v).join("/");
			// }
			// if(keys[0] === "imsikb0101:Layer") {
			// 	return js.sf("%n-%n %n", 
			// 		// js.get(["imsikb0101:upperDepth", "imkl:Depth", "immetingen:value", "#text"], obj),
			// 		obj['imsikb0101:upperDepth'] || "?", 
			// 		obj['imsikb0101:lowerDepth'] || "?", 
			// 		obj['imsikb0101:layerType'] || "");
				
			// }
			// if(keys[0] === "imsikb0101:Finishing") {
			// 	return js.sf("%n-%n %n", 
			// 		// js.get(["imsikb0101:upperDepth", "immetingen:Depth", "immetingen:value", "#text"], obj),
			// 		obj['imsikb0101:upperDepth'] || "?", 
			// 		obj['imsikb0101:lowerDepth'] || "?", 
			// 		obj['imsikb0101:layerType'] || "");
			// }
			// if(keys[0] === "imsikb0101:Nature") {
			// 	return obj['imsikb0101:physicalProperty'] && js.nameOf(obj['imsikb0101:physicalProperty']);
			// }
			// if(keys[0] === "imsikb0101:Person") {
			// 	var ln = obj['imsikb0101:lastName'];
			// 	var fn = obj['imsikb0101:firstName'];
			// 	if(fn === ln) return ln;
			// 	return [ln,fn].filter(v=>v).map(v=>js.nameOf(v)).join(", ");
			// }
			// if(keys[0] === "imsikb0101:Remediation") {
			// 	return [
			// 		obj['imsikb0101:destinationBeforeRemediation'],
			// 		obj['imsikb0101:destinationAfterRemediation']
			// 	].filter(v=>v).map(v=>js.nameOf(v)).join(" => ");
			// }
			// if(keys[0] === "imsikb0101:SourceSystem") {
			// 	return js.sf("%s @ %n", obj['imsikb0101:applicationID'], obj['imsikb0101:application']);
			// }
			// if(keys[0] === "imsikb0101:SoilLocation") {
			// 	return obj['imsikb0101:name'] || js.nameOf(obj['imsikb0101:Addresses']);
			// }
			// if(keys[0] === "imsikb0101:UBI") {
			// 	return js.nameOf(obj);
			// }
			
			if(keys[0] === "gml:TimeInstant") {
				return obj['gml:timePosition'];
			}
			if(keys[0] === "gml:Point") {
				return obj['gml:pos'] && js.nameOf(obj['gml:pos']);
			}
			if(keys[0] === "om:ObservationContext") {
				return [
					obj['om:role'],
					obj['om:relatedObservation']
				].filter(v=>v).map(v=>js.nameOf(v)).join(" ");
			}
			if(keys[0] === "sam:SamplingFeatureComplex") {
				var rsf = obj['sam:relatedSamplingFeature'];
				var role = obj['sam:role'];
				return [role && js.nameOf(role), rsf && js.nameOf(rsf)].filter(v => v).join(": ");
			}
			
			if(keys[0].indexOf(":") !== -1) {
				var name = js.nameOf(obj);
				return ["[object Object]", "Object", "undefined"].indexOf(name) === -1 ? name : keys[0].split(":").pop();
			}
		}
		
		if((obj['@_xsi:type'])) {
			obj = js.mixIn(obj); 
			entity = {}; entity[obj['@_xsi:type']] = obj;
			delete obj['@_xsi:type'];
			return nameOf_entity(entity);
		}
	};
	var replace_xmlEntities = (str) => {
		return str && str.replace ? str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
			.replace(/&apos;/g, "'").replace("&quot;", "\"") : str;
	};

	require("js/nameOf").methods.push(
		// nameOf_entity,
		// (obj) => {
		// 	var t = obj['#text'];
		// 	return (t && js.nameOf((t = replace_xmlEntities(t)))) || t;
		// },
		(obj) => (obj['imkl:name']),
		(obj) => (obj['imkl:naam'] || obj['imkl:omschrijving'] || obj['imkl:name'] || obj['imkl:kvkNummer'] || obj['imkl:bronhoudercode']),
		(obj) => (obj['imkl:contactpersoon'] && js.nameOf(obj['imkl:contactpersoon'])),
		(obj) => typeof obj === "string" && (
			obj.indexOf("http://definities.geostandaarden.nl/imkl2015/id/waarde/") === 0 ||
			obj.indexOf("http://inspire.ec.europa.eu/codelist/") === 0
			// obj.indexOf("http://definities.geostandaarden.nl/imkl2015/id/waarde/")
		) ? lookup_entity(obj) : undefined
	);
	// require("js/nameOf").methods.push(function(obj) {
	// 	var ent = guess(obj);
	// });
	require("js/nameOf").methods.after.push(
		// (obj) => (obj['imkl:identificatie'] && js.nameOf(obj['imkl:identificatie'])),
		(obj) => js.get(["imkl:identificatie", "imkl:NEN3610ID", "imkl:lokaalID"], obj),
		(obj) => (obj['imkl:id'])
	);
});