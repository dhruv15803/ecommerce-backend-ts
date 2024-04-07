"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeCheckout = exports.decrementQty = exports.incrementQty = exports.deleteCartItem = exports.getCartProducts = exports.addToCart = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: "C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backendsrc\\.env",
});
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_API_KEY);
const addToCart = async (req, res) => {
    try {
        const { productid, itemqty } = req.body;
        console.log(req.body);
        // need to be logged in
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payloadData = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        console.log(payloadData);
        const { userid } = Object(payloadData);
        // checking if product already exists in cart of logged in user
        const isProductInCart = await index_1.client.query(`SELECT * FROM cart WHERE userid=$1 AND productid=$2`, [userid, productid]);
        if (isProductInCart.rows.length !== 0) {
            // getting itemqty
            const itemQty = await index_1.client.query(`SELECT * FROM cart WHERE userid=$1 AND productid=$2`, [userid, productid]);
            const qty = itemQty.rows[0].itemqty;
            // updating itemqty
            await index_1.client.query(`UPDATE cart SET itemqty=$1 WHERE userid=$2 AND productid=$3`, [qty + 1, userid, productid]);
        }
        else {
            await index_1.client.query(`INSERT INTO cart(productid,itemqty,userid) VALUES($1,$2,$3)`, [productid, itemqty, userid]);
        }
        const newCartRow = await index_1.client.query(`SELECT * FROM cart INNER JOIN products ON cart.productid=products.productid WHERE cart.userid=$1 AND cart.productid=$2`, [userid, productid]);
        res.status(200).json({
            success: true,
            message: "successfully added to cart",
            newCartItem: newCartRow.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.addToCart = addToCart;
const getCartProducts = async (req, res) => {
    // need to be logged in
    try {
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payloadData = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        console.log(payloadData);
        const { userid } = Object(payloadData);
        const cartRows = await index_1.client.query(`SELECT * FROM cart INNER JOIN products ON cart.productid=products.productid WHERE cart.userid=$1`, [userid]);
        res.status(200).json({
            success: true,
            cartProducts: cartRows.rows,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getCartProducts = getCartProducts;
const deleteCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        // need to be logged in 
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payloadData = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        console.log(payloadData);
        const { userid } = Object(payloadData);
        //   delete query
        await index_1.client.query(`DELETE FROM cart WHERE userid=$1 AND cartid=$2`, [userid, id]);
        res.status(200).json({
            "success": true,
            "message": "successfully deleted cart item"
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.deleteCartItem = deleteCartItem;
const incrementQty = async (req, res) => {
    try {
        const { itemqty, cartid } = req.body;
        // need to be logged in 
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payloadData = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        console.log(payloadData);
        const { userid } = Object(payloadData);
        //   update query
        await index_1.client.query(`UPDATE cart SET itemqty=$1 WHERE userid=$2 AND cartid=$3`, [itemqty + 1, userid, cartid]);
        res.status(200).json({
            "success": true,
            "message": "successfully incremented quantity"
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.incrementQty = incrementQty;
const decrementQty = async (req, res) => {
    try {
        const { itemqty, cartid } = req.body;
        // need to be logged in 
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payloadData = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        console.log(payloadData);
        const { userid } = Object(payloadData);
        //   update query
        await index_1.client.query(`UPDATE cart SET itemqty=$1 WHERE userid=$2 AND cartid=$3`, [itemqty - 1, userid, cartid]);
        res.status(200).json({
            "success": true,
            "message": "successfully incremented quantity"
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.decrementQty = decrementQty;
const stripeCheckout = async (req, res) => {
    try {
        const { cart } = req.body;
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payloadData = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        console.log(payloadData);
        const { userid } = Object(payloadData);
        const lineItems = cart.map((product) => {
            return {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: product.productname,
                        images: [product.productthumbnail],
                    },
                    unit_amount: product.productprice * 100,
                },
                quantity: product.itemqty,
            };
        });
        const userRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [userid]);
        const user = userRow.rows[0];
        // const paymentIntent = await stripe.paymentIntents.create({
        //   description:'ecommerce eproduct delivery',
        //   shipping:{
        //     name:user.firstname,
        //     address:{
        //       line1:'j-123, leela apartments',
        //       postal_code:'98140',
        //       city:'delhi',
        //       country:'INDIA',
        //     },
        //   },
        //   amount:
        // })
        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            submit_type: 'pay',
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['IN'],
            },
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}`,
            cancel_url: `${process.env.FRONTEND_URL}/cart`,
        });
        res.status(200).json({
            "success": true,
            "url": session.url,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.stripeCheckout = stripeCheckout;
