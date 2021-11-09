const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");

//List of all users
router.get(`/`, async (req, res) => {
	const userList = await User.find().select("-password");

	if (!userList) {
		res.status(500).json({
			success: false,
		});
	}
	res.status(200).send(userList);
});

//Get user by Id
router.get("/:id", async (req, res) => {
	const user = await User.findById(req.params.id).select("-password");

	if (!user) {
		res.status(500).json({
			message: "La cuenta no ha sido encontrada.",
		});
	}
	res.status(200).send(user);
});

//Create new user
router.post(`/register`, async (req, res) => {
	let user = new User({
		name: req.body.name,
		lastName: req.body.lastName,
		email: req.body.email,
		phone: req.body.phone,
		address: req.body.address,
		postCode: req.body.postCode,
		city: req.body.city,
		password: bcrypt.hashSync(req.body.password, 10),
	});

	user = await user.save();

	if (!user) {
		return res
			.status(400)
			.send("No se ha podido crear la cuenta. Por favor intenta nuevamente.");
	}

	const token = jwt.sign(
		{
			userId: user.id,
		},
		process.env.SECRET,
		{
			expiresIn: "1d",
		}
	);

	res.status(200).send({ user: user, token });
});

//Login user
router.post("/login", async (req, res) => {
	const user = await User.findOne({
		email: req.body.email,
	});

	if (!user) {
		return res
			.status(400)
			.send(
				"La cuenta no ha sido encontrada o la contraseña es incorrecta. Por favor intenta nuevamente."
			);
	}

	if (user && bcrypt.compareSync(req.body.password, user.password)) {
		const token = jwt.sign(
			{
				userId: user.id,
			},
			process.env.SECRET,
			{
				expiresIn: "1d",
			}
		);

		res.status(200).send({ user: user, token });
	} else {
		res
			.status(400)
			.send(
				"La cuenta no ha sido encontrada o la contraseña es incorrecta. Por favor intenta nuevamente."
			);
	}
});

//Edit existing user
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
		if (req.user.userId !== req.params.id) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}

		const existingUser = await User.findById(req.params.id);
		let newPassword;

		if (req.body.password) {
			newPassword = bcrypt.hashSync(req.body.password, 10);
		} else {
			newPassword = existingUser.password;
		}

		const user = await User.findByIdAndUpdate(
			req.params.id,
			{
				name: req.body.name,
				lastName: req.body.lastName,
				email: req.body.email,
				phone: req.body.phone,
				address: req.body.address,
				postCode: req.body.postCode,
				city: req.body.city,
				password: newPassword,
			},
			{ new: true }
		);

		if (!user) {
			return res
				.status(400)
				.send(
					"La cuenta no se ha podido modificar. Por favor intenta nuevamente."
				);
		}

		res.send(user);
	}
);

module.exports = router;
