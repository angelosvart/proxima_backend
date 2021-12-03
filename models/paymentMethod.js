const mongoose = require("mongoose");

const paymentMethodSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		required: true,
	},
	infoMessage: {
		type: String,
		default: "",
	},
});

exports.PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
