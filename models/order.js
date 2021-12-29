const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

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
		default: null,
	},
	deliveryMethod: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "DeliveryMethod",
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	phone: {
		type: String,
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
			productId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
				required: true,
			},
			quantity: { type: Number, required: true },
			paidPrice: { type: Number, required: true },
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

orderSchema.plugin(AutoIncrement, {
	inc_field: "orderNumber",
});

exports.Order = mongoose.model("Order", orderSchema);
