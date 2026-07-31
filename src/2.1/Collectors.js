define(function(require) { "use strict";

	var Collectors;
	var Collectors_generated = require("imkl/2.1/Collectors-generated");
	
	var Util = require("util/Util");
	var Hash = require("util/Hash");
	var Make = require("imkl/Makers");

	function formatDate(dt, fmt) {
		
// date = new Date(978328800000); new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));

		if(fmt === "YYYY-MM-DD") {
			/* GMT based */
			return dt.toISOString().split("T")[0];
		}
        var tz = dt.toTimeString().match(/GMT.\d\d\d\d/)[0].substring(3);
        return js.sf("%04d-%02d-%02dT%02d:%02d:%02d%s:%s", 
	        dt.getFullYear(), dt.getMonth() + 1, dt.getDate(),
	        dt.getHours(), dt.getMinutes(), dt.getSeconds(), 
	        tz.substring(0, 3), tz.substring(3));
	}

    return (Collectors = {
    	collect: function(collector, instance, context) {
    		return this[collector](instance, context);
    	},

	    'GI_V2->Leveringsinformatie': function (gml, context) {
	    }
    });
});