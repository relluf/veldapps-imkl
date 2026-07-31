define(function (require) {

	var RootAttributes = {
			'xmlns': "http://www.kadaster.nl/schemas/klic/leveringsinformatie/v20180418",
			'xmlns:xlink': "http://www.w3.org/1999/xlink",
			'xmlns:gml': "http://www.opengis.net/gml/3.2"
		};
	
    function w__imkl_Leveringsinformatie(writer, instance) {
		for(var k in RootAttributes) {
			writer.attribute(k, RootAttributes[k], "string");
		}
		
		// writer.comment(js.sf("veldapps-imkl@%s", require("json!imkl/package").version));
		
        writer.element_("version", instance, this['levi:VersionNumberType'], this, [1, 1]);
        writer.elements_("bijlagePerLevering", instance, this['levi:BijlageType'], this, [1, "unbounded"]);
        writer.element_("pngFormaat", instance, this['levi:PngFormaatType'], this, [0, 1]);
        writer.elements_("belanghebbende", instance, this['levi:Belanghebbende'], this, [0, "unbounded"]);
    }


    return {
    	'Leveringsinformatie': w__imkl_Leveringsinformatie,
        'levi:Leveringsinformatie': w__imkl_Leveringsinformatie,
/*- paste auto-gen'd code and remove duplicates below this line */
        /** not found: gml:BoundingShapeType*/
        'levi:BeheerdersinformatieType': function (writer, instance) {
            writer.element_("thema", instance, this['levi:WaardelijstWaardeRefType'], this, [1, 1]);
            writer.elements_("toezichthouder", instance, this['levi:ContactType'], this, [0, "unbounded"]);
            writer.content_element_("eisVoorzorgmaatregel", instance, "boolean");
            writer.elements_("themabijlagePerNetbeheerder", instance, this['levi:BijlageType'], this, [0, "unbounded"]);
        },
        'levi:BeheerdersinformatieVersie': function (writer, instance) {
            /* simpleContent */
            writer.content_(instance['#text'] || instance);
        },
        'levi:Belanghebbende': function (writer, instance) {
            writer.element_("bronhoudercode", instance, this['levi:Bronhoudercode'], this, [1, 1]);
            writer.element_("beheerdersinformatieVersie", instance, this['levi:BeheerdersinformatieVersie'], this, [1, 1]);
            writer.element_("netbeheerderContact", instance, this['levi:NetbeheerderContact'], this, [0, 1]);
            writer.elements_("bijlagePerNetbeheerder", instance, this['levi:BijlageType'], this, [0, "unbounded"]);
            writer.elements_("beheerdersinformatie", instance, this['levi:BeheerdersinformatieType'], this, [0, "unbounded"]);
        },
        'levi:BijlageAdres': function (writer, instance) {
            writer.content_element_("postcode", instance, "string");
            writer.content_element_("huisnummerLetterToev", instance, "string");
            writer.content_element_("BAGidAdresseerbaarObject", instance, "string");
        },
        'levi:BijlageType': function (writer, instance) {
            writer.element_("soortBijlage", instance, this['levi:SoortBijlage'], this, [1, 1]);
            writer.content_element_("bestandLocatie", instance, "anyURI");
            writer.element_("bestandMediaType", instance, this['levi:WaardelijstWaardeRefType'], this, [1, 1]);
            writer.content_element_("bestandIdentificator", instance, "anyURI");
            writer.element_("adres", instance, this['levi:BijlageAdres'], this, [0, 1]);
        },
        'levi:Bronhoudercode': function (writer, instance) {
            /* simpleContent */
            writer.content_(instance['#text'] || instance);
        },
        'levi:ContactType': function (writer, instance) {
            writer.content_element_("naam", instance, "string");
            writer.content_element_("telefoon", instance, "string");
            writer.element_("email", instance, this['levi:EmailType'], this, [0, 1]);
        },
        'levi:EmailType': function (writer, instance) {
            /* simpleContent */
            writer.content_(instance['#text'] || instance);
        },
        'levi:NetbeheerderContact': function (writer, instance) {
            writer.element_("contact", instance, this['levi:ContactType'], this, [0, 1]);
            writer.content_element_("storingsnummer", instance, "string");
            writer.content_element_("beschadigingsnummer", instance, "string");
        },
        'levi:PngFormaatType': function (writer, instance) {
            writer.content_element_("omsluitendeRechthoek", instance, "gml:BoundingShapeType");
            writer.content_element_("pixelsBreed", instance, "int");
            writer.content_element_("pixelsHoog", instance, "int");
        },
        'levi:SoortBijlage': function (writer, instance) {
            /* simpleContent */
            writer.content_(instance['#text'] || instance);
        },
        'levi:VersionNumberType': function (writer, instance) {
            /* simpleContent */
            writer.content_(instance['#text'] || instance);
        },
        'levi:WaardelijstWaardeRefType': function (writer, instance) {
            writer.attribute_("xlink:href", instance, "xlink:href");
        }
    };
});