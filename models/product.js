const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
	image: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	brand: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	category: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Category",
		required: true,
	},
	subcategory: {
		type: String,
		required: true,
	},
	color: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
		min: 0,
	},
	offerPrice: {
		type: Number,
		min: 0,
	},
	isOffer: {
		type: Boolean,
		default: false,
	},
	isAvailable: {
		type: Boolean,
		required: true,
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Store",
		required: true,
	},
});

exports.Product = mongoose.model("Product", productSchema);
