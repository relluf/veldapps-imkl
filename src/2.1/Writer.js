define(function(require) {
	
	var WritersMap = {
		'2.1': require("imkl/2.1/Writers")
	};
	var CollectorsMap = {
		'2.1': require("imkl/2.1/Collectors")
	};

	function convertValue(value, type, f) {
		if(type === "xs:date" || type === "xs:time") {
			if(!(value instanceof Date)) value = new Date(value);
			
			value = new Date(value.toLocaleString("en-US", {timeZone: "Europe/Amsterdam"}));
		}
		if(type === "xs:date") {
			value = String.format("%d-%02d-%02d", value.getFullYear(), value.getMonth() + 1, value.getDate());
		} else if(type === "xs:time") {
			value = String.format("%02d:%02d:%02d", value.getHours(), value.getMinutes(), value.getSeconds());
		} else if(type === "xid") {
			value = value.xid;
		} else if(type === "boolean") {
			value = ("" + value);
		}
		if(typeof f === "function") {
			value = f(value);
		}
		return value;
	}

	return ({
		_vars: null,
		
		version: require("json!imkl/package").version,
		
		getVar: function(name) {
			var arr = this._vars[name];
			if(arr !== undefined) {
				return arr[arr.length - 1];
			}
			return undefined;
			//throw new Error("Variable " + name + " not pushed");
		},
		pushVar: function(name, value) {
			var arr = this._vars[name];
			if(arr === undefined) {
				arr = (this._vars[name] = []);
			}
			return arr.push(value);
		},
		popVar: function(name) {
			var arr = this._vars[name];
			if(arr !== undefined) {
				var r = arr.pop();
				if(arr.length === 0) {
					delete this._vars[name];
				}
				return r;
			}
			throw new Error("Variable " + name + " not pushed");
		},
		
		write: function write(collector, instance, context) {
			context = context || {};

			this._root = null;
			this._element = null;
			this._vars = {};

			var ROOT_ELEM = "Leveringsinfomatie", version = "2.1", start, root;
			var Writers = WritersMap[version];
			var Collectors = CollectorsMap[version];

			start = new Date();
			root = Collectors.collect(collector, instance, context);
			console.log(String.format("Collected in %d ms", Date.now() - start));

			start = new Date();
			this.element(ROOT_ELEM, root, Writers[ROOT_ELEM], Writers);
			console.log(String.format("Written in %d ms", Date.now() - start));

			return this._root;
		},

		attribute: function(name, value, type, f) {
			if(this._element === null) {
				throw new Error("No element");
			}
			if(value !== undefined && value !== "" && value !== null) {
				this._element.attributes[name] = convertValue(value, type, f);
			}
		},
		element: function(name, value, f, thisObj) {
			var current = this._element;

			var r = this._element = {
					name: name,
					attributes: {},
					childNodes: []
				};

			if(current !== null) {
				current.childNodes.push(r);
			} else {
				this._root = r;
			}

			if(value && typeof f === "function") {
				f.apply(thisObj, [this, value]);
			}

			this._element = current;

			if(Object.keys(r.attributes).length === 0) {
				delete r.attributes;
			}
			if(r.childNodes.length === 0) {
				delete r.childNodes;
			}

			return r;
		},
		comment: function(comment) {
			if(!this._element) {
				// FIXME
				throw new Error("Top level comment not supported (yet)");
			}

			this._element.childNodes.push({
				comment: comment
			});
		},
		elements: function(name, instances, f, thisObj) {
			if(typeof instances === "function") instances = instances(instances);
			
			if(instances instanceof Array) {
				instances.forEach(function(instance) {
					this.element(name, instance, f, thisObj);
				}, this);
			}
		},
		content_element: function(name, value, type, f) {
			if(value !== undefined && value !== "" && value !== null) {
				value = convertValue(value, type, f);
				this.element(name, value, function(writer, value) {
					writer.content(value);
				}, this);
			}
		},
		content: function(value) {
			this._element.childNodes.push(String.format("%s", value));
		},
		
		attribute_: function(name, instance, type, f) {
			var value = instance[name];
			this.attribute(name, value, type, f);
		},
		element_: function(name, instance, f, thisObj, occurs) {
			var value = instance[name];
			if(value) {
				this.element(name, value, f, thisObj);
			}
		},
		elements_: function(name, instance, f, thisObj, occurs) {
			var instances = instance[name];
			if(instances) {
				if(!(instances instanceof Array)) {
					console.log("WARNING: Converted non-array to array for: " + name);
					instances = [instances];
				}
				instances.forEach(function(instance) {
					this.element(name, instance, f, thisObj);
				}, this);
			}
		},
		content_element_: function(name, instance, type, size, f) {
			var value = instance[name];
			return this.content_element(name, value, type, size, f);
		},
		content_: function(value) {
			this.content(value);
		}
	});
	
});