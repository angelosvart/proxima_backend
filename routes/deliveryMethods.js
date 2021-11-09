const { DeliveryMethod } = require("../models/deliveryMethod");
const express = require("express");
const router = express.Router();

//Get all delivery methods
router.get("/", async (req, res) => {
	const deliveryMethodList = await DeliveryMethod.find();

	if (!deliveryMethodList) {
		res.status(500).json({
			success: false,
		});
	}
	res.status(200).send(deliveryMethodList);
});

//Get delivery method by Id
router.get("/:id", async (req, res) => {
	const deliveryMethod = await DeliveryMethod.findById(req.params.id);

	if (!deliveryMethod) {
		res.status(500).json({
			message: "Delivery method not found",
		});
	}

	res.status(200).send(deliveryMethod);
});

module.exports = router;
