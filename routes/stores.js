const { Store } = require("../models/store");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");

//List of all stores
router.get(`/`, async (req, res) => {
	const storeList = await Store.find().select("-password");

	if (!storeList) {
		res.status(500).json({
			success: false,
		});
	}
	res.send(storeList);
});

//Get store by Id
router.get("/:id", async (req, res) => {
	const store = await Store.findById(req.params.id).select("-password");

	if (!store) {
		res.status(500).json({
			message: "La tienda no ha sido encontrada.",
		});
	}
	res.status(200).send(store);
});

//Create new store
router.post(`/register`, async (req, res) => {
	let store = new Store({
		name: req.body.name,
		contactName: req.body.contactName,
		email: req.body.email,
		phone: req.body.phone,
		address: req.body.address,
		postCode: req.body.postCode,
		city: req.body.city,
		postCodesServing: req.body.postCodesServing,
		password: bcrypt.hashSync(req.body.password, 10),
	});

	store = await store.save();

	if (!store) {
		return res
			.status(400)
			.send("No se ha podido crear la cuenta. Por favor intenta nuevamente.");
	}

	const token = jwt.sign(
		{
			storeId: store.id,
		},
		process.env.SECRET,
		{
			expiresIn: "1d",
		}
	);

	res.status(200).send({ store: store, token });
});

//Login store
router.post("/login", async (req, res) => {
	const store = await Store.findOne({
		email: req.body.email,
	});

	if (!store) {
		return res
			.status(400)
			.send(
				"La cuenta no ha sido encontrada o la contraseña es incorrecta. Por favor intenta nuevamente."
			);
	}

	if (store && bcrypt.compareSync(req.body.password, store.password)) {
		const token = jwt.sign(
			{
				storeId: store.id,
			},
			process.env.SECRET,
			{
				expiresIn: "1d",
			}
		);

		res.status(200).send({ store: store, token });
	} else {
		return res
			.status(400)
			.send(
				"La cuenta no ha sido encontrada o la contraseña es incorrecta. Por favor intenta nuevamente."
			);
	}
});

//Edit existing store
router.put(
	"/edit/:id",
	expressJwt({
		secret: process.env.SECRET,
		algorithms: ["HS256"],
	}),
	(err, req, res, next) => {
		return res.status(401).json({
			message: "El usuario no está autorizado para realizar esta acción.",
		});
	},
	async (req, res) => {
		if (req.user.storeId !== req.params.id) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}

		const existingStore = await Store.findById(req.params.id);
		let newPassword;

		if (req.body.password) {
			newPassword = bcrypt.hashSync(req.body.password, 10);
		} else {
			newPassword = existingStore.password;
		}

		const store = await Store.findByIdAndUpdate(
			req.params.id,
			{
				name: req.body.name,
				contactName: req.body.contactName,
				email: req.body.email,
				phone: req.body.phone,
				address: req.body.address,
				postCode: req.body.postCode,
				city: req.body.city,
				password: newPassword,
				postCodesServing: req.body.postCodesServing,
			},
			{ new: true }
		);

		if (!store) {
			return res
				.status(400)
				.send(
					"La cuenta no se ha podido modificar. Por favor intenta nuevamente."
				);
		}

		res.send(store);
	}
);

module.exports = router;
