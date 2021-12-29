const mongoose = require("mongoose");

const storeSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	contactName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	phone: {
		type: Number,
		required: true,
	},
	address: {
		type: String,
		required: true,
	},
	postCode: {
		type: Number,
		required: true,
	},
	city: {
		type: String,
		default: "",
	},
	password: {
		type: String,
		required: true,
	},
	postCodesServing: [
		{
			type: Number,
			required: true,
		},
	],
});

exports.Store = mongoose.model("Store", storeSchema);
exports.storeSchema = storeSchema;
