const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	path: {
		type: String,
		required: true,
	},
	isFeatured: {
		type: Boolean,
		required: true,
	},
});

exports.Category = mongoose.model("Category", categorySchema);
