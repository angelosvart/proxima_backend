const { Product } = require("../models/product");
const express = require("express");
const { Category } = require("../models/category");
const { Store } = require("../models/store");
const router = express.Router();
const expressJwt = require("express-jwt");
const mongoose = require("mongoose");
const multer = require("multer");

const FILETYPE = {
	"image/png": "png",
	"image/jpg": "jpg",
	"image/jpeg": "jpeg",
};

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const isValidFile = FILETYPE[file.mimetype];
		let uploadError = new Error("El tipo de imagen no es válido.");

		if (isValidFile) {
			uploadError = null;
		}
		cb(uploadError, "public/images");
	},
	filename: (req, file, cb) => {
		console.log(file);
		const fileName = file.originalname
			.split(" ")
			.join("-")
			.replace(".jpeg", "")
			.replace(".jpg", "")
			.replace(".png", "");
		const extension = FILETYPE[file.mimetype];
		cb(null, `${fileName}-${Date.now()}.${extension}`);
	},
});

const upload = multer({ storage: storage });

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
		filter = { ...filter, brand: req.query.brand };
	}
	if (req.query.category) {
		filter = { ...filter, category: req.query.category };
	}
	if (req.query.subcategory) {
		filter = { ...filter, subcategory: req.query.subcategory };
	}
	if (req.query.color) {
		filter = { ...filter, color: req.query.color };
	}
	//arreglar
	if (req.query.price) {
		filter = { ...filter, price: req.query.price };
	}
	if (req.query.isOffer) {
		filter = { ...filter, isOffer: req.query.isOffer };
	}
	if (req.query.store) {
		filter = { ...filter, store: req.query.store };
	}

	const productList = await Product.find(filter)
		.populate({
			path: "owner",
			match: { postCodesServing: { $in: [req.query.postcode] } },
			select: "postCodesServing name",
		})
		.populate("category", "name");

	let filterByUserPostCode = productList.filter((product) => {
		return product.owner;
	});

	if (!filterByUserPostCode) {
		res.status(500).json({
			success: false,
		});
	}

	res.status(200).send(filterByUserPostCode);
});

//Get product by id
router.get(`/:id`, async (req, res) => {
	const product = await Product.findById(req.params.id)
		.populate("category", "name")
		.populate("owner", "name postCodesServing");

	if (!product) {
		res.status(500).json({
			message: "Product not found",
		});
	}
	res.send(product);
});

//Add product
router.post(
	`/`,
	upload.single("image"),
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

		const category = await Category.findById(req.body.category);
		if (!category) {
			return res.status(400).json({
				message: "La categoría no es válida.",
			});
		}

		const owner = await Store.findById(req.body.owner);
		if (!owner) {
			return res.status(400).json({
				message: "La tienda no es válida.",
			});
		}

		const file = req.file;
		if (!file) {
			return res.status(400).json({
				message: "No se ha seleccionado una imagen.",
			});
		}

		const fileName = req.file.filename;
		const basePath = `${req.protocol}://${req.get("host")}/public/images/`;

		let product = new Product({
			image: `${basePath}${fileName}`,
			name: req.body.name,
			brand: req.body.brand,
			description: req.body.description,
			category: req.body.category,
			subcategory: req.body.subcategory,
			color: req.body.color,
			price: req.body.price,
			offerPrice: req.body.offerPrice,
			isOffer: req.body.isOffer,
			isAvailable: req.body.isAvailable,
			owner: req.body.owner,
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
	upload.single("image"),
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
		if (!product) {
			return res.status(400).json({
				message: "No se ha encontrado el producto.",
			});
		}

		if (req.user.storeId !== product.owner.toString()) {
			return res.status(401).json({
				message: "El usuario no está autorizado para realizar esta acción.",
			});
		}

		const category = await Category.findById(req.body.category);
		if (!category) {
			return res.status(400).json({
				message: "La categoría no es válida.",
			});
		}

		const file = req.file;
		let imagePath;

		if (file) {
			const fileName = req.file.filename;
			const basePath = `${req.protocol}://${req.get("host")}/public/images/`;
			imagePath = `${basePath}${fileName}`;
		} else {
			imagePath = product.image;
		}

		const newProduct = await Product.findByIdAndUpdate(
			req.params.id,
			{
				image: imagePath,
				name: req.body.name,
				brand: req.body.brand,
				description: req.body.description,
				category: req.body.category,
				subcategory: req.body.subcategory,
				color: req.body.color,
				price: req.body.price,
				offerPrice: req.body.offerPrice,
				isOffer: req.body.isOffer,
				isAvailable: req.body.isAvailable,
			},
			{ new: true }
		);

		if (!newProduct) {
			return res.status(500).json({
				message:
					"El producto no ha podido ser editado. Por favor intenta nuevamente.",
			});
		}

		res.status(200).send(newProduct);
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
		if (req.user.storeId !== product.owner.toString()) {
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
