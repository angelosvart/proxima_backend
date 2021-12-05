const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	lastName: {
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
		default: "",
	},
	address: {
		type: String,
		default: "",
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
	orders: {
		type: Array,
		default: [],
	},
});

userSchema.set("toJSON", {
	virtuals: true,
});

exports.User = mongoose.model("User", userSchema);
exports.userSchema = userSchema;
