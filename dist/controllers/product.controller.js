"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.editProduct = exports.getSubCategoryById = exports.getProductCategoryById = exports.getAllProducts = exports.getSubCategoriesByCategoryName = exports.deleteSubCategory = exports.editSubCategory = exports.addSubCategory = exports.getSubCategories = exports.editProductCategory = exports.deleteProductCategory = exports.getAllProductCategories = exports.addProductCategory = exports.addProduct = exports.uploadProductThumbnail = void 0;
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
        const { productName, productThumbnailUrl, productDescription, productPrice, productStock, productCategory, subCategory, } = req.body;
        console.log(req.body);
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
            subCategory,
        ];
        let isEmpty = false;
        productFields.forEach((val) => {
            if (typeof val === "string") {
                if (val.trim() === "") {
                    isEmpty = true;
                }
            }
            else {
                if (val === 0) {
                    isEmpty = true;
                }
            }
        });
        if (isEmpty) {
            res.status(400).json({
                success: false,
                message: "Please enter all required fields",
            });
            return;
        }
        // getting productcategoryif from categoryname:productCategory
        const productCategoryRow = await index_1.client.query(`SELECT * FROM productCategories WHERE categoryname=$1`, [productCategory]);
        const { productcategoryid } = productCategoryRow.rows[0];
        // getting subcategoryid from subcategoryname and productcategoryid
        const subCategoryRow = await index_1.client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`, [productcategoryid, subCategory]);
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
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        // check if user is admin
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
        // deletion query
        await index_1.client.query(`DELETE FROM products WHERE productid=$1`, [id]);
        res.status(200).json({
            success: true,
            message: "successfully deleted product",
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.deleteProduct = deleteProduct;
const editProduct = async (req, res) => {
    try {
        const { newProductName, newProductPrice, newProductStock, newProductDescription, newProductThumbnailUrl, newProductCategoryId, newSubCategoryId, productid, } = req.body;
        // need to be an admin
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
        // fields cannot be empty
        let isEmpty = false;
        const newProductFields = [
            newProductName,
            newProductPrice,
            newProductStock,
            newProductDescription,
            newProductThumbnailUrl,
            newProductCategoryId,
            newSubCategoryId,
        ];
        newProductFields.forEach((field) => {
            if (typeof field === "string") {
                if (field.trim() === "") {
                    isEmpty = true;
                }
            }
            else {
                if (field === 0) {
                    isEmpty = true;
                }
            }
        });
        if (isEmpty) {
            res.status(400).json({
                success: false,
                message: "please enter all product fields",
            });
            return;
        }
        // update query
        await index_1.client.query(`UPDATE products SET productname=$1,productdescription=$2,productprice=$3,productstock=$4,productcategoryid=$5,subcategoryid=$6,productthumbnail=$7 WHERE productid=$8`, [
            newProductName,
            newProductDescription,
            newProductPrice,
            newProductStock,
            newProductCategoryId,
            newSubCategoryId,
            newProductThumbnailUrl,
            productid,
        ]);
        // getting updated product
        const updatedProductRow = await index_1.client.query(`SELECT * FROM products WHERE productid=$1`, [productid]);
        res.status(200).json({
            success: true,
            updatedProduct: updatedProductRow.rows[0],
            message: "successfully edited product",
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.editProduct = editProduct;
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
        const { newProductCategory, id, } = req.body;
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
            success: true,
            message: "successfully edited product category",
            newCategory: newCategory.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.editProductCategory = editProductCategory;
const addSubCategory = async (req, res) => {
    try {
        const { subcategoryname, productcategoryid, } = req.body;
        console.log(req.body);
        if (subcategoryname.trim() === "" ||
            typeof productcategoryid === "string" ||
            typeof subcategoryname === "number") {
            res.status(400).json({
                success: false,
                message: "please enter the required fields",
            });
            return;
        }
        // need to be an admin
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
        // cannot have duplicate sub categories in same parent category;
        const dupCategoryCheck = await index_1.client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`, [productcategoryid, subcategoryname.trim().toLowerCase()]);
        if (dupCategoryCheck.rows.length !== 0) {
            res.status(400).json({
                success: false,
                message: "subcategory already exists",
            });
            return;
        }
        // insert subcategory query
        const newSubCategory = await index_1.client.query(`INSERT INTO subCategories(subcategoryname,productcategoryid) VALUES($1,$2) RETURNING *`, [subcategoryname.trim().toLowerCase(), productcategoryid]);
        res.status(200).json({
            success: true,
            newSubCategory: newSubCategory.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.addSubCategory = addSubCategory;
const editSubCategory = async (req, res) => {
    try {
        const { newsubcategoryname, subcategoryid, productcategoryid, } = req.body;
        if (newsubcategoryname.trim() === "" ||
            typeof subcategoryid === "number" ||
            typeof productcategoryid === "number") {
            res.status(400).json({
                success: false,
                message: "please enter a subcategory",
            });
            return;
        }
        // needs to be an admin
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
        // make sure another subcategory with same name doesn't exist in same parent category
        const checkSubCategory = await index_1.client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`, [productcategoryid, newsubcategoryname.trim().toLowerCase()]);
        if (checkSubCategory.rows.length !== 0) {
            res.status(400).json({
                success: false,
                message: "another subcategory exists",
            });
            return;
        }
        // update query
        await index_1.client.query(`UPDATE subcategories SET subcategoryname=$1 WHERE productcategoryid=$2 AND subcategoryid=$3`, [
            newsubcategoryname.trim().toLowerCase(),
            productcategoryid,
            subcategoryid,
        ]);
        // getting updated subcategory obj
        const newSubCategoryRow = await index_1.client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryid=$2`, [productcategoryid, subcategoryid]);
        res.status(200).json({
            success: true,
            newSubCategory: newSubCategoryRow.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.editSubCategory = editSubCategory;
const deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // id => subcategoryid
        // need to be an admin to delete
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
        // no products can be assigned to this subcategoryid when deleteing
        // checking if any products exist with this subcategoryid
        const isProducts = await index_1.client.query(`SELECT * FROM products WHERE subcategoryid=$1`, [id]);
        if (isProducts.rows.length !== 0) {
            res.status(400).json({
                success: false,
                message: "cannot delete subcategory with products assigned to it",
            });
            return;
        }
        // deletion query
        await index_1.client.query(`DELETE FROM subCategories WHERE subcategoryid=$1`, [
            id,
        ]);
        res.status(200).json({
            success: true,
            message: "successfully deleted subcategory",
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.deleteSubCategory = deleteSubCategory;
const getSubCategories = async (req, res) => {
    try {
        const { productcategoryid } = req.body;
        console.log(req.body);
        if (productcategoryid === "" || typeof productcategoryid === "string") {
            res.json({
                success: false,
                message: "product category id error",
            });
            return;
        }
        const subCategoriesRows = await index_1.client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1`, [productcategoryid]);
        res.status(200).json({
            success: true,
            subcategories: subCategoriesRows.rows,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getSubCategories = getSubCategories;
const getSubCategoriesByCategoryName = async (req, res) => {
    try {
        const { categoryname } = req.body;
        if (categoryname.trim() === "") {
            res.json({
                success: false,
                message: "please select a category",
            });
            return;
        }
        // get category id from categoryname
        const categoryRow = await index_1.client.query(`SELECT * FROM productCategories WHERE categoryname=$1`, [categoryname]);
        const productcategoryid = categoryRow.rows[0].productcategoryid;
        // getting subcategires
        const subCategoriesRows = await index_1.client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1`, [productcategoryid]);
        if (subCategoriesRows.rows.length === 0) {
            res.status(400).json({
                success: false,
                message: "please add a subcategory for this product category",
                subcategories: [],
            });
            return;
        }
        res.status(200).json({
            success: true,
            subcategories: subCategoriesRows.rows,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getSubCategoriesByCategoryName = getSubCategoriesByCategoryName;
const getProductCategoryById = async (req, res) => {
    try {
        const { productcategoryid } = req.body;
        const productCategoryRow = await index_1.client.query(`SELECT * FROM productCategories WHERE productcategoryid=$1`, [productcategoryid]);
        res.status(200).json({
            success: true,
            categoryname: productCategoryRow.rows[0].categoryname,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getProductCategoryById = getProductCategoryById;
const getSubCategoryById = async (req, res) => {
    try {
        const { productcategoryid, subcategoryid } = req.body;
        const subCategoryRow = await index_1.client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryid=$2`, [productcategoryid, subcategoryid]);
        res.status(200).json({
            success: true,
            subcategoryname: subCategoryRow.rows[0].subcategoryname,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getSubCategoryById = getSubCategoryById;
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
const getAllProducts = async (req, res) => {
    try {
        const productRows = await index_1.client.query(`SELECT * FROM products`);
        res.status(200).json({
            success: true,
            products: productRows.rows,
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getAllProducts = getAllProducts;
