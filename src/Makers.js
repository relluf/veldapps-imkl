define(function(require) {

	var Hash = require("util/Hash");
	
	// call Makers.init() to initialize these vars
	var Collectors;
	var Collectors_generated;

	function make(type, instance) {
		var f = Makers[type];
		if(!f && (type.indexOf("[") !== -1)) {
			return make(type.split("[")[0], instance);
		}
		if(f) {
			instance = f(instance);
		} else {
			var arr = (arguments.callee.log = (arguments.callee.log || []));
			if(arr.indexOf(type) === -1) {
				arr.push(type);
				// log(String.format("IGNORED %d: %s (not impl in bro/Makers.js)", arr.length, type));
			}
		}
// log("make: " + type + " >> " + JSON.stringify(instance));
		return instance;
	}
	function make_string(value) { 
		if(value === null || value === undefined) return null;

		return value; 
	}
	function make_integer(value) { 
		if(value === null || value === undefined) return null;

		return parseInt(value, 10);
	}
	function make_float(value) { 
		if(value === null || value === undefined) return null;

		return parseFloat(value);
	}
	function make_text(value) {
		if(value === null || value === undefined) return null;
		
		return { '#text' : "" + value };	
	}
	function make_xlink_href(value, hash) {
		if(value === null || value === undefined) return null;
		
		return { "xlink:href": (hash !== false ? "#" : "") + value };
	}
	function make_date(dt) {
		if(dt === null || dt === undefined) return null;
		
		if(!(dt instanceof Date)) {
			dt = new Date(dt.getTime ? dt.getTime() : dt);
		}

		return String.format("%d-%02d-%02d", dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
	}
	function make_datetime(dt) {
		if(dt === null || dt === undefined) return null;
		
		if(!(dt instanceof Date)) {
			dt = new Date(dt.getTime ? dt.getTime() : dt);
		}
		
		return dt.toISOString();				
	}

	function make_feature(instance, featureImpl, collectors, context) {
		if(instance === undefined || instance === null) return null;

		collectors = collectors || Collectors;

		if(typeof featureImpl === "string") {

/*- Makers overrules Collectors */

			var f = Makers[featureImpl];
			if(!f && (featureImpl.indexOf("[") !== -1)) {
				f = Makers[featureImpl.split("[")[0]];
			}
			if(f) {
				return f(instance, context);
			}

			if(typeof collectors === "object") {
				
				/* - When called like this Collectors (eg. this modules export) is 
					searched for the appropiate method. Otherwise featureImpl must 
					be a function */
					
				var name = featureImpl.split("[")[0];
				
				var mth = Makers[name] || collectors[name];
				if(!mth) {
/*- Makers overrules Collectors_generated */

					if((mth = Collectors_generated[name])) {
						collectors = Collectors_generated;
						// log("USING AUTOGEN'D make_feature: " + name);
					}
				}
	
				try {
					return mth && mth.apply(collectors, [instance, context]);
				} catch(e) {
					log("ERROR: " + Object.keys(e).map(function(k) { return js.sf("%s:%s", k, e[k]) }).join(" --- "));
					if(!mth) {
						log("CATCHED make_feature: " + featureImpl + " not available (" + e.message + ")");
					}
				}
			}
		}
		
		/*- Copy all kv-pairs of featureImpl, functions are evaluated */
		var feature = (function() {
			var r = {};
			for(var k in featureImpl) {
				var v = featureImpl[k];
				if(typeof v === "function") {
					try {
						v = v.apply(collectors, [instance]);
					} catch(e) {
						log(js.sf(">>> !!!! %s", v));
						throw e;
					}
					
				}
				if(v !== null) {
					// return null to ignore attribute
					r[k] = v;
				}
			}
			return r;
		}());
		
		return feature;
	}
	
	var Makers = {
		feature: make_feature,
		make: make,

		'xs:string': make_string,
		'xs:date': make_date,

		xlink_href: make_xlink_href,
		text: make_text,
		string: make_string,
		int: make_integer, integer: make_integer, 
			positiveInteger: make_integer,
		float: make_float,
		double: make_float,
		datetime: make_datetime,
		date: make_datetime,
		anyURI: make_string,
		
		init: function(collectors, generated) {
			Collectors = collectors;
			Collectors_generated = generated;
		}

	};
	
	return Makers;
	
});