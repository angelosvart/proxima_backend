const { Order } = require("../models/order");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const { Product } = require("../models/product");

//Get orders
router.get(
	"/",
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
		let orderList;
		if (req.user.userId) {
			orderList = await Order.find({ user: req.user.userId })
				.select("created")
				.populate({
					path: "products",
					populate: {
						path: "store",
						select: "name",
					},
					select: "image",
				})
				.sort({ created: -1 });
		}

		if (req.user.storeId) {
			unfilteredList = await Order.find()
				.select("created")
				.populate({
					path: "deliveryMethod",
					select: "name",
				})
				.populate({
					path: "products",
					populate: {
						path: "store",
						match: { _id: { $in: [req.user.storeId] } },
						select: "_id",
					},
					select: "store",
				})
				.sort({ created: -1 });

			orderList = unfilteredList.reduce((array, current) => {
				current.products.forEach((product) => {
					if (product.store) {
						array.push(current);
					}
				});
				return array;
			}, []);
		}

		return res.status(200).send(orderList);
	}
);

//Create new order
router.post(
	"/",
	/*expressJwt({
		secret: process.env.SECRET,
		algorithms: ["HS256"],
	}),
	(err, req, res, next) => {
		return res.status(401).json({
			message: "El usuario no está autorizado para realizar esta acción.",
		});
	},*/
	async (req, res) => {
		/*if (!req.user.userId) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}*/
		const products = req.body.products;
		const subTotalPrices = await Promise.all(
			products.map(async (product) => {
				const productPrice = await Product.findById(product.productId).select(
					"price"
				);
				product.payedPrice = productPrice.price;
				return productPrice.price * product.quantity;
			})
		);

		const subTotalPrice = subTotalPrices.reduce((a, b) => a + b, 0);
		const totalPrice = subTotalPrice + req.body.deliveryFee;

		let order = new Order({
			deliveryMethod: req.body.deliveryMethod,
			deliveryAddress: req.body.deliveryAddress,
			name: req.body.name,
			phone: req.body.phone,
			paymentMethod: req.body.paymentMethod,
			products: [...req.body.products],
			subtotalPrice: subTotalPrice,
			deliveryFee: req.body.deliveryFee,
			totalPrice: totalPrice,
			isPaid: req.body.isPaid,
			user: req.body.user,
		});

		order = await order.save();

		if (!order) {
			return res
				.status(400)
				.send(
					"El pedido no ha podido ser creado. Por favor intenta nuevamente."
				);
		}

		res.status(200).send(order);
	}
);

//Get order by id
router.get(
	"/:id",
	/*expressJwt({
		secret: process.env.SECRET,
		algorithms: ["HS256"],
	}),
	(err, req, res, next) => {
		return res.status(401).json({
			message: "El usuario no está autorizado para realizar esta acción.",
		});
	},*/
	async (req, res) => {
		/*if (!req.user.userId) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}*/
		let orderItem;

		/*if (req.user.userId) {*/
		orderItem = await Order.findById(req.params.id)
			.populate({
				path: "products",
				populate: {
					path: "productId",
					select: "image brand name store",
					populate: {
						path: "store",
						select: "name phone email address postcode city",
					},
				},
			})
			.populate("deliveryMethod paymentMethod");
		/*}

		if (req.user.storeId) {
			orderItem = await Order.findById(req.params.id)
				.populate({
					path: "products",
					select: "image brand name",
				})
				.populate({
					path: "user",
					select: "name lastName phone address postcode city",
				})
				.populate("deliveryMethod paymentMethod", "name");
		}*/

		if (!orderItem) {
			res.status(500).json({ success: false });
		}

		res.status(200).send(orderItem);
	}
);

//Edit order status
router.put(
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
		if (req.user.storeId) {
			const order = await Order.findByIdAndUpdate(
				req.params.id,
				{
					isDelivered: req.body.isDelivered,
					delivered: req.body.isDelivered ? Date.now() : null,
					isPaid: req.body.isPaid,
				},
				{ new: true }
			);
			if (!order) {
				res.status(400).send("The order can't be modified. Please try again.");
			}

			res.status(200).send(order);
		}
	}
);

module.exports = router;