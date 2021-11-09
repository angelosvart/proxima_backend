const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
	created: {
		type: Date,
		default: Date.now,
	},
	isDelivered: {
		type: Boolean,
		default: false,
	},
	delivered: {
		type: Date,
		default: "",
	},
	deliveryMethod: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "DeliveryMethod",
		required: true,
	},
	deliveryAddress: {
		type: String,
		default: "",
	},
	paymentMethod: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "PaymentMethod",
		required: true,
	},
	products: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
	],
	subtotalPrice: {
		type: Number,
		required: true,
	},
	deliveryFee: {
		type: Number,
		required: true,
	},
	totalPrice: {
		type: Number,
		required: true,
	},
	isPaid: {
		type: Boolean,
		default: false,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
});

exports.Order = mongoose.model("Order", orderSchema);
