define(function(require) {

	return {
		Document: require("./Document"),
		nameOf: require("./js/nameOf/methods"),
		parse(doc) {
			return doc;
		}
	};

});
