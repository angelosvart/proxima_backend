const { DeliveryMethod } = require("../models/deliveryMethod");
const express = require("express");
const router = express.Router();

//Get delivery methods
router.get("/", async (req, res) => {
	const deliveryMethodList = await DeliveryMethod.find();

	if (!deliveryMethodList) {
		res.status(500).json({
			success: false,
		});
	}
	res.status(200).send(deliveryMethodList);
});

module.exports = router;
