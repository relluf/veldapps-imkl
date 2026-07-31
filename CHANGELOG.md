# `2026/07/31` IMKL scanning, map layers and 2.1 code generation

## IMKL document pipeline

* Adds `gml.js` for recognizing IMKL documents, detecting schema versions and planning direct, referenced and document-wide GML layers.
* Adds feature-level style hints for utility themes, pressure and voltage classes, house connections, uncertain locations, above-ground assets and helper geometries.
* Adds `ol/layers.js` for converting scanned GML features to OpenLayers geometries, transforming WGS84/RD coordinates and loading large documents in batches.
* Adds stable document-layer keys, grouped map-tree entries, feature counts, legends and reusable layer selection for domain and helper objects.
* Adds the package-owned `Tabs<Document.imkl>` specialization with summary/view data and map actions for all geometry, network objects, UtilityLinks, polygons, annotations, dimensions, topography and extra/detail geometry.

## IMKL 2.1 schemas and generators

* Adds the `Leveringsinformatie-2.1.xsd` schema and versioned `src/2.1` collector/writer modules.
* Adds `Makers.js` for converting application values and collected features into schema-shaped values.
* Adds a generic XML writer with namespace-aware attributes, elements, cardinalities, primitive conversion and scoped writer variables.
* Adds generated writer definitions and collector scaffolding for IMKL 2.1 Leveringsinformatie documents.
* Adds reusable collector and writer generators plus version-specific devtools entry scripts under `tools/2.1`.

## Maintenance and documentation

* Disables the incomplete `imkl:Bijlage` naming override so generic object naming remains available.
* Removes the obsolete Geonovum concept-library HTML dump from `tools/.js`.
* Documents the 2.1 generation workflow, the current high-volume scan performance and the remaining PMKL symbol, line, annotation, draw-order and legend gaps.

# `2022/05/03`

* Hiya!
* Setting up xmlgen code for 2.1

### 2020-11-03

- Initial coding
