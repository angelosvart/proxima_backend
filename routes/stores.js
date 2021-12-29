const { Store } = require("../models/store");
const { Product } = require("../models/product");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");

//Get store by Id
router.get(
	"/:id",
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
		const store = await Store.findById(req.params.id).select("-password");

		if (!store) {
			res.status(500).json({
				message: "La cuenta no ha sido encontrada.",
			});
		}
		res.status(200).send(store);
	}
);

//Create new store
router.post(`/register`, async (req, res) => {
	const password = await req.body.storeUser.password;
	const hashSync = await bcrypt.hashSync(password, 10);

	const checkEmail = await Store.findOne({
		email: req.body.storeUser.email,
	});

	if (checkEmail) {
		return res
			.status(409)
			.send("Ya existe una cuenta con este correo electrónico.");
	}

	let store = new Store({
		name: req.body.storeUser.name,
		contactName: req.body.storeUser.contactName,
		email: req.body.storeUser.email,
		phone: req.body.storeUser.phone,
		address: req.body.storeUser.address,
		postCode: req.body.storeUser.postCode,
		city: req.body.storeUser.city,
		postCodesServing: req.body.storeUser.postCodesServing,
		password: hashSync,
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
			expiresIn: "1w",
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
				expiresIn: "1w",
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

		if (req.body.storeUser.password) {
			newPassword = await bcrypt.hashSync(req.body.storeUser.password, 10);
		} else {
			newPassword = existingStore.password;
		}

		const store = await Store.findByIdAndUpdate(
			req.params.id,
			{
				name: req.body.storeUser.name,
				contactName: req.body.storeUser.contactName,
				email: req.body.storeUser.email,
				phone: req.body.storeUser.phone,
				address: req.body.storeUser.address,
				postCode: req.body.storeUser.postCode,
				city: req.body.storeUser.city,
				password: newPassword,
				postCodesServing: req.body.storeUser.postCodesServing,
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

		res.status(200).send({ store: store });
	}
);

module.exports = router;
