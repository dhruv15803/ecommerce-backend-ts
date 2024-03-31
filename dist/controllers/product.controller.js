"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editProductCategory = exports.deleteProductCategory = exports.getAllProductCategories = exports.addProductCategory = exports.addProduct = exports.uploadProductThumbnail = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const index_1 = require("../index");
dotenv_1.default.config({
    path: "C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backendsrc\\.env",
});
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadProductThumbnail = async (req, res) => {
    try {
        // checking if logged in user is admin or not
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
        const loggedInUserRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [Number(userid)]);
        const loggedInUser = loggedInUserRow.rows[0];
        if (loggedInUser.email !== process.env.ADMIN_EMAIL ||
            loggedInUser.username !== process.env.ADMIN_USERNAME) {
            res.status(400).json({
                success: false,
                message: "This action can only be performed by an admin",
            });
            return;
        }
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "file not found",
            });
            return;
        }
        const localFilePath = req.file.path;
        const { url } = await cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        res.status(200).json({
            success: true,
            productThumbnailUrl: url,
        });
        fs_1.default.unlinkSync(localFilePath);
    }
    catch (error) {
        console.log(error);
    }
};
exports.uploadProductThumbnail = uploadProductThumbnail;
const addProduct = async (req, res) => {
    try {
        const { productName, productThumbnailUrl, productDescription, productPrice, productStock, productCategory, productSubCategory, } = req.body;
        // checking if logged in user is admin or not
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
        const loggedInUserRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [Number(userid)]);
        const loggedInUser = loggedInUserRow.rows[0];
        if (loggedInUser.email !== process.env.ADMIN_EMAIL ||
            loggedInUser.username !== process.env.ADMIN_USERNAME) {
            res.status(400).json({
                success: false,
                message: "This action can only be performed by an admin",
            });
            return;
        }
        const productFields = [
            productName,
            productThumbnailUrl,
            productDescription,
            productPrice,
            productStock,
            productCategory,
        ];
        productFields.forEach((val) => {
            if (typeof val === "string") {
                if (val.trim() === "") {
                    res.status(400).json({
                        success: false,
                        message: "Please enter all required fields",
                    });
                    return;
                }
            }
            else {
                if (val === 0) {
                    res.status(400).json({
                        success: false,
                        message: "please enter all required fields",
                    });
                    return;
                }
            }
        });
        // getting productcategoryif from categoryname:productCategory
        const productCategoryRow = await index_1.client.query(`SELECT * FROM productCategories WHERE categoryname=$1`, [productCategory]);
        const { productcategoryid } = productCategoryRow.rows[0];
        // getting subcategoryid from subcategoryname and productcategoryid
        const subCategoryRow = await index_1.client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`, [productcategoryid, productSubCategory]);
        const { subcategoryid } = subCategoryRow.rows[0];
        const productRow = await index_1.client.query(`INSERT INTO products(productname,productdescription,productprice,productstock,productcategoryid,subcategoryid,productthumbnail) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [
            productName,
            productDescription,
            productPrice,
            productStock,
            productcategoryid,
            subcategoryid,
            productThumbnailUrl,
        ]);
        res.status(200).json({
            success: true,
            message: "successfully added product",
            product: productRow.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.addProduct = addProduct;
const addProductCategory = async (req, res) => {
    try {
        const { productCategory } = req.body;
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
        const loggedInUserRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [Number(userid)]);
        const loggedInUser = loggedInUserRow.rows[0];
        if (loggedInUser.email !== process.env.ADMIN_EMAIL ||
            loggedInUser.username !== process.env.ADMIN_USERNAME) {
            res.status(400).json({
                success: false,
                message: "This action can only be performed by an admin",
            });
            return;
        }
        if (productCategory.trim() === "") {
            res.status(400).json({
                success: false,
                message: "please enter a category",
            });
            return;
        }
        const productCategoryRow = await index_1.client.query(`INSERT INTO productCategories(categoryname) VALUES($1) RETURNING *`, [productCategory.trim().toLowerCase()]);
        res.status(200).json({
            success: true,
            message: "successfully added product category",
            productCategory: productCategoryRow.rows[0],
        });
    }
    catch (error) {
        console.log("MY ERROR", error);
        res.status(400).json({
            success: false,
            message: "category name already exists",
        });
    }
};
exports.addProductCategory = addProductCategory;
const deleteProductCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // id : productcategoryid
        // we do not want to delete a category with products assigned to it
        // 1: checking if logged in user is admin
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
        const loggedInUserRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [Number(userid)]);
        const loggedInUser = loggedInUserRow.rows[0];
        if (loggedInUser.email !== process.env.ADMIN_EMAIL ||
            loggedInUser.username !== process.env.ADMIN_USERNAME) {
            res.status(400).json({
                success: false,
                message: "This action can only be performed by an admin",
            });
            return;
        }
        //   checking if any products exists with this productcategoryid
        const productRows = await index_1.client.query(`SELECT * FROM products WHERE productcategoryid=$1`, [id]);
        if (productRows.rows.length !== 0) {
            res.status(400).json({
                success: false,
                message: "cannot delete category with products assigned to it",
            });
            return;
        }
        // deletion query
        await index_1.client.query(`DELETE FROM productCategories WHERE productcategoryid=$1`, [id]);
        res.status(200).json({
            success: true,
            message: "successfully deleted product category",
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.deleteProductCategory = deleteProductCategory;
const editProductCategory = async (req, res) => {
    try {
        const { newProductCategory, id } = req.body;
        console.log(req.body);
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
        const loggedInUserRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [Number(userid)]);
        const loggedInUser = loggedInUserRow.rows[0];
        if (loggedInUser.email !== process.env.ADMIN_EMAIL ||
            loggedInUser.username !== process.env.ADMIN_USERNAME) {
            res.status(400).json({
                success: false,
                message: "This action can only be performed by an admin",
            });
            return;
        }
        if (newProductCategory.trim() === "") {
            res.status(400).json({
                success: false,
                message: "please enter a category",
            });
            return;
        }
        //   checking if new category already exists
        const checkCategoryExists = await index_1.client.query(`SELECT * FROM productCategories WHERE categoryname=$1`, [newProductCategory.trim().toLowerCase()]);
        console.log(checkCategoryExists.rows);
        if (checkCategoryExists.rows.length !== 0) {
            res.status(400).json({
                success: false,
                message: "category already exists",
            });
            return;
        }
        // update query
        await index_1.client.query(`UPDATE productCategories SET categoryname='${newProductCategory
            .trim()
            .toLowerCase()}' WHERE productcategoryid=${id}`);
        //   updated category
        const newCategory = await index_1.client.query(`SELECT * FROM productCategories WHERE productcategoryid=$1`, [id]);
        res.status(200).json({
            "success": true,
            "message": "successfully edited product category",
            "newCategory": newCategory.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.editProductCategory = editProductCategory;
const getAllProductCategories = async (req, res) => {
    try {
        const productCategoryRows = await index_1.client.query(`SELECT * FROM productCategories`);
        res.status(200).json({
            success: true,
            productCategories: productCategoryRows.rows,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getAllProductCategories = getAllProductCategories;
