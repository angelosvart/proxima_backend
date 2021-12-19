const { Product } = require("../models/product");
const express = require("express");
const { Category } = require("../models/category");
const { Store } = require("../models/store");
const router = express.Router();
const expressJwt = require("express-jwt");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECRET,
	secure: true,
});

//Get all products by post code and filters
router.get(`/`, async (req, res) => {
	if (!req.query.postcode) {
		res.status(500).json({
			success: false,
			message: "Es necesario especificar un código postal.",
		});
	}

	let filter = {};
	if (req.query.brand) {
		filter = { ...filter, brand: req.query.brand.split(",") };
	}
	if (req.query.category) {
		filter = { ...filter, category: req.query.category.split(",") };
	}
	if (req.query.subcategory) {
		filter = { ...filter, subcategory: req.query.subcategory.split(",") };
	}
	if (req.query.color) {
		filter = { ...filter, color: req.query.color.split(",") };
	}
	if (req.query.price) {
		//hacer
	}
	if (req.query.isOffer) {
		filter = { ...filter, isOffer: req.query.isOffer.split(",") };
	}
	if (req.query.store) {
		filter = { ...filter, store: req.query.store.split(",") };
	}
	if (req.query.search) {
		filter = {
			...filter,
			$text: { $search: req.query.search },
		};
	}

	const productList = await Product.find(filter)
		.populate({
			path: "store",
			match: { postCodesServing: { $in: [req.query.postcode] } },
			select: "postCodesServing name",
		})
		.populate("category", "name")
		.sort({ created: -1 });

	let filterByUserPostCode = productList.filter((product) => {
		return product.store;
	});

	if (!filterByUserPostCode) {
		res.status(500).json({
			success: false,
			message: "Ha ocurrido un error, por favor inténtalo nuevamente.",
		});
	}

	res.status(200).send(filterByUserPostCode);
});

//Get product by id
router.get(`/:id`, async (req, res) => {
	const product = await Product.findById(req.params.id)
		.populate("category", "name path")
		.populate("store", "name postCodesServing");

	if (!product) {
		res.status(500).json({
			message: "Product not found",
		});
	}
	res.send(product);
});

//Get products by store Id
router.get(
	"/store/:id",
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
		if (!req.user.storeId) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}

		const store = await Store.findById(req.params.id).select("-password");

		const productList = await Product.find({ store: req.params.id })
			.select("brand image name price isOffer previousPrice")
			.sort({ created: -1 });

		if (!store) {
			res.status(500).json({
				message: "La tienda no ha sido encontrada.",
			});
		}

		res.status(200).send(productList);
	}
);

//Add product
router.post(
	`/`,
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
		if (!req.user.storeId) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}

		const form = new formidable.IncomingForm();
		let formFields;
		let imagePath;

		const handleForm = await new Promise(function (resolve, reject) {
			form.parse(req, (err, fields, files) => {
				formFields = fields;
				cloudinary.uploader.upload(
					files.image.filepath,
					{
						folder: "products",
						eager: [{ width: 700, crop: "scale" }, { quality: "auto" }],
					},
					function (err, result) {
						if (result) {
							imagePath = result.url;
							resolve(true);
							return;
						} else {
							reject(false);
							return;
						}
					}
				);
			});
		});

		if (!handleForm) {
			res.status(400).json({
				message: "Ha ocurrido un error al subir la imagen al servidor",
			});
		}

		const category = await Category.findById(formFields.category);
		if (!category) {
			return res.status(400).json({
				message: "La categoría no es válida.",
			});
		}

		const store = await Store.findById(formFields.store);
		if (!store) {
			return res.status(400).json({
				message: "La tienda no es válida.",
			});
		}

		let product = new Product({
			image: imagePath,
			name: formFields.name,
			brand: formFields.brand,
			description: formFields.description,
			category: formFields.category,
			subcategory: formFields.subcategory,
			color: formFields.color,
			price: formFields.price,
			offerPrice: formFields.offerPrice,
			isOffer: formFields.isOffer,
			isAvailable: formFields.isAvailable,
			store: formFields.store,
		});

		product = await product.save();

		if (!product) {
			return res.status(500).json({
				message:
					"No se ha podido crear el producto. Por favor intenta nuevamente.",
			});
		}

		res.status(200).send(product);
	}
);

//Edit product
router.put(
	`/:id`,
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
		if (!req.user.storeId) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}

		const form = new formidable.IncomingForm();
		let formFields;
		let imagePath;

		const handleForm = await new Promise(function (resolve, reject) {
			form.parse(req, (err, fields, files) => {
				formFields = fields;
				if (files.image) {
					cloudinary.uploader.upload(
						files.image.filepath,
						{
							folder: "products",
							eager: [{ width: 700, crop: "scale" }, { quality: "auto" }],
						},
						function (err, result) {
							if (result) {
								imagePath = result.url;
								resolve(true);
								return;
							} else {
								reject(false);
								return;
							}
						}
					);
				} else {
					resolve(true);
					return;
				}
			});
		});

		if (!handleForm) {
			res.status(400).json({
				message: "Ha ocurrido un error al subir la imagen al servidor",
			});
		}

		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(400).json({
				message: "No se ha encontrado el producto.",
			});
		}

		if (formFields.store !== product.store.toString()) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}

		const category = await Category.findById(formFields.category);
		if (!category) {
			return res.status(400).json({
				message: "La categoría no es válida.",
			});
		}

		const editedProduct = await Product.findByIdAndUpdate(
			req.params.id,
			{
				image: imagePath,
				name: formFields.name,
				brand: formFields.brand,
				description: formFields.description,
				category: formFields.category,
				subcategory: formFields.subcategory,
				color: formFields.color,
				price: formFields.price,
				offerPrice: formFields.offerPrice,
				isOffer: formFields.isOffer,
				isAvailable: formFields.isAvailable,
			},
			{ new: true }
		);

		if (!editedProduct) {
			return res.status(500).json({
				message:
					"El producto no ha podido ser editado. Por favor intenta nuevamente.",
			});
		}

		res.status(200).send(editedProduct);
	}
);

//Delete product
router.delete(
	`/:id`,
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
		const product = await Product.findById(req.params.id);
		if (req.user.storeId !== product.store.toString()) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}
		const deletedProduct = await Product.findByIdAndDelete(req.params.id);

		if (!deletedProduct) {
			return res.status(500).json({
				message:
					"El producto no ha podido ser eliminado. Por favor intenta nuevamente.",
			});
		}

		res.status(200).send({ message: "El producto ha sido eliminado." });
	}
);

module.exports = router;
