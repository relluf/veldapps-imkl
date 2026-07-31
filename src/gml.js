define(function(require) {
	const Gml = require("veldapps-xml/gml");

	const STYLE_COLORS = {
		Datatransport: "#00ff00",
		GasLageDruk: "#ffd750",
		GasHogeDruk: "#ffaf3c",
		BuisleidingGevaarlijkeInhoud: "#ff7f00",
		Landelijk: "#ff0000",
		Hoogspanning: "#ff0000",
		Middenspanning: "#c80000",
		Laagspanning: "#960000",
		Petrochemie: "#a24a00",
		RioolVrijverval: "#ba38a8",
		RioolOnderDruk: "#800080",
		Warmte: "#008080",
		Water: "#0000ff",
		Wees: "#000000",
		Overig: "#000000",
		AanduidingEisVoorzorgsmaatregel: "#dc2626",
		Graafpolygoon: "#c026d3",
		Orientatiepolygoon: "#38bdf8",
		EigenTopografie: "#64748b"
	};
	const FALLBACK_COLORS = [
		"#247ed6", "#38bdf8", "#14b8a6", "#22c55e", "#84cc16", "#f59e0b",
		"#f97316", "#ef4444", "#ec4899", "#a855f7", "#6366f1", "#64748b"
	];
	const ADMIN_LOCAL_NAMES = {
		GebiedsinformatieLevering: true,
		GebiedsinformatieAanvraag: true,
		Belanghebbende: true,
		Belang: true,
		Beheerder: true,
		Bijlage: true,
		Utiliteitsnet: true,
		Aanvrager: true,
		Opdrachtgever: true
	};
	const HELPER_LOCAL_NAMES = {
		UtilityLink: true,
		Annotatie: true,
		Maatvoering: true,
		EigenTopografie: true,
		ExtraGeometrie: true,
		ExtraDetailinfo: true,
		AanduidingEisVoorzorgsmaatregel: true,
		Orientatiepolygoon: true,
		Graafpolygoon: true,
		DiepteTovMaaiveld: true
	};

	function versionFromText(text) {
		const head = String(text || "").slice(0, 1024 * 1024);
		const schemaVersion = head.match(/imkl(?:2015)?(?:\/|%2F)([0-9]+(?:\.[0-9]+){1,2})(?=\/|%2F|["'\s]|$)/i) ||
			head.match(/imkl(?:2015)?[-_](?:wion|wibon)[^"'\s<>]*?([0-9]+(?:\.[0-9]+){1,2})/i) ||
			head.match(/imkl[^"'\s<>]{0,256}([0-9]+(?:\.[0-9]+){1,2})/i);
		return schemaVersion && schemaVersion[1] || "";
	}
	function isText(text) {
		const head = String(text || "").slice(0, 1024 * 1024);
		return /xmlns(?::imkl)?\s*=\s*["'][^"']*geostandaarden\.nl\/imkl/i.test(head) ||
			/(?:schemaLocation|noNamespaceSchemaLocation)\s*=\s*["'][^"']*imkl/i.test(head) ||
			/<(?:[A-Za-z_][\w.-]*:)?Gebiedsinformatie(?:Levering|Aanvraag)\b/.test(head);
	}
	function hasText(text, pattern) {
		pattern.lastIndex = 0;
		return pattern.test(text);
	}
	function styleKeyForFeature(feature, fragment) {
		const local = Gml.localName(feature && feature.type || feature && feature.localName || "");
		const text = String(fragment || "");
		if(local === "Telecommunicatiekabel") return "Datatransport";
		if(local === "Waterleiding") return "Water";
		if(local === "WarmteTransportleiding" || local === "ThermischePijpleiding") return "Warmte";
		if(local === "AanduidingEisVoorzorgsmaatregel") return "AanduidingEisVoorzorgsmaatregel";
		if(local === "Graafpolygoon") return "Graafpolygoon";
		if(local === "Orientatiepolygoon") return "Orientatiepolygoon";
		if(local === "EigenTopografie") return "EigenTopografie";
		if(local === "Weesleiding") return "Wees";
		if(local === "Overig") return "Overig";
		if(local === "Elektriciteitskabel") {
			if(hasText(text, /landelijk|national/i)) return "Landelijk";
			if(hasText(text, /hoogspanning|hoogspannings|high\s*voltage|highVoltage/i)) return "Hoogspanning";
			if(hasText(text, /laagspanning|laagspannings|low\s*voltage|lowVoltage/i)) return "Laagspanning";
			return "Middenspanning";
		}
		if(local === "Rioolleiding") {
			if(hasText(text, /onder[\s_-]*druk|drukriool|pressure|pressuri[sz]ed|persleiding/i)) return "RioolOnderDruk";
			return "RioolVrijverval";
		}
		if(local === "OlieGasChemicalienPijpleiding") {
			if(hasText(text, /gas[^<]{0,80}(lage|low)[^<]{0,80}druk|(lage|low)[^<]{0,80}druk[^<]{0,80}gas/i)) return "GasLageDruk";
			if(hasText(text, /gas[^<]{0,80}(hoge|high)[^<]{0,80}druk|(hoge|high)[^<]{0,80}druk[^<]{0,80}gas/i)) return "GasHogeDruk";
			if(hasText(text, /gevaarlijk|hazard|danger/i)) return "BuisleidingGevaarlijkeInhoud";
			return "Petrochemie";
		}
		if(local === "BuisleidingGevaarlijkeInhoud") return "BuisleidingGevaarlijkeInhoud";
		if(local === "GasLageDruk" || local === "GasleidingLageDruk") return "GasLageDruk";
		if(local === "GasHogeDruk" || local === "GasleidingHogeDruk") return "GasHogeDruk";
		if(local === "Hoogspanningskabel") return "Hoogspanning";
		if(local === "Middenspanningskabel") return "Middenspanning";
		if(local === "Laagspanningskabel") return "Laagspanning";
		if(local === "Datatransport") return "Datatransport";
		return "";
	}
	function styleHintsForFeature(feature, fragment) {
		const text = String(fragment || "");
		const key = styleKeyForFeature(feature, text);
		const hints = {
			key: key,
			color: key && STYLE_COLORS[key] || "",
			thin: hasText(text, /huisaansluiting|aansluitleiding|house\s*connection|service\s*connection/i),
			aboveGround: hasText(text, /bovengronds|above\s*ground/i),
			uncertain: hasText(text, /liggingsonzeker|onzeker|uncertain/i)
		};
		return hints.key || hints.thin || hints.aboveGround || hints.uncertain ? hints : null;
	}
	function scanFeature(feature, fragment) {
		feature.styleHints = styleHintsForFeature(feature, fragment);
	}
	function fallbackColor(value, index) {
		if(index !== undefined && index !== null) {
			return FALLBACK_COLORS[Math.abs(index) % FALLBACK_COLORS.length];
		}
		const key = String(value || "");
		let hash = 0;
		for(let i = 0; i < key.length; i++) {
			hash = ((hash << 5) - hash) + key.charCodeAt(i);
			hash |= 0;
		}
		return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
	}
	function styleForLayer(layer, index) {
		const local = Gml.localName(layer && layer.type || "");
		const hints = styleHintsForFeature({ type: local }, local) || {};
		const color = hints.color || fallbackColor(layer && (layer.type || layer.key || layer.name), index);
		return {
			key: hints.key || local || "fallback",
			color: color,
			width: hints.thin ? 1.15 : 2,
			fillAlpha: local === "Graafpolygoon" || local === "Orientatiepolygoon" ? "0.08" : "0.18",
			pointRadius: 5,
			dash: hints.uncertain ? [6, 4] : null
		};
	}
	function styleForEntry(entry, layer, index) {
		const featureHints = entry && entry.feature && entry.feature.styleHints || null;
		const geometryHints = entry && entry.geometryFeature && entry.geometryFeature.styleHints || null;
		const base = styleForLayer(layer || entry && entry.layer, index);
		const hints = featureHints && featureHints.key ? featureHints : geometryHints && geometryHints.key ? geometryHints :
			featureHints || geometryHints || {};
		return {
			key: hints.key || base.key,
			color: hints.color || base.color,
			width: hints.thin ? 1.15 : base.width,
			fillAlpha: base.fillAlpha,
			pointRadius: base.pointRadius,
			dash: hints.uncertain ? [6, 4] : base.dash,
			aboveGround: hints.aboveGround === true,
			uncertain: hints.uncertain === true
		};
	}
	function layerLabel(type, suffix) {
		const label = Gml.localName(type).replace(/([a-z])([A-Z])/g, "$1 $2");
		return suffix ? label + " " + suffix : label;
	}
	function featureTypes(index, predicate) {
		return Object.keys(index.byType || {})
			.map(type => index.byType[type])
			.filter(predicate || function() { return true; })
			.sort((a, b) => b.count - a.count);
	}
	function inc(obj, key, value) {
		obj[key] = (obj[key] || 0) + (value || 1);
		return obj[key];
	}
	function refsToGeometryCount(index, type) {
		let count = 0;
		const refs = {};
		index.features.filter(feature => feature.type === type).forEach(feature => {
			(feature.refs || []).forEach(ref => {
				const target = index.byId[ref.href];
				if(target && Gml.reachableGeometryFeatures(index, target).length) {
					count++;
					inc(refs, ref.prop);
				}
			});
		});
		return { count: count, refs: refs };
	}
	function planLayers(index, opts) {
		opts = opts || {};
		const layers = [];
		const types = featureTypes(index);
		const allGeometryCount = types.reduce((sum, type) => sum + type.geometryCount, 0);
		if(allGeometryCount) {
			layers.push({
				key: "imkl:all",
				mode: "all",
				kind: "document",
				name: "Document (alles)",
				count: allGeometryCount,
				checked: false
			});
		}
		types.forEach(type => {
			const local = type.localName;
			const refs = refsToGeometryCount(index, type.type);
			if(!type.geometryCount && refs.count && !ADMIN_LOCAL_NAMES[local]) {
				layers.push({
					key: "imkl:domain:" + type.type,
					mode: "referenced",
					kind: "domain",
					type: type.type,
					name: layerLabel(type.type),
					count: type.count,
					geometryCount: refs.count,
					refs: refs.refs,
					checked: true
				});
			}
		});
		types.filter(type => type.geometryCount > 0).forEach(type => {
			const local = type.localName;
			layers.push({
				key: "imkl:direct:" + type.type,
				mode: "direct",
				kind: HELPER_LOCAL_NAMES[local] ? "helper" : "direct",
				type: type.type,
				name: layerLabel(type.type),
				count: type.geometryCount,
				primitives: type.primitives,
				checked: local !== "UtilityLink"
			});
		});
		return layers.sort((a, b) => {
			const ak = a.kind === "document" ? 0 : a.kind === "domain" ? 1 : 2;
			const bk = b.kind === "document" ? 0 : b.kind === "domain" ? 1 : 2;
			return ak === bk ? (b.count || 0) - (a.count || 0) : ak - bk;
		});
	}
	function layerFeatures(index, layer) {
		if(!layer) return [];
		if(layer.mode === "all") {
			return index.features.filter(feature => feature.hasGeometry);
		}
		if(layer.mode === "direct") {
			return index.features.filter(feature => feature.type === layer.type && feature.hasGeometry);
		}
		if(layer.mode === "referenced") {
			return index.features.filter(feature => feature.type === layer.type &&
				Gml.reachableGeometryFeatures(index, feature).length);
		}
		return [];
	}

	return {
		isText: isText,
		versionFromText: versionFromText,
		scanFeature: scanFeature,
		styleHintsForFeature: styleHintsForFeature,
		styleForEntry: styleForEntry,
		styleForLayer: styleForLayer,
		planLayers: planLayers,
		layerFeatures: layerFeatures,
		colors: STYLE_COLORS,
		adminLocalNames: ADMIN_LOCAL_NAMES,
		helperLocalNames: HELPER_LOCAL_NAMES
	};
});
