const mongoose = require("mongoose");

const deliveryMethodSchema = mongoose.Schema({
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

exports.DeliveryMethod = mongoose.model("DeliveryMethod", deliveryMethodSchema);
