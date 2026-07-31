"use js, ol, proj4, veldapps-ol/proj/RD, veldapps-xml/index, veldapps-xml/gml, veldapps-imkl/gml, bxv/Layers, locale";

const ol = require("ol");
const proj4 = require("proj4");
const Xml = require("veldapps-xml/index");
const Gml = require("veldapps-xml/gml");
const Imkl = require("veldapps-imkl/gml");
const Layers = require("bxv/Layers");
const locale_ns = require("locale");
require("veldapps-ol/proj/RD");

locale_ns.prefixed(["Document.imkl"], {
	nl: {
		"-map.add": "Toevoegen aan kaart",
		"-map.documents": "Documenten",
		"-map.document-all": "Document (alles)",
		"-map.domain": "Netobjecten",
		"-map.utilitylink": "UtilityLink geometrie",
		"-map.polygon": "Aanvraagpolygoon",
		"-map.annotation": "Annotaties",
		"-map.measurement": "Maatvoering",
		"-map.topography": "Topografie",
		"-map.extra": "Extra/detail geometrie",
		"-map.open-section": "Open eerst de Kaart-sectie.",
		"-map.no-geometries": "Geen IMKL-geometrie gevonden.",
		"-map.loaded": "%H geladen",
		"-layer.utilitylink": "UtilityLink geometrie",
		"-layer.Elektriciteitskabel": "Elektriciteitskabel",
		"-layer.Telecommunicatiekabel": "Telecommunicatiekabel",
		"-layer.OlieGasChemicalienPijpleiding": "Olie/gas/chemicalien pijpleiding",
		"-layer.Waterleiding": "Waterleiding",
		"-layer.Rioolleiding": "Rioolleiding",
		"-layer.WarmteTransportleiding": "Warmte-transportleiding",
		"-layer.Maatvoering": "Maatvoering",
		"-layer.DiepteTovMaaiveld": "Diepte t.o.v. maaiveld",
		"-layer.Annotatie": "Annotaties",
		"-layer.EigenTopografie": "Topografie",
		"-layer.ExtraGeometrie": "Extra geometrie",
		"-layer.ExtraDetailinfo": "Extra detailinfo",
		"-layer.AanduidingEisVoorzorgsmaatregel": "Eis voorzorgsmaatregel",
		"-layer.Appurtenance": "Appurtenance",
		"-layer.Orientatiepolygoon": "Orientatiepolygoon",
		"-layer.Graafpolygoon": "Graafpolygoon"
	},
	en: {
		"-map.add": "Add to map",
		"-map.documents": "Documents",
		"-map.document-all": "Document (all)",
		"-map.domain": "Network objects",
		"-map.utilitylink": "UtilityLink geometry",
		"-map.polygon": "Request polygon",
		"-map.annotation": "Annotations",
		"-map.measurement": "Measurement",
		"-map.topography": "Topography",
		"-map.extra": "Extra/detail geometry",
		"-map.open-section": "Open the Map section first.",
		"-map.no-geometries": "No IMKL geometries found.",
		"-map.loaded": "%H loaded",
		"-layer.utilitylink": "UtilityLink geometry",
		"-layer.Elektriciteitskabel": "Electricity cable",
		"-layer.Telecommunicatiekabel": "Telecommunication cable",
		"-layer.OlieGasChemicalienPijpleiding": "Oil/gas/chemicals pipeline",
		"-layer.Waterleiding": "Water pipe",
		"-layer.Rioolleiding": "Sewer pipe",
		"-layer.WarmteTransportleiding": "Heat transport pipe",
		"-layer.Maatvoering": "Measurement",
		"-layer.DiepteTovMaaiveld": "Depth relative to ground level",
		"-layer.Annotatie": "Annotations",
		"-layer.EigenTopografie": "Topography",
		"-layer.ExtraGeometrie": "Extra geometry",
		"-layer.ExtraDetailinfo": "Extra detail information",
		"-layer.AanduidingEisVoorzorgsmaatregel": "Precaution requirement",
		"-layer.Appurtenance": "Appurtenance",
		"-layer.Orientatiepolygoon": "Orientation polygon",
		"-layer.Graafpolygoon": "Excavation polygon"
	}
});
const locale = locale_ns.prefixed("Document.imkl");

