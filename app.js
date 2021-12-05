const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");

app.use(cors());
app.options("*", cors());
app.use(express.urlencoded({ extended: true }));

//Middleware
app.use(express.json());

//Routes
const usersRoute = require("./routes/users");
const storesRoute = require("./routes/stores");
const productsRoute = require("./routes/products");
const categoriesRoute = require("./routes/categories");
const deliveryMethodsRoute = require("./routes/deliveryMethods");
const paymentMethodsRoute = require("./routes/paymentMethods");
const ordersRoute = require("./routes/orders");

app.use(`${process.env.API_PATH}/users`, usersRoute);
app.use(`${process.env.API_PATH}/stores`, storesRoute);
app.use(`${process.env.API_PATH}/products`, productsRoute);
app.use(`${process.env.API_PATH}/categories`, categoriesRoute);
app.use(`${process.env.API_PATH}/deliverymethods`, deliveryMethodsRoute);
app.use(`${process.env.API_PATH}/paymentmethods`, paymentMethodsRoute);
app.use(`${process.env.API_PATH}/orders`, ordersRoute);

//DB
mongoose
	.connect(process.env.DB_CONNECTION, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: "proxima-db",
	})
	.then(() => {
		console.log("DB connection ready");
	})
	.catch((err) => {
		console.log(err);
	});

//Server
app.listen(3000, () => {
	console.log("Server started in http://localhost:3000");
});
