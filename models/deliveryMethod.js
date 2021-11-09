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
});

exports.DeliveryMethod = mongoose.model("DeliveryMethod", deliveryMethodSchema);