const IMKL_LAYER_COLORS = [
	"#247ed6", "#38bdf8", "#14b8a6", "#22c55e", "#84cc16", "#f59e0b",
	"#f97316", "#ef4444", "#ec4899", "#a855f7", "#6366f1", "#64748b"
];
const IMKL_STYLE_CACHE = {};
const DEFAULT_TARGET_PROJECTION = "EPSG:28992";
const IMKL_BATCH_SIZE = 1000;

const epsgCodeOf = Xml.epsgCodeOf;

function isWgs84Coordinate(coordinate) {
	const x = coordinate[0], y = coordinate[1];
	return x >= 3 && x <= 8 && y >= 50 && y <= 54;
}
function isWgs84AxisFlippedCoordinate(coordinate) {
	const x = coordinate[0], y = coordinate[1];
	return x >= 50 && x <= 54 && y >= 3 && y <= 8;
}
function normalizeWgs84Coordinate(coordinate) {
	return isWgs84AxisFlippedCoordinate(coordinate) ? [coordinate[1], coordinate[0]] : coordinate;
}
function transformCoordinate(coordinate, sourceProjection, targetProjection) {
	targetProjection = targetProjection || DEFAULT_TARGET_PROJECTION;
	if(!sourceProjection || sourceProjection === targetProjection) {
		return isWgs84Coordinate(coordinate) || isWgs84AxisFlippedCoordinate(coordinate) ?
			proj4("EPSG:4326", targetProjection, normalizeWgs84Coordinate(coordinate)) :
			coordinate;
	}
	if(sourceProjection === "EPSG:4326") {
		return proj4(sourceProjection, targetProjection, normalizeWgs84Coordinate(coordinate));
	}
	try {
		return proj4(sourceProjection, targetProjection, coordinate);
	} catch(e) {
		console.warn("IMKL projectie niet bekend", sourceProjection, e);
		return coordinate;
	}
}
function transformCoordinates(coordinates, sourceProjection, targetProjection) {
	return coordinates.map(coordinate => transformCoordinate(coordinate, sourceProjection, targetProjection));
}
function transformRings(rings, sourceProjection, targetProjection) {
	return rings.map(ring => transformCoordinates(ring, sourceProjection, targetProjection));
}
function olGeometryFromGmlGeometry(geometry, targetProjection) {
	const sourceProjection = epsgCodeOf(geometry.srsName) || DEFAULT_TARGET_PROJECTION;
	if(geometry.type === "Point") {
		return new ol.geom.Point(transformCoordinate(geometry.coordinates, sourceProjection, targetProjection));
	}
	if(geometry.type === "LineString") {
		return new ol.geom.LineString(transformCoordinates(geometry.coordinates, sourceProjection, targetProjection));
	}
	if(geometry.type === "Polygon") {
		return new ol.geom.Polygon(transformRings(geometry.coordinates, sourceProjection, targetProjection));
	}
	if(geometry.type === "MultiPolygon") {
		return new ol.geom.MultiPolygon(geometry.coordinates.map(rings => transformRings(rings, sourceProjection, targetProjection)));
	}
	return null;
}
function fallbackColorForImklLayer(layer, index) {
	if(index !== undefined && index !== null) {
		return IMKL_LAYER_COLORS[Math.abs(index) % IMKL_LAYER_COLORS.length];
	}
	const key = String(layer && (layer.type || layer.key || layer.name) || "");
	let hash = 0;
	for(let i = 0; i < key.length; i++) {
		hash = ((hash << 5) - hash) + key.charCodeAt(i);
		hash |= 0;
	}
	return IMKL_LAYER_COLORS[Math.abs(hash) % IMKL_LAYER_COLORS.length];
}
function imklLayerStyleSpec(layer, index) {
	return Imkl.styleForLayer instanceof Function ?
		Imkl.styleForLayer(layer, index) : {
			key: Gml.localName(layer && layer.type || "") || "fallback",
			color: fallbackColorForImklLayer(layer, index),
			width: 2,
			fillAlpha: "0.18",
			pointRadius: 5,
			dash: null
		};
}
function colorForImklLayer(layer, index) {
	return imklLayerStyleSpec(layer, index).color;
}
function rgbaFromHex(hex, alpha) {
	const match = String(hex || "").match(/^#?([0-9a-f]{6})$/i);
	if(!match) return hex;
	const value = match[1];
	return js.sf("rgba(%d, %d, %d, %s)",
		parseInt(value.substring(0, 2), 16),
		parseInt(value.substring(2, 4), 16),
		parseInt(value.substring(4, 6), 16),
		alpha);
}
function imklLayerHasPoints(layer) {
	const primitives = layer && layer.primitives || {};
	return !!(primitives.Point || primitives.MultiPoint);
}
function imklLayerSortRank(layer) {
	const localName = Gml.localName(layer && layer.type || "");
	if(localName === "Graafpolygoon") return 0;
	return imklLayerHasPoints(layer) ? 2 : 1;
}
function sortImklLayerGroups(groups) {
	return (groups || []).map((group, index) => Object.assign({ sortIndex: index }, group))
		.sort((a, b) => imklLayerSortRank(a.layer) - imklLayerSortRank(b.layer) || a.sortIndex - b.sortIndex);
}
function styleForImklLayer(layer, index) {
	const fallback = imklLayerStyleSpec(layer, index);
	return feature => olStyleForImklSpec(feature && feature.get && feature.get("imkl:style") || fallback);
}
function olStyleForImklSpec(spec) {
	spec = spec || {};
	const color = spec.color || "#247ed6";
	const key = [
		color,
		spec.width || 2,
		spec.fillAlpha || "0.18",
		spec.pointRadius || 5,
		spec.dash && spec.dash.join("-") || ""
	].join("|");
	if(IMKL_STYLE_CACHE[key]) return IMKL_STYLE_CACHE[key];
	IMKL_STYLE_CACHE[key] = new ol.style.Style({
		fill: new ol.style.Fill({ color: rgbaFromHex(color, spec.fillAlpha || "0.18") }),
		stroke: new ol.style.Stroke({ color: color, width: spec.width || 2, lineDash: spec.dash || undefined }),
		image: new ol.style.Circle({
			radius: spec.pointRadius || 5,
			fill: new ol.style.Fill({ color: rgbaFromHex(color, "0.9") }),
			stroke: new ol.style.Stroke({ color: "white", width: 2 })
		})
	});
	return IMKL_STYLE_CACHE[key];
}
function parseImklDocument(text, doc, opts) {
	opts = opts || {};
	const started = Date.now();
	const scan = Gml.scan(text, { domain: "imkl", version: Imkl.versionFromText(text), onFeature: Imkl.scanFeature });
	const index = Gml.index(scan);
	const layers = Imkl.planLayers(index);
	const view = Gml.featureView(index);
	const summary = Gml.summaryView(index, layers);
	const type = scan.version ? "imkl/" + scan.version : "imkl";

	return {
		type: type,
		version: scan.version,
		root: view,
		view: view,
		summary: summary,
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
function documentIdentityFor(action) {
	const doc = action.vars(["instance"]);
	const resource = action.vars(["resource"]);
	return js.get("uri", resource) ||
		js.get("resource_.uri", doc) ||
		js.get("_values.resource_.uri", doc) ||
		js.get("id", doc) ||
		js.get("_values.id", doc) ||
		js.get("ID", doc) ||
		js.get("uuid", doc) ||
		js.get("naam", doc) ||
		js.get("_values.naam", doc) ||
		(doc && doc.getKey instanceof Function && doc.getKey()) ||
		(action.up(":root").hashCode && action.up(":root").hashCode()) ||
		"current";
}
function documentNameFor(action) {
	const doc = action.vars(["instance"]);
	const naam = js.get("_values.naam", doc);
	return naam || (doc && js.nameOf(doc)) || "IMKL document";
}
function documentUriFor(action) {
	const doc = action.vars(["instance"]);
	const resource = action.vars(["resource"]);
	return js.get("uri", resource) ||
		js.get("resource_.uri", doc) ||
		js.get("_values.resource_.uri", doc) ||
		js.get("naam", doc) ||
		js.get("_values.naam", doc) ||
		documentNameFor(action);
}
function documentMapInfoFor(action) {
	return {
		id: documentIdentityFor(action),
		uri: documentUriFor(action),
		name: documentNameFor(action),
		root: action.up("Tabs<Document>:root")
	};
}
function safeKeyPart(value) {
	return String(value || "layer").replace(/[^A-Za-z0-9_.+-]/g, "-");
}
function layerKeyForInfo(info) {
	return "extra-layers/document-imkl/" + (info.id || info.uri || info.name || "current");
}
function layerKeyFor(action, selector, layer) {
	const suffix = layer ? "/" + safeKeyPart(layer.key || layer.type || layer.name) : "";
	return layerKeyForInfo(documentMapInfoFor(action)) + "/" + selector + suffix;
}
function textLabelOfNode(node) {
	const text = node && node.getNode && node.getNode("text");
	const label = text && text.qs && text.qs(".label");
	return (label && (label.textContent || label.innerText) || "").trim();
}
function findDocumentLayerNode(OL, info) {
	if(info && info.node) return info.node;
	const root = OL && OL.udown && (OL.udown("#root-features") || OL.udown("#root-layers"));
	const infoKey = layerKeyForInfo(info);
	const identities = [info && info.id, info && info.uri].filter(Boolean);
	const names = identities.length ? [] : [info && info.name, info && info.uri].filter(Boolean);
	let found = null;
	let foundScore = -1;
	const visit = node => {
		if(!node || !node.getControls) return;
		const layer = node.vars && node.vars("layer");
		const document = layer && layer.document;
		const olLayer = node.vars && node.vars("ol");
		const label = textLabelOfNode(node).replace(/\s+\(\d+\)$/, "");
		const documentIdentities = [document && document.id, document && document.uri, document && document.key].filter(Boolean);
		const hasDocumentIdentity = identities.some(identity => documentIdentities.indexOf(identity) !== -1);
		let score = -1;
		if(olLayer) {
			node.getControls().forEach(visit);
			return;
		}
		if(layer && (layer.key === infoKey || layer.pathKey === infoKey)) score = 60;
		if(hasDocumentIdentity) score = Math.max(score, 40);
		if(names.indexOf(label) !== -1) score = Math.max(score, 80);
		if(score > foundScore) {
			found = node;
			foundScore = score;
		}
		node.getControls().forEach(visit);
	};
	visit(root);
	return found;
}
function imklLocale(key, fallback) {
	const value = locale(key);
	return value && value !== key && value !== "{" + key + "}" ? value : fallback;
}
function imklLayerName(layer, selector, fallback) {
	if(layer && layer.key === "imkl:all") {
		return imklLocale("-map.document-all", fallback || "Document (alles)");
	}
	if(layer && layer.type === "us-net-common:UtilityLink") {
		return imklLocale("-layer.utilitylink", fallback || "UtilityLink geometrie");
	}
	const localName = Gml.localName(layer && layer.type || "");
	if(localName) {
		return imklLocale("-layer." + localName, fallback || layer.name || localName);
	}
	return fallback || (layer && layer.name) || imklLocale("-map." + selector, "IMKL laag");
}
function removeLayerFromCollection(collection, layer) {
	if(!collection || !layer) return false;
	const items = collection.getArray instanceof Function ? collection.getArray().slice() : [];
	let removed = false;
	items.forEach(function(item) {
		if(item === layer) {
			collection.remove(layer);
			removed = true;
			return;
		}
		const children = item && item.getLayers instanceof Function ? item.getLayers() : null;
		if(children && removeLayerFromCollection(children, layer)) {
			removed = true;
		}
	});
	return removed;
}
function removeLayerFromMap(map, layer) {
	if(layer instanceof Array) {
		layer.forEach(item => removeLayerFromMap(map, item));
		return;
	}
	removeLayerFromCollection(map && map.getLayers instanceof Function ? map.getLayers() : null, layer);
}
function isAltEvent(evt) {
	return !!(evt && (
		evt.altKey === true ||
		evt.event && evt.event.altKey === true ||
		evt.browserEvent && evt.browserEvent.altKey === true ||
		evt.originalEvent && evt.originalEvent.altKey === true ||
		evt.hotkey && evt.hotkey.altKey === true
	));
}
function walkMapNodes(node, callback) {
	if(!node) return;
	callback(node);
	node.getControls && node.getControls().forEach(child => walkMapNodes(child, callback));
}
function findImklMapNode(OL, keys) {
	const root = OL && OL.udown && (OL.udown("#root-features") || OL.udown("#root-layers"));
	let found = null;
	keys = (keys || []).filter(Boolean);
	keys.some(key => {
		walkMapNodes(root, node => {
			if(found || !node.vars) return;
			const layer = node.vars("layer") || {};
			if(key === layer.key || key === layer.pathKey || key === layer.persistKey) {
				found = node;
			}
		});
		return !!found;
	});
	return found;
}
function extentOfImklMapNode(node) {
	const extent = ol.extent.createEmpty();
	let found = false;
	walkMapNodes(node, current => {
		const config = current.vars && current.vars("layer") || {};
		const layer = current.vars && current.vars("ol");
		const source = config.source || layer && layer.getSource && layer.getSource();
		if(source instanceof ol.source.Vector) {
			const sourceExtent = source.getExtent();
			if(sourceExtent && sourceExtent.every(isFinite)) {
				ol.extent.extend(extent, sourceExtent);
				found = true;
			}
		}
	});
	return found ? extent : null;
}
function activateImklMapSection(action, OL) {
	const home = action.up("Home<>:root") || OL && OL.up && OL.up("Home<>:root") ||
		action.app().qs("Home<Onderzoek>:root") || action.app().qs("Home<>:root");
	const node = home && home.qs && home.qs("#node_geoview");
	const tree = home && home.qs && home.qs("#tree");
	if(node) {
		node.makeVisible && node.makeVisible();
		tree && tree.setSelection && tree.setSelection([node]);
		node.scrollIntoView && node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
	}
}
function focusImklMapNode(action, OL, keys) {
	activateImklMapSection(action, OL);
	const node = findImklMapNode(OL, keys);
	const map = OL && OL.vars && OL.vars("map");
	if(!node || !map) return;
	node.makeVisible && node.makeVisible();
	const tree = node.getTree && node.getTree();
	tree && tree.setSelection && tree.setSelection([node]);
	node.scrollIntoView && node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
	const extent = extentOfImklMapNode(node);
	if(extent) {
		map.getView().fit(extent, {
			padding: [48, 48, 48, 320],
			maxZoom: 18,
			duration: 350
		});
	}
}
function layerByKey(result, key) {
	return (js.get("imkl.layers", result) || []).filter(layer => layer.key === key)[0];
}
function syncImklLayerSelect(select) {
	// Backward compatible cleanup for live VCL reloads that still contain the removed select node.
	select && select.setVisible instanceof Function && select.setVisible(false);
	return [];
}
function layersBySelector(result, selector) {
	const layers = js.get("imkl.layers", result) || [];
	if(selector === "all") {
		return layers.filter(layer => layer.kind !== "document");
	}
	if(selector === "domain") {
		return layers.filter(layer => layer.kind === "domain");
	}
	if(selector === "utilitylink") {
		return layers.filter(layer => layer.type === "us-net-common:UtilityLink");
	}
	if(selector === "annotation") {
		return layers.filter(layer => ["Annotatie"].indexOf(Gml.localName(layer.type)) !== -1);
	}
	if(selector === "measurement") {
		return layers.filter(layer => ["Maatvoering", "DiepteTovMaaiveld"].indexOf(Gml.localName(layer.type)) !== -1);
	}
	if(selector === "topography") {
		return layers.filter(layer => ["EigenTopografie"].indexOf(Gml.localName(layer.type)) !== -1);
	}
	if(selector === "extra") {
		return layers.filter(layer => ["ExtraGeometrie", "ExtraDetailinfo", "AanduidingEisVoorzorgsmaatregel"].indexOf(Gml.localName(layer.type)) !== -1);
	}
	if(selector === "polygon") {
		return layers.filter(layer => ["Orientatiepolygoon", "Graafpolygoon"].indexOf(Gml.localName(layer.type)) !== -1);
	}
	return layerByKey(result, selector) ? [layerByKey(result, selector)] : [];
}
function selectedGeometryFeatures(result, selector) {
	const index = js.get("imkl.index", result);
	const layers = layersBySelector(result, selector);
	const byId = {};
	let features = [];
	if(!index || !layers.length) return [];
	layers.forEach(layer => {
		Imkl.layerFeatures(index, layer).forEach(feature => {
			const geometryFeatures = layer.mode === "referenced" ?
				Gml.reachableGeometryFeatures(index, feature) : [feature];
			geometryFeatures.forEach(geometryFeature => {
				const key = geometryFeature.id || geometryFeature.index;
				if(!byId[key]) {
					byId[key] = true;
					features.push({ feature: feature, geometryFeature: geometryFeature, layer: layer });
				}
			});
		});
	});
	return features;
}
function groupEntriesByLayer(entries) {
	const groups = [];
	const byKey = {};
	entries.forEach(entry => {
		const key = entry.layer && (entry.layer.key || entry.layer.type || entry.layer.name) || "layer";
		if(!byKey[key]) {
			byKey[key] = {
				key: key,
				layer: entry.layer,
				entries: []
			};
			groups.push(byKey[key]);
		}
		byKey[key].entries.push(entry);
	});
	return groups;
}
function createOlFeaturesForEntry(text, entry, index, targetProjection, styleIndex) {
	const fragment = Gml.featureFragment(text, entry.geometryFeature);
	const geometries = Gml.geometriesFromText(fragment);
	return geometries
		.map(geometry => olGeometryFromGmlGeometry(geometry, targetProjection))
		.filter(Boolean)
		.map(geometry => {
			const feature = new ol.Feature({ geometry: geometry });
			const name = entry.feature.id || entry.geometryFeature.id || entry.layer.name;
			feature.set("name", name);
			feature.set("hint", js.sf("<b>%H</b><br><span class='muted'>%H</span>", name, entry.layer.name));
			feature.set("imkl:feature", Gml.featureSummary(entry.feature));
			feature.set("imkl:geometryFeature", Gml.featureSummary(entry.geometryFeature));
			feature.set("imkl:style", Imkl.styleForEntry instanceof Function ?
				Imkl.styleForEntry(entry, entry.layer, styleIndex) : imklLayerStyleSpec(entry.layer, styleIndex));
			return feature;
		});
}
function addFeaturesInBatches(action, source, entries, createFeatures, opts) {
	opts = opts || {};
	const batchSize = opts.batchSize || IMKL_BATCH_SIZE;
	const timeoutKey = opts.timeoutKey || "imkl-add-features";
	let index = 0;
	let added = 0;
	const schedule = fn => action.setTimeout instanceof Function ?
		action.setTimeout(timeoutKey, fn, 0) : setTimeout(fn, 0);
	return new Promise(resolve => {
		const step = () => {
			const features = [];
			const end = Math.min(index + batchSize, entries.length);
			for(; index < end; index++) {
				features.push.apply(features, createFeatures(entries[index]));
			}
			if(features.length) {
				source.addFeatures(features);
				added += features.length;
			}
			if(index < entries.length) {
				schedule(step);
			} else {
				resolve(added);
			}
		};
		step();
	});
}
function imklLayerNeededEvent(info, parent, entry) {
	return {
		parent: parent,
		layer: {
			key: entry.key,
			name: entry.name,
			layer: entry.layer,
			source: entry.source,
			count: entry.count,
			style: entry.style,
			legend: entry.legend,
			runtime: true,
			root: parent ? undefined : {
				key: "Documenten",
				name: imklLocale("-map.documents", "Documenten"),
				expanded: true,
				seperator: true
			},
			path: parent ? undefined : [{
				key: layerKeyForInfo(info),
				name: info.name || info.uri || "IMKL document",
				index: info.mapDocumentIndex,
				expanded: true,
				runtime: true,
				closeable: true,
				document: info
			}],
			document: info,
			closeable: false,
			checked: entry.checked
		}
	};
}
function addImklSelectionToMap(OL, action, selector, label) {
	const map = OL.vars("map");
	const result = action.vars(["parser-document-result"]);
	const text = result && result.text;
	const index = js.get("imkl.index", result);
	if(!map || !text || !index) return Promise.resolve(false);

	const entries = selectedGeometryFeatures(result, selector);
	if(!entries.length) return Promise.resolve(false);

	const targetProjection = map.getView && map.getView().getProjection &&
		map.getView().getProjection().getCode && map.getView().getProjection().getCode() || DEFAULT_TARGET_PROJECTION;
	const info = documentMapInfoFor(action);
	const parent = findDocumentLayerNode(OL, info);
	const mapEntries = sortImklLayerGroups(groupEntriesByLayer(entries)).map((group, groupIndex) => {
		const source = new ol.source.Vector();
		const layerName = imklLayerName(group.layer, selector);
		const style = styleForImklLayer(group.layer, groupIndex);
		const color = colorForImklLayer(group.layer, groupIndex);
		const hasPoints = imklLayerHasPoints(group.layer);
		const checked = !hasPoints;
		const layer = ol.create(["ol:layer.Vector", {
			name: layerName,
			source: source,
			style: style
		}]);
		const key = layerKeyFor(action, selector, group.layer);
		removeLayerFromMap(map, map.get(key));
		layer.set("document", info);
		return {
			key: key,
			name: layerName,
			layer: layer,
			style: style,
			legend: [{
				color: rgbaFromHex(color, "0.25"),
				borderColor: color,
				title: layerName,
				radius: hasPoints ? "9px" : "0"
			}],
			checked: checked,
			source: source,
			entries: group.entries,
			styleIndex: groupIndex,
			count: group.entries.length
		};
	});
	removeLayerFromMap(map, map.get(layerKeyFor(action, selector)));
	const layerNeeded = OL.ud && OL.ud("#ol-layer-needed");
	if(layerNeeded) {
		const events = mapEntries.map(entry => imklLayerNeededEvent(info, parent, entry));
		layerNeeded.execute(events.length === 1 ? events[0] : { layers: events });
	} else {
		mapEntries.forEach(entry => map.addLayer(entry.layer));
	}
	mapEntries.forEach(entry => map.set(entry.key, entry.layer));
	map.set(layerKeyFor(action, selector), mapEntries.map(entry => entry.layer));
	action.app().toast({ content: js.sf("%H wordt geladen (%d features)", label || documentNameFor(action), entries.length), classes: "fade glassy" });
	return Promise.all(mapEntries.map(entry =>
		addFeaturesInBatches(action, entry.source, entry.entries, item =>
			createOlFeaturesForEntry(text, item, index, targetProjection, entry.styleIndex), {
				timeoutKey: "imkl-add-features-" + safeKeyPart(entry.key)
			}
		).then(added => {
			entry.source.changed();
			return added;
		})
	)).then(counts => ({
		added: counts.reduce((sum, count) => sum + count, 0),
		keys: mapEntries.length === 1 ? [mapEntries[0].key] : [layerKeyForInfo(info)]
	}));
}
function showImklOnMap(action, selector, label, evt) {
	const menubar = action.ud("#menubar");
	const OL = menubar.udr("OpenLayers<Onderzoek>:root");
	if(!OL) {
		if(!isAltEvent(evt)) {
			activateImklMapSection(action);
		}
		action.app().toast({ content: imklLocale("-map.open-section", "Open eerst de Kaart-sectie."), classes: "fade glassy" });
		return;
	}
	try {
		return addImklSelectionToMap(OL, action, selector, label).then(result => {
			if(!result || !result.added) {
				action.app().toast({ content: imklLocale("-map.no-geometries", "Geen IMKL geometrie gevonden."), classes: "fade glassy" });
				return;
			}
			if(!isAltEvent(evt)) {
				focusImklMapNode(action, OL, result.keys);
			}
			action.app().toast({ content: js.sf(imklLocale("-map.loaded", "%H geladen"), label || documentUriFor(action)) + js.sf(" (%d features)", result.added), classes: "fade glassy" });
		});
	} catch(e) {
		action.print(e);
		action.app().toast({ content: "IMKL kon niet op de kaart worden gezet.", classes: "fade glassy" });
	}
}
function syncImklMapActions(action) {
	[
		"show-imkl-document-on-map",
		"show-imkl-domain-on-map",
		"show-imkl-polygon-on-map",
		"show-imkl-annotation-on-map",
		"show-imkl-measurement-on-map",
		"show-imkl-topography-on-map",
		"show-imkl-extra-on-map",
		"show-imkl-utilitylink-on-map"
	].forEach(name => {
		const component = action.ud("#" + name);
		component && component.setVisible(true);
	});
}
function refreshDocumentActions(action) {
	const documentActions = action.ud("#document-actions");
	if(documentActions) {
		documentActions.render instanceof Function && documentActions.render();
		documentActions.update instanceof Function && documentActions.update();
	}
}
function activateImklFacet(action) {
	const root = action.up("Tabs<Document>:root") || action.up(":root");
	const toggleSource = action.ud("#toggle-source");
	const showOnMap = action.ud("#show-on-map");
	root.vars("document.facet", "imkl");
	root.vars("document.parse", parseImklDocument);
	root.vars("document.getSpecificFacet", null);
	root.vars("document.applySpecificFacet", null);
	root.vars("parser-document-type", root.vars(["parser-document-type"]) || "imkl");
	if(toggleSource) {
		toggleSource.setContent("<i class='fa fa-file-code-o'></i> <b>imkl</b>");
	}
	showOnMap && showOnMap.setVisible(true);
	syncImklMapActions(action);
	refreshDocumentActions(action);
}

[["./Tabs<Document.xml>"], {
	vars: {
		document: {
			"activate-facet": activateImklFacet,
			facet: "imkl",
			parse: parseImklDocument,
			getSpecificFacet: null,
			applySpecificFacet: null
		}
	}
}, [
	["#group-imkl-layer", {
		onLoad() { this.destroy(); }
	}],
	["#select-imkl-layer", {
		onLoad() { this.destroy(); }
	}],
	["#show-imkl-selected-layer-on-map", {
		visible: false,
		onLoad() { this.destroy(); }
	}],
	["vcl/Action", ("show-on-map"), {
		content: "<i class='fa fa-map-marker'></i><i class='fa fa-caret-down'></i>",
		visible: false
	}],
	["#document-actions", [
		["vcl/ui/PopupButton", ("button-show-on-map"), {
			content: "<i class='fa fa-map-marker'></i><i class='fa fa-caret-down'></i>",
			classes: "map",
			popup: "popup-show-on-map-imkl",
			origin: "bottom-right",
			attributes: { title: "Toevoegen aan kaart" }
		}]
	]],
	["vcl/Action", ("show-imkl-document-on-map"), {
		content: imklLocale("-map.document-all", "Document (alles)"),
		vars: { document: { action: { batch: true } } },
		on(evt) { return showImklOnMap(this, "all", imklLocale("-map.document-all", "Document (alles)"), evt); }
	}],
	["vcl/Action", ("show-imkl-domain-on-map"), {
		content: imklLocale("-map.domain", "Netobjecten"),
		vars: { document: { action: { batch: true } } },
		on(evt) { return showImklOnMap(this, "domain", imklLocale("-map.domain", "Netobjecten"), evt); }
	}],
	["vcl/Action", ("show-imkl-utilitylink-on-map"), {
		content: imklLocale("-map.utilitylink", "UtilityLink geometrie"),
		vars: { document: { action: { batch: true } } },
		on(evt) { return showImklOnMap(this, "utilitylink", imklLocale("-map.utilitylink", "UtilityLink geometrie"), evt); }
	}],
	["vcl/Action", ("show-imkl-polygon-on-map"), {
		content: imklLocale("-map.polygon", "Aanvraagpolygoon"),
		on(evt) { return showImklOnMap(this, "polygon", imklLocale("-map.polygon", "Aanvraagpolygoon"), evt); }
	}],
	["vcl/Action", ("show-imkl-annotation-on-map"), {
		content: imklLocale("-map.annotation", "Annotaties"),
		vars: { document: { action: { batch: true } } },
		on(evt) { return showImklOnMap(this, "annotation", imklLocale("-map.annotation", "Annotaties"), evt); }
	}],
	["vcl/Action", ("show-imkl-measurement-on-map"), {
		content: imklLocale("-map.measurement", "Maatvoering"),
		vars: { document: { action: { batch: true } } },
		on(evt) { return showImklOnMap(this, "measurement", imklLocale("-map.measurement", "Maatvoering"), evt); }
	}],
	["vcl/Action", ("show-imkl-topography-on-map"), {
		content: imklLocale("-map.topography", "Topografie"),
		vars: { document: { action: { batch: true } } },
		on(evt) { return showImklOnMap(this, "topography", imklLocale("-map.topography", "Topografie"), evt); }
	}],
	["vcl/Action", ("show-imkl-extra-on-map"), {
		content: imklLocale("-map.extra", "Extra/detail geometrie"),
		vars: { document: { action: { batch: true } } },
		on(evt) { return showImklOnMap(this, "extra", imklLocale("-map.extra", "Extra/detail geometrie"), evt); }
	}],
	["vcl/ui/Popup", ("popup-show-on-map-imkl"), {}, [
		["vcl/ui/Element", { classes: "header", content: "<b>" + imklLocale("-map.add", "Toevoegen aan kaart") + "</b>" }],
		["vcl/ui/Button", { action: "show-imkl-document-on-map" }],
		["vcl/ui/Button", { action: "show-imkl-domain-on-map" }],
		["vcl/ui/Button", { action: "show-imkl-polygon-on-map" }],
		["vcl/ui/Button", { action: "show-imkl-annotation-on-map" }],
		["vcl/ui/Button", { action: "show-imkl-measurement-on-map" }],
		["vcl/ui/Button", { action: "show-imkl-topography-on-map" }],
		["vcl/ui/Button", { action: "show-imkl-extra-on-map" }],
		["vcl/ui/Button", { action: "show-imkl-utilitylink-on-map" }]
	]]
]];
