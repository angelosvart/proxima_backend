const { PaymentMethod } = require("../models/paymentMethod");
const express = require("express");
const router = express.Router();

//Get payment methods
router.get("/", async (req, res) => {
	const paymentMethodList = await PaymentMethod.find();

	if (!paymentMethodList) {
		res.status(500).json({
			success: false,
		});
	}
	res.status(200).send(paymentMethodList);
});

module.exports = router;
