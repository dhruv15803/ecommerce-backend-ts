import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from "fs";
import { client } from "../index";

dotenv.config({
  path: "C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backendsrc\\.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadProductThumbnail = async (req: any, res: any) => {
  try {
    // checking if logged in user is admin or not
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }

    const payloadData: Object = jwt.verify(
      req.cookies.accessToken,
      String(process.env.JWT_SECRET)
    );
    console.log(payloadData);
    const { userid } = Object(payloadData);

    const loggedInUserRow = await client.query(
      `SELECT * FROM users WHERE userid=$1`,
      [Number(userid)]
    );
    const loggedInUser = loggedInUserRow.rows[0];
    if (
      loggedInUser.email !== process.env.ADMIN_EMAIL ||
      loggedInUser.username !== process.env.ADMIN_USERNAME
    ) {
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
    const { url } = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    res.status(200).json({
      success: true,
      productThumbnailUrl: url,
    });
    fs.unlinkSync(localFilePath);
  } catch (error) {
    console.log(error);
  }
};

const addProduct = async (req: any, res: any) => {
  try {
    type productFieldsType = {
      productName: string;
      productThumbnailUrl: string;
      productDescription: string;
      productPrice: number;
      productStock: number;
      productCategory: string;
      productSubCategory: string;
    };

    const {
      productName,
      productThumbnailUrl,
      productDescription,
      productPrice,
      productStock,
      productCategory,
      productSubCategory,
    }: productFieldsType = req.body;
    // checking if logged in user is admin or not
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }

    const payloadData: Object = jwt.verify(
      req.cookies.accessToken,
      String(process.env.JWT_SECRET)
    );
    console.log(payloadData);
    const { userid } = Object(payloadData);

    const loggedInUserRow = await client.query(
      `SELECT * FROM users WHERE userid=$1`,
      [Number(userid)]
    );
    const loggedInUser = loggedInUserRow.rows[0];
    if (
      loggedInUser.email !== process.env.ADMIN_EMAIL ||
      loggedInUser.username !== process.env.ADMIN_USERNAME
    ) {
      res.status(400).json({
        success: false,
        message: "This action can only be performed by an admin",
      });
      return;
    }

    const productFields: (string | number)[] = [
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
      } else {
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
    const productCategoryRow = await client.query(
      `SELECT * FROM productCategories WHERE categoryname=$1`,
      [productCategory]
    );
    const { productcategoryid } = productCategoryRow.rows[0];

    // getting subcategoryid from subcategoryname and productcategoryid
    const subCategoryRow = await client.query(
      `SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`,
      [productcategoryid, productSubCategory]
    );
    const { subcategoryid } = subCategoryRow.rows[0];

    const productRow = await client.query(
      `INSERT INTO products(productname,productdescription,productprice,productstock,productcategoryid,subcategoryid,productthumbnail) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        productName,
        productDescription,
        productPrice,
        productStock,
        productcategoryid,
        subcategoryid,
        productThumbnailUrl,
      ]
    );

    res.status(200).json({
      success: true,
      message: "successfully added product",
      product: productRow.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const addProductCategory = async (req: any, res: any) => {
  try {
    const { productCategory } = req.body;
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }

    const payloadData: Object = jwt.verify(
      req.cookies.accessToken,
      String(process.env.JWT_SECRET)
    );
    console.log(payloadData);
    const { userid } = Object(payloadData);

    const loggedInUserRow = await client.query(
      `SELECT * FROM users WHERE userid=$1`,
      [Number(userid)]
    );
    const loggedInUser = loggedInUserRow.rows[0];
    if (
      loggedInUser.email !== process.env.ADMIN_EMAIL ||
      loggedInUser.username !== process.env.ADMIN_USERNAME
    ) {
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

    const productCategoryRow = await client.query(
      `INSERT INTO productCategories(categoryname) VALUES($1) RETURNING *`,
      [productCategory.trim().toLowerCase()]
    );
    res.status(200).json({
      success: true,
      message: "successfully added product category",
      productCategory: productCategoryRow.rows[0],
    });
  } catch (error) {
    console.log("MY ERROR", error);
    res.status(400).json({
      success: false,
      message: "category name already exists",
    });
  }
};

const deleteProductCategory = async (req: any, res: any) => {
  try {
    const { id }: { id: number } = req.params;
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

    const payloadData: Object = jwt.verify(
      req.cookies.accessToken,
      String(process.env.JWT_SECRET)
    );
    console.log(payloadData);
    const { userid } = Object(payloadData);

    const loggedInUserRow = await client.query(
      `SELECT * FROM users WHERE userid=$1`,
      [Number(userid)]
    );
    const loggedInUser = loggedInUserRow.rows[0];
    if (
      loggedInUser.email !== process.env.ADMIN_EMAIL ||
      loggedInUser.username !== process.env.ADMIN_USERNAME
    ) {
      res.status(400).json({
        success: false,
        message: "This action can only be performed by an admin",
      });
      return;
    }

    //   checking if any products exists with this productcategoryid
    const productRows = await client.query(
      `SELECT * FROM products WHERE productcategoryid=$1`,
      [id]
    );
    if (productRows.rows.length !== 0) {
      res.status(400).json({
        success: false,
        message: "cannot delete category with products assigned to it",
      });
      return;
    }

    // deletion query
    await client.query(
      `DELETE FROM productCategories WHERE productcategoryid=$1`,
      [id]
    );
    res.status(200).json({
      success: true,
      message: "successfully deleted product category",
    });
  } catch (error) {
    console.log(error);
  }
};

const editProductCategory = async (req: any, res: any) => {
  try {
    const {
      newProductCategory,
      id,
    }: { newProductCategory: string; id: number } = req.body;
    console.log(req.body);
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }

    const payloadData: Object = jwt.verify(
      req.cookies.accessToken,
      String(process.env.JWT_SECRET)
    );
    console.log(payloadData);
    const { userid } = Object(payloadData);

    const loggedInUserRow = await client.query(
      `SELECT * FROM users WHERE userid=$1`,
      [Number(userid)]
    );
    const loggedInUser = loggedInUserRow.rows[0];
    if (
      loggedInUser.email !== process.env.ADMIN_EMAIL ||
      loggedInUser.username !== process.env.ADMIN_USERNAME
    ) {
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
    const checkCategoryExists = await client.query(
      `SELECT * FROM productCategories WHERE categoryname=$1`,
      [newProductCategory.trim().toLowerCase()]
    );
    console.log(checkCategoryExists.rows);

    if (checkCategoryExists.rows.length !== 0) {
      res.status(400).json({
        success: false,
        message: "category already exists",
      });
      return;
    }

    // update query
    await client.query(
      `UPDATE productCategories SET categoryname='${newProductCategory
        .trim()
        .toLowerCase()}' WHERE productcategoryid=${id}`
    );
    //   updated category
    const newCategory = await client.query(
      `SELECT * FROM productCategories WHERE productcategoryid=$1`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "successfully edited product category",
      newCategory: newCategory.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const addSubCategory = async (req: any, res: any) => {
  try {
    const {
      subcategoryname,
      productcategoryid,
    }: { subcategoryname: string; productcategoryid: number } = req.body;
    console.log(req.body);
    if (
      subcategoryname.trim() === "" ||
      typeof productcategoryid === "string" ||
      typeof subcategoryname === "number"
    ) {
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

    const payloadData: Object = jwt.verify(
      req.cookies.accessToken,
      String(process.env.JWT_SECRET)
    );
    console.log(payloadData);
    const { userid } = Object(payloadData);

    const loggedInUserRow = await client.query(
      `SELECT * FROM users WHERE userid=$1`,
      [Number(userid)]
    );
    const loggedInUser = loggedInUserRow.rows[0];
    if (
      loggedInUser.email !== process.env.ADMIN_EMAIL ||
      loggedInUser.username !== process.env.ADMIN_USERNAME
    ) {
      res.status(400).json({
        success: false,
        message: "This action can only be performed by an admin",
      });
      return;
    }

    // cannot have duplicate sub categories in same parent category;
    const dupCategoryCheck = await client.query(
      `SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`,
      [productcategoryid, subcategoryname.trim().toLowerCase()]
    );

    if (dupCategoryCheck.rows.length !== 0) {
      res.status(400).json({
        success: false,
        message: "subcategory already exists",
      });
      return;
    }

    // insert subcategory query
    const newSubCategory = await client.query(
      `INSERT INTO subCategories(subcategoryname,productcategoryid) VALUES($1,$2) RETURNING *`,
      [subcategoryname.trim().toLowerCase(), productcategoryid]
    );

    res.status(200).json({
      success: true,
      newSubCategory: newSubCategory.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const editSubCategory = async (req: any, res: any) => {
  try {
    const {
      newsubcategoryname,
      subcategoryid,
      productcategoryid,
    }: {
      newsubcategoryname: string;
      subcategoryid: number;
      productcategoryid: number;
    } = req.body;
    if (
      newsubcategoryname.trim() === "" ||
      typeof subcategoryid === "number" ||
      typeof productcategoryid === "number"
    ) {
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

    const payloadData: Object = jwt.verify(
      req.cookies.accessToken,
      String(process.env.JWT_SECRET)
    );
    console.log(payloadData);
    const { userid } = Object(payloadData);

    const loggedInUserRow = await client.query(
      `SELECT * FROM users WHERE userid=$1`,
      [Number(userid)]
    );
    const loggedInUser = loggedInUserRow.rows[0];
    if (
      loggedInUser.email !== process.env.ADMIN_EMAIL ||
      loggedInUser.username !== process.env.ADMIN_USERNAME
    ) {
      res.status(400).json({
        success: false,
        message: "This action can only be performed by an admin",
      });
      return;
    }

    // make sure another subcategory with same name doesn't exist in same parent category
    const checkSubCategory = await client.query(
      `SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`,
      [productcategoryid, newsubcategoryname.trim().toLowerCase()]
    );
    if (checkSubCategory.rows.length !== 0) {
      res.status(400).json({
        success: false,
        message: "another subcategory exists",
      });
      return;
    }

    // update query
    await client.query(
      `UPDATE subcategories SET subcategoryname=$1 WHERE productcategoryid=$2 AND subcategoryid=$3`,
      [
        newsubcategoryname.trim().toLowerCase(),
        productcategoryid,
        subcategoryid,
      ]
    );

    // getting updated subcategory obj
    const newSubCategoryRow = await client.query(
      `SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryid=$2`,
      [productcategoryid, subcategoryid]
    );
    res.status(200).json({
      success: true,
      newSubCategory: newSubCategoryRow.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteSubCategory = async (req: any, res: any) => {
  try {
    const { id }: { id: number } = req.params;
    // id => subcategoryid
    // need to be an admin to delete
    if (!req.cookies?.accessToken) {
      res.status(400).json({
        success: false,
        message: "user is not logged in",
      });
      return;
    }

    const payloadData: Object = jwt.verify(
      req.cookies.accessToken,
      String(process.env.JWT_SECRET)
    );
    console.log(payloadData);
    const { userid } = Object(payloadData);

    const loggedInUserRow = await client.query(
      `SELECT * FROM users WHERE userid=$1`,
      [Number(userid)]
    );
    const loggedInUser = loggedInUserRow.rows[0];
    if (
      loggedInUser.email !== process.env.ADMIN_EMAIL ||
      loggedInUser.username !== process.env.ADMIN_USERNAME
    ) {
      res.status(400).json({
        success: false,
        message: "This action can only be performed by an admin",
      });
      return;
    }

    // no products can be assigned to this subcategoryid when deleteing
    // checking if any products exist with this subcategoryid
    const isProducts = await client.query(
      `SELECT * FROM products WHERE subcategoryid=$1`,
      [id]
    );
    if (isProducts.rows.length !== 0) {
      res.status(400).json({
        success: false,
        message: "cannot delete subcategory with products assigned to it",
      });
      return;
    }

    // deletion query
    await client.query(`DELETE FROM subCategories WHERE subcategoryid=$1`, [
      id,
    ]);
    res.status(200).json({
      success: true,
      message: "successfully deleted subcategory",
    });
  } catch (error) {
    console.log(error);
  }
};

const getSubCategories = async (req: any, res: any) => {
  try {
    const { productcategoryid }: { productcategoryid: number | string } =
      req.body;
    console.log(req.body);
    if (productcategoryid === "" || typeof productcategoryid === "string") {
      res.json({
        success: false,
        message: "product category id error",
      });
      return;
    }
    const subCategoriesRows = await client.query(
      `SELECT * FROM subCategories WHERE productcategoryid=$1`,
      [productcategoryid]
    );
    res.status(200).json({
      success: true,
      subcategories: subCategoriesRows.rows,
    });
  } catch (error) {
    console.log(error);
  }
};

const getAllProductCategories = async (req: any, res: any) => {
  try {
    const productCategoryRows = await client.query(
      `SELECT * FROM productCategories`
    );
    res.status(200).json({
      success: true,
      productCategories: productCategoryRows.rows,
    });
  } catch (error) {
    console.log(error);
  }
};

export {
  uploadProductThumbnail,
  addProduct,
  addProductCategory,
  getAllProductCategories,
  deleteProductCategory,
  editProductCategory,
  getSubCategories,
  addSubCategory,
  editSubCategory,
  deleteSubCategory,
};
