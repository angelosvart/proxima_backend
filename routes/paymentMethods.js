const { PaymentMethod } = require("../models/paymentMethod");
const express = require("express");
const router = express.Router();

//Get all payment methods
router.get("/", async (req, res) => {
	const paymentMethodList = await PaymentMethod.find();

	if (!paymentMethodList) {
		res.status(500).json({
			success: false,
		});
	}
	res.status(200).send(paymentMethodList);
});

//Get payment method by Id
router.get("/:id", async (req, res) => {
	const paymentMethod = await PaymentMethod.findById(req.params.id);

	if (!paymentMethod) {
		res.status(500).json({
			message: "Payment method not found",
		});
	}

	res.status(200).send(paymentMethod);
});

module.exports = router;
