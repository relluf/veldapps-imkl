"use strict";
define(function(require) {
	var Make = require("imkl/Makers");
	return ({
	    /** not found: gml:BoundingShapeType*/
	    'levi:BeheerdersinformatieType': function (instance, context) {
	        return Make.feature(instance, {
	            "thema": function (instance) {
	                /*- levi:WaardelijstWaardeRefType[1, 1] - Aanduiding van het type en de functie van een kabel of leiding (conform IMKL1.2, waardelijst: Thema). */
	                return Make.feature(instance.thema, "levi:WaardelijstWaardeRefType[1, 1]", this, context);
	            },
	            "toezichthouder": function (instance) {
	                /*- levi:ContactType[0, unbounded] - [Klic5] Lijst van toezichthouders van de netbeheerder voor dit thema. */
	                return Make.feature(instance.toezichthouder, "levi:ContactType[0, unbounded]", this, context);
	            },
	            "eisVoorzorgmaatregel": function (instance) {
	                /*- boolean[1, 1] - Indicator die aangeeft of er een eis/voorzorgmaatregel bij dit thema is gevoegd */
	                return Make.feature(instance.eisVoorzorgmaatregel, "boolean[1, 1]", this, context);
	            },
	            "themabijlagePerNetbeheerder": function (instance) {
	                /*- levi:BijlageType[0, unbounded] - Mogelijke themabijlagen per netbeheerder, zoals ligging, maatvoering, eisVoorzorgsmaatregel, huisaansluiting, etc. */
	                return Make.feature(instance.themabijlagePerNetbeheerder, "levi:BijlageType[0, unbounded]", this, context);
	            },
	        },
	        this, context);
	    },
	    'levi:BeheerdersinformatieVersie': function (instance, context) {
	        return Make.feature(instance, {
	            '#text': function (instance) {
	                return instance['#text'] || instance;
	                /* simpleContent.restriction.@_base = 'string' */
	            }
	        },
	        this, context);
	    },
	    'levi:Belanghebbende': function (instance, context) {
	        return Make.feature(instance, {
	            "bronhoudercode": function (instance) {
	                /*- levi:Bronhoudercode[1, 1] - Bronhoudercode van de beheerder [IMKL1.2]. */
	                return Make.feature(instance.bronhoudercode, "levi:Bronhoudercode[1, 1]", this, context);
	            },
	            "beheerdersinformatieVersie": function (instance) {
	                /*- levi:BeheerdersinformatieVersie[1, 1] - Versie van de beheerdersinformatie die van deze belanghebbende is opgenomen bij deze levering */
	                return Make.feature(instance.beheerdersinformatieVersie, "levi:BeheerdersinformatieVersie[1, 1]", this, context);
	            },
	            "netbeheerderContact": function (instance) {
	                /*- levi:NetbeheerderContact[0, 1] - [Klic5] Contactinformatie van de netbeheerder, mogelijk aangeleverd bij de beheerdersinformatie [BMKL1.2]. */
	                return Make.feature(instance.netbeheerderContact, "levi:NetbeheerderContact[0, 1]", this, context);
	            },
	            "bijlagePerNetbeheerder": function (instance) {
	                /*- levi:BijlageType[0, unbounded] - Mogelijke (algemene) bijlage per netbeheerder, zoals algemeen, nietBetrokken, eigenTopo, etc. */
	                return Make.feature(instance.bijlagePerNetbeheerder, "levi:BijlageType[0, unbounded]", this, context);
	            },
	            "beheerdersinformatie": function (instance) {
	                /*- levi:BeheerdersinformatieType[0, unbounded] - Overzicht van de geleverde beheerdersinformatie per netbeheerder / thema. */
	                return Make.feature(instance.beheerdersinformatie, "levi:BeheerdersinformatieType[0, unbounded]", this, context);
	            },
	        },
	        this, context);
	    },
	    'levi:BijlageAdres': function (instance, context) {
	        return Make.feature(instance, {
	            "postcode": function (instance) {
	                /*- string[1, 1] - De door TNT Post vastgestelde code behorende bij een bepaalde combinatie van een straatnaam en een huisnummer. */
	                return Make.string(instance.postcode);
	            },
	            "huisnummerLetterToev": function (instance) {
	                /*- string[1, 1] - Een door of namens het gemeentebestuur ten aanzien van een adresseerbaar object toegekende nummering, evt. aangevuld met huisletter en huisnummertoevoeging. */
	                return Make.string(instance.huisnummerLetterToev);
	            },
	            "BAGidAdresseerbaarObject": function (instance) {
	                /*- string[0, 1] - BAG identifier van het adresseerbaar object (Verblijfsobject, Ligplaats of Standplaats) waar een adres aan is toegekend zoals geregistreerd bij de BAG. */
	                return Make.string(instance.BAGidAdresseerbaarObject);
	            },
	        },
	        this, context);
	    },
	    'levi:BijlageType': function (instance, context) {
	        return Make.feature(instance, {
	            "soortBijlage": function (instance) {
	                /*- levi:SoortBijlage[1, 1] - De logische naam van een bijlage die door het Kadaster of de netbeheerder is aangeleverd,
	--- per levering ---
	--- per netbeheerder ---
	--- per netbeheerder / thema --- */
	                return Make.feature(instance.soortBijlage, "levi:SoortBijlage[1, 1]", this, context);
	            },
	            "bestandLocatie": function (instance) {
	                /*- anyURI[1, 1] - De bestandsnaam omvat ook de locatie van het bestand. */
	                return Make.feature(instance.bestandLocatie, "anyURI[1, 1]", this, context);
	            },
	            "bestandMediaType": function (instance) {
	                /*- levi:WaardelijstWaardeRefType[1, 1] - Media type van een bestand (conform IMKL1.2, waardelijst: BestandMediaTypeValue). */
	                return Make.feature(instance.bestandMediaType, "levi:WaardelijstWaardeRefType[1, 1]", this, context);
	            },
	            "bestandIdentificator": function (instance) {
	                /*- anyURI[1, 1] - Unieke identificator / bestandsnaam van een bijlage, beschreven via een URI. */
	                return Make.feature(instance.bestandIdentificator, "anyURI[1, 1]", this, context);
	            },
	            "adres": function (instance) {
	                /*- levi:BijlageAdres[0, 1] - Enkele kenmerkende gegevens van een adres bij een bijlage (m.n. huisaansluitschets). */
	                return Make.feature(instance.adres, "levi:BijlageAdres[0, 1]", this, context);
	            },
	        },
	        this, context);
	    },
	    'levi:Bronhoudercode': function (instance, context) {
	        return Make.feature(instance, {
	            '#text': function (instance) {
	                return instance['#text'] || instance;
	                /* simpleContent.restriction.@_base = 'string' */
	            }
	        },
	        this, context);
	    },
	    'levi:ContactType': function (instance, context) {
	        return Make.feature(instance, {
	            "naam": function (instance) {
	                /*- string[0, 1] - Naam van het contact */
	                return Make.string(instance.naam);
	            },
	            "telefoon": function (instance) {
	                /*- string[0, 1] - Telefoonnummer van het contact */
	                return Make.string(instance.telefoon);
	            },
	            "email": function (instance) {
	                /*- levi:EmailType[0, 1] - E-mailadres van het contact */
	                return Make.feature(instance.email, "levi:EmailType[0, 1]", this, context);
	            },
	        },
	        this, context);
	    },
	    'levi:EmailType': function (instance, context) {
	        return Make.feature(instance, {
	            '#text': function (instance) {
	                return instance['#text'] || instance;
	                /* simpleContent.restriction.@_base = 'string' */
	            }
	        },
	        this, context);
	    },
	    'levi:Leveringsinformatie': function (instance, context) {
	        return Make.feature(instance, {
	            "version": function (instance) {
	                /*- levi:VersionNumberType[1, 1] - Versie van het interface waarmee de leveringsinformatie wordt beschreven */
	                return Make.feature(instance.version, "levi:VersionNumberType[1, 1]", this, context);
	            },
	            "bijlagePerLevering": function (instance) {
	                /*- levi:BijlageType[1, unbounded] - Mogelijke bijlage per levering, zoals leveringsbrief, achtergrondkaart, geselecteerd gebied. */
	                return Make.feature(instance.bijlagePerLevering, "levi:BijlageType[1, unbounded]", this, context);
	            },
	            "pngFormaat": function (instance) {
	                /*- levi:PngFormaatType[0, 1] - [Klic5] Formaat waaraan de geleverde png-bestanden met gebiedsinformatie (kaarten) moeten voldoen. */
	                return Make.feature(instance.pngFormaat, "levi:PngFormaatType[0, 1]", this, context);
	            },
	            "belanghebbende": function (instance) {
	                /*- levi:Belanghebbende[0, unbounded] - Verwijzing naar belanghebbende netbeheerders (bronhouders) binnen het aangevraagde gebied. */
	                return Make.feature(instance.belanghebbende, "levi:Belanghebbende[0, unbounded]", this, context);
	            },
	        },
	        this, context);
	    },
	    'levi:NetbeheerderContact': function (instance, context) {
	        return Make.feature(instance, {
	            "contact": function (instance) {
	                /*- levi:ContactType[0, 1] - [Klic5] Contactpersoon van de netbeheerder afkomstig uit de beheerdersinformatie. */
	                return Make.feature(instance.contact, "levi:ContactType[0, 1]", this, context);
	            },
	            "storingsnummer": function (instance) {
	                /*- string[0, 1] - [Klic5] Algemeen storingsnummer van de netbeheerder dan wel een bepaalde groep van netbeheerders. */
	                return Make.string(instance.storingsnummer);
	            },
	            "beschadigingsnummer": function (instance) {
	                /*- string[0, 1] - [Klic5] Nummer van de netbeheerder dat gebeld moet worden indien er sprake is van schade, zonder dat de levering is onderbroken. */
	                return Make.string(instance.beschadigingsnummer);
	            },
	        },
	        this, context);
	    },
	    'levi:PngFormaatType': function (instance, context) {
	        return Make.feature(instance, {
	            "omsluitendeRechthoek": function (instance) {
	                /*- gml:BoundingShapeType[1, 1] - Rechthoek (GML definitie) die de getekende polygoon omsluit. Bepaalt het gebied waarover de png-kaarten moeten worden geleverd. */
	                return Make.feature(instance.omsluitendeRechthoek, "gml:BoundingShapeType[1, 1]", this, context);
	            },
	            "pixelsBreed": function (instance) {
	                /*- int[1, 1] - Geeft de breedte (in pixels) aan van de op te leveren png kaarten (BMKL1.2). */
	                return Make.feature(instance.pixelsBreed, "int[1, 1]", this, context);
	            },
	            "pixelsHoog": function (instance) {
	                /*- int[1, 1] - Geeft de hoogte (in pixels) aan van de op te leveren png kaarten (BMKL1.2). */
	                return Make.feature(instance.pixelsHoog, "int[1, 1]", this, context);
	            },
	        },
	        this, context);
	    },
	    'levi:SoortBijlage': function (instance, context) {
	        return Make.feature(instance, {
	            '#text': function (instance) {
	                return instance['#text'] || instance;
	                /* simpleContent.restriction.@_base = 'string' */
	            }
	        },
	        this, context);
	    },
	    'levi:VersionNumberType': function (instance, context) {
	        return Make.feature(instance, {
	            '#text': function (instance) {
	                return instance['#text'] || instance;
	                /* simpleContent.restriction.@_base = 'string' */
	            }
	        },
	        this, context);
	    },
	    'levi:WaardelijstWaardeRefType': function (instance, context) {
	        return Make.feature(instance, {
	            "xlink:href": function (instance) {
	                /*- xlink:href[1, 1] - no annotation */
	                return Make.feature(instance['xlink:href'], "xlink:href[1, 1]", this, context);
	            },
	        },
	        this, context);
	    }
	});
});
