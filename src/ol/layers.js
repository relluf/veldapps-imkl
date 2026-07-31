define(function(require) {
	const ol = require("ol");
	const proj4 = require("proj4");
	const Gml = require("veldapps-xml/gml");
	const Imkl = require("veldapps-imkl/gml");
	require("veldapps-ol/proj/RD");

	const DEFAULT_TARGET_PROJECTION = "EPSG:28992";
	const IMKL_BATCH_SIZE = 1000;
	const IMKL_LAYER_COLORS = [
		"#247ed6", "#38bdf8", "#14b8a6", "#22c55e", "#84cc16", "#f59e0b",
		"#f97316", "#ef4444", "#ec4899", "#a855f7", "#6366f1", "#64748b"
	];
	const IMKL_STYLE_CACHE = {};
	const LABELS = {
		"us-net-common:UtilityLink": "UtilityLink geometrie",
		Elektriciteitskabel: "Elektriciteitskabel",
		Telecommunicatiekabel: "Telecommunicatiekabel",
		OlieGasChemicalienPijpleiding: "Olie/gas/chemicalien pijpleiding",
		Waterleiding: "Waterleiding",
		Rioolleiding: "Rioolleiding",
		WarmteTransportleiding: "Warmte-transportleiding",
		Maatvoering: "Maatvoering",
		DiepteTovMaaiveld: "Diepte t.o.v. maaiveld",
		Annotatie: "Annotaties",
		EigenTopografie: "Topografie",
		ExtraGeometrie: "Extra geometrie",
		ExtraDetailinfo: "Extra detailinfo",
		AanduidingEisVoorzorgsmaatregel: "Eis voorzorgsmaatregel",
		Appurtenance: "Appurtenance",
		Orientatiepolygoon: "Orientatiepolygoon",
		Graafpolygoon: "Graafpolygoon"
	};

	const contentToText = content => {
		if(typeof content === "string") return content;
		if(content instanceof ArrayBuffer) return new TextDecoder("utf-8").decode(content);
		if(ArrayBuffer.isView && ArrayBuffer.isView(content)) return new TextDecoder("utf-8").decode(content);
		return null;
	};
	const resourceTextOf = resource => resource && (
		contentToText(resource.text) ||
		contentToText(js.get("0.0.content", resource.contents)) ||
		contentToText(resource.content) ||
		""
	) || "";
	const epsgCodeOf = srsName => {
		const text = String(srsName || "");
		const match = text.match(/EPSG(?::|::|\/|#)(\d+)/i) || text.match(/^epsg:(\d+)$/i);
		return match ? "EPSG:" + match[1] : "";
	};
	const isWgs84Coordinate = coordinate => coordinate[0] >= 3 && coordinate[0] <= 8 && coordinate[1] >= 50 && coordinate[1] <= 54;
	const isWgs84AxisFlippedCoordinate = coordinate => coordinate[0] >= 50 && coordinate[0] <= 54 && coordinate[1] >= 3 && coordinate[1] <= 8;
	const normalizeWgs84Coordinate = coordinate => isWgs84AxisFlippedCoordinate(coordinate) ? [coordinate[1], coordinate[0]] : coordinate;
	const transformCoordinate = (coordinate, sourceProjection, targetProjection) => {
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
	};
	const transformCoordinates = (coordinates, sourceProjection, targetProjection) =>
		coordinates.map(coordinate => transformCoordinate(coordinate, sourceProjection, targetProjection));
	const transformRings = (rings, sourceProjection, targetProjection) =>
		rings.map(ring => transformCoordinates(ring, sourceProjection, targetProjection));
	const olGeometryFromGmlGeometry = (geometry, targetProjection) => {
		const sourceProjection = epsgCodeOf(geometry.srsName) || DEFAULT_TARGET_PROJECTION;
		if(geometry.type === "Point") return new ol.geom.Point(transformCoordinate(geometry.coordinates, sourceProjection, targetProjection));
		if(geometry.type === "LineString") return new ol.geom.LineString(transformCoordinates(geometry.coordinates, sourceProjection, targetProjection));
		if(geometry.type === "Polygon") return new ol.geom.Polygon(transformRings(geometry.coordinates, sourceProjection, targetProjection));
		if(geometry.type === "MultiPolygon") return new ol.geom.MultiPolygon(geometry.coordinates.map(rings => transformRings(rings, sourceProjection, targetProjection)));
		return null;
	};
	const rgbaFromHex = (hex, alpha) => {
		const match = String(hex || "").match(/^#?([0-9a-f]{6})$/i);
		if(!match) return hex;
		const value = match[1];
		return js.sf("rgba(%d, %d, %d, %s)",
			parseInt(value.substring(0, 2), 16),
			parseInt(value.substring(2, 4), 16),
			parseInt(value.substring(4, 6), 16),
			alpha);
	};
	const fallbackColorForLayer = (layer, index) => {
		if(index !== undefined && index !== null) return IMKL_LAYER_COLORS[Math.abs(index) % IMKL_LAYER_COLORS.length];
		const key = String(layer && (layer.type || layer.key || layer.name) || "");
		let hash = 0;
		for(let i = 0; i < key.length; i++) {
			hash = ((hash << 5) - hash) + key.charCodeAt(i);
			hash |= 0;
		}
		return IMKL_LAYER_COLORS[Math.abs(hash) % IMKL_LAYER_COLORS.length];
	};
	const layerStyleSpec = (layer, index) => Imkl.styleForLayer instanceof Function ?
		Imkl.styleForLayer(layer, index) : {
			key: Gml.localName(layer && layer.type || "") || "fallback",
			color: fallbackColorForLayer(layer, index),
			width: 2,
			fillAlpha: "0.18",
			pointRadius: 5,
			dash: null
		};
	const colorForLayer = (layer, index) => layerStyleSpec(layer, index).color;
	const layerHasPoints = layer => {
		const primitives = layer && layer.primitives || {};
		return !!(primitives.Point || primitives.MultiPoint);
	};
	const layerSortRank = layer => {
		const localName = Gml.localName(layer && layer.type || "");
		if(localName === "Graafpolygoon") return 0;
		return layerHasPoints(layer) ? 2 : 1;
	};
	const sortLayerGroups = groups => (groups || []).map((group, index) => Object.assign({ sortIndex: index }, group))
		.sort((a, b) => layerSortRank(a.layer) - layerSortRank(b.layer) || a.sortIndex - b.sortIndex);
	const styleForLayer = (layer, index) => {
		const fallback = layerStyleSpec(layer, index);
		return feature => styleForSpec(feature && feature.get && feature.get("imkl:style") || fallback);
	};
	const styleForSpec = spec => {
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
	};
	const layerName = layer => {
		if(layer && layer.type === "us-net-common:UtilityLink") return LABELS["us-net-common:UtilityLink"];
		const localName = Gml.localName(layer && layer.type || "");
		return LABELS[localName] || (layer && layer.name) || localName || "IMKL laag";
	};
	const safeKeyPart = value => String(value || "layer").replace(/[^A-Za-z0-9_.+-]/g, "-");
	const layerKeyForInfo = info => "extra-layers/document-imkl/" + (info && (info.id || info.uri || info.name) || "current");
	const layerKeyFor = (info, selector, layer) => {
		const suffix = layer ? "/" + safeKeyPart(layer.key || layer.type || layer.name) : "";
		return layerKeyForInfo(info) + "/" + selector + suffix;
	};
	const parseResource = resource => {
		const started = Date.now();
		const text = resourceTextOf(resource);
		const scan = Gml.scan(text, { domain: "imkl", version: Imkl.versionFromText(text), onFeature: Imkl.scanFeature });
		const index = Gml.index(scan);
		const layers = Imkl.planLayers(index);
		return {
			type: scan.version ? "imkl/" + scan.version : "imkl",
			version: scan.version,
			root: {},
			view: {},
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
	};
	const isResource = resource => {
		const text = resourceTextOf(resource);
		return !!(text && Imkl.isText(text.slice(0, 65536)));
	};
	const isMapResult = parsed => !!(parsed && (parsed.capabilities && parsed.capabilities.imkl || /^imkl(?:\/|$)/.test(parsed.type || "")));
	const layerEntries = parsed => {
		const index = js.get("imkl.index", parsed);
		const layers = (js.get("imkl.layers", parsed) || []).filter(layer => layer.kind !== "document");
		const byId = {};
		let entries = [];
		if(!index) return [];
		layers.forEach(layer => {
			Imkl.layerFeatures(index, layer).forEach(feature => {
				const geometryFeatures = layer.mode === "referenced" ?
					Gml.reachableGeometryFeatures(index, feature) : [feature];
				geometryFeatures.forEach(geometryFeature => {
					const key = geometryFeature.id || geometryFeature.index;
					if(!byId[key]) {
						byId[key] = true;
						entries.push({ feature: feature, geometryFeature: geometryFeature, layer: layer });
					}
				});
			});
		});
		return entries;
	};
	const groupEntriesByLayer = entries => {
		const groups = [];
		const byKey = {};
		entries.forEach(entry => {
			const key = entry.layer && (entry.layer.key || entry.layer.type || entry.layer.name) || "layer";
			if(!byKey[key]) {
				byKey[key] = { key: key, layer: entry.layer, entries: [] };
				groups.push(byKey[key]);
			}
			byKey[key].entries.push(entry);
		});
		return groups;
	};
	const createFeaturesForEntry = (text, entry, targetProjection, styleIndex) => {
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
					Imkl.styleForEntry(entry, entry.layer, styleIndex) : layerStyleSpec(entry.layer, styleIndex));
				return feature;
			});
	};
	const addFeaturesInBatches = (component, source, entries, createFeatures, opts) => {
		opts = opts || {};
		const batchSize = opts.batchSize || IMKL_BATCH_SIZE;
		const timeoutKey = opts.timeoutKey || "imkl-add-features";
		let index = 0;
		let added = 0;
		const schedule = fn => component && component.setTimeout instanceof Function ?
			component.setTimeout(timeoutKey, fn, 0) : setTimeout(fn, 0);
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
	};
	const textLabelOfNode = node => {
		const text = node && node.getNode && node.getNode("text");
		const label = text && text.qs && text.qs(".label");
		return (label && (label.textContent || label.innerText) || "").trim();
	};
	const findDocumentLayerNode = (OL, info) => {
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
	};
	const layerEvent = (info, parent, entry) => ({
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
			root: parent ? undefined : { key: "Documenten", name: "Documenten", expanded: true, seperator: true },
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
	});
	const addToMap = (OL, resource, parsed, opts) => {
		opts = opts || {};
		const map = OL && OL.vars && OL.vars("map");
		const layerNeeded = OL && OL.ud && OL.ud("#ol-layer-needed");
		const text = parsed && parsed.text || resourceTextOf(resource);
		if(!map || !layerNeeded || !parsed || !text) return Promise.resolve(0);

		const targetProjection = map.getView && map.getView().getProjection &&
			map.getView().getProjection().getCode && map.getView().getProjection().getCode() || DEFAULT_TARGET_PROJECTION;
		const info = {
			id: resource && (resource.id || resource.uri || resource.name),
			uri: resource && (resource.uri || resource.id || resource.name),
			name: resource && (resource.name || resource.uri || resource.id) || "IMKL document",
			mapDocumentIndex: resource && resource.mapDocumentIndex
		};
		const entries = layerEntries(parsed);
		const parent = findDocumentLayerNode(OL, info);
		const mapEntries = sortLayerGroups(groupEntriesByLayer(entries)).map((group, groupIndex) => {
			const source = new ol.source.Vector();
			const name = layerName(group.layer);
			const style = styleForLayer(group.layer, groupIndex);
			const color = colorForLayer(group.layer, groupIndex);
			const hasPoints = layerHasPoints(group.layer);
			const layer = ol.create(["ol:layer.Vector", { name: name, source: source, style: style }]);
			const key = layerKeyFor(info, "all", group.layer);
			layer.set("document", info);
			return {
				key: key,
				name: name,
				layer: layer,
				style: style,
				legend: [{
					color: rgbaFromHex(color, "0.25"),
					borderColor: color,
					title: name,
					radius: hasPoints ? "9px" : "0"
				}],
				checked: !hasPoints,
				source: source,
				entries: group.entries,
				styleIndex: groupIndex,
				count: group.entries.length
			};
		});
		if(!mapEntries.length) return Promise.resolve(0);

		layerNeeded.execute(mapEntries.length === 1 ?
			layerEvent(info, parent, mapEntries[0]) :
			{ layers: mapEntries.map(entry => layerEvent(info, parent, entry)) });
		mapEntries.forEach(entry => map.set(entry.key, entry.layer));
		map.set(layerKeyFor(info, "all"), mapEntries.map(entry => entry.layer));
		return Promise.all(mapEntries.map(entry =>
			addFeaturesInBatches(OL, entry.source, entry.entries, item =>
				createFeaturesForEntry(text, item, targetProjection, entry.styleIndex), {
					timeoutKey: "imkl-add-features-" + safeKeyPart(entry.key)
				}
			).then(added => {
				entry.source.changed();
				return added;
			})
		)).then(counts => counts.reduce((sum, count) => sum + count, 0));
	};

	const Document = {
		addToMap: addToMap,
		isMapResult: isMapResult,
		isResource: isResource,
		parseResource: parseResource
	};
	return {
		Document: Document
	};
});
