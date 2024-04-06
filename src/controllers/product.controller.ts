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
      subCategory: string;
    };
    
    const {
      productName,
      productThumbnailUrl,
      productDescription,
      productPrice,
      productStock,
      productCategory,
      subCategory,
    }: productFieldsType = req.body;
    console.log(req.body);
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
      subCategory,
    ];

    let isEmpty = false;

    productFields.forEach((val) => {
      if (typeof val === "string") {
        if (val.trim() === "") {
          isEmpty = true;
        }
      } else {
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
    const productCategoryRow = await client.query(
      `SELECT * FROM productCategories WHERE categoryname=$1`,
      [productCategory]
    );
    const { productcategoryid } = productCategoryRow.rows[0];

    // getting subcategoryid from subcategoryname and productcategoryid
    const subCategoryRow = await client.query(
      `SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`,
      [productcategoryid, subCategory]
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

const addMultipleProducts = async (req:any,res:any) => {
try {
    const {csvData} = req.body;
    console.log(csvData);
    // csvData is an array
    // need to be an admin to add products
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
    let newProducts = [];
    // looping through each object in csvData
    for(let i=0;i<csvData.length;i++){
      // getting categoryid from categoryname
      const categoryRow = await client.query(`SELECT * FROM productCategories WHERE categoryname=$1`,[csvData[i].categoryname.trim().toLowerCase()]);
      const productcategoryid=categoryRow.rows[0].productcategoryid;
      // getting subcategoryid from subcategoryname and productcategoryid
      const subCategoryRow = await client.query(`SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryname=$2`,[productcategoryid,csvData[i].subcategoryname.trim().toLowerCase()]);
      const subcategoryid = subCategoryRow.rows[0].subcategoryid;
  
      // inserting into products
      const newProductRow = await client.query(`INSERT INTO products(productname,productdescription,productprice,productstock,productcategoryid,subcategoryid,productthumbnail) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[csvData[i].productname,csvData[i].productdescription,csvData[i].productprice,csvData[i].productstock,productcategoryid,subcategoryid,csvData[i].productthumbnail]);
      newProducts.push(newProductRow.rows[0])
    }
  
    res.status(200).json({
      "success":true,
      "newProducts":newProducts,
    })
} catch (error) {
  console.log(error);
}

}

const deleteProduct = async (req: any, res: any) => {
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

    // deletion query
    await client.query(`DELETE FROM products WHERE productid=$1`, [id]);
    res.status(200).json({
      success: true,
      message: "successfully deleted product",
    });
  } catch (error) {
    console.log(error);
  }
};

const editProduct = async (req: any, res: any) => {
  try {
    type productFieldsType = {
      newProductName: string;
      newProductThumbnailUrl: string;
      newProductDescription: string;
      newProductPrice: number;
      newProductStock: number;
      newProductCategoryId: number;
      newSubCategoryId: number;
      productid: number;
    };

    const {
      newProductName,
      newProductPrice,
      newProductStock,
      newProductDescription,
      newProductThumbnailUrl,
      newProductCategoryId,
      newSubCategoryId,
      productid,
    }: productFieldsType = req.body;

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
      } else {
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
    await client.query(
      `UPDATE products SET productname=$1,productdescription=$2,productprice=$3,productstock=$4,productcategoryid=$5,subcategoryid=$6,productthumbnail=$7 WHERE productid=$8`,
      [
        newProductName,
        newProductDescription,
        newProductPrice,
        newProductStock,
        newProductCategoryId,
        newSubCategoryId,
        newProductThumbnailUrl,
        productid,
      ]
    );

    // getting updated product
    const updatedProductRow = await client.query(
      `SELECT * FROM products WHERE productid=$1`,
      [productid]
    );
    res.status(200).json({
      success: true,
      updatedProduct: updatedProductRow.rows[0],
      message: "successfully edited product",
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


const sortByAmount = async (req:any,res:any) => {
try {
    const {sortByProductAmount}:{sortByProductAmount:number} = req.body;
  
    // need to be an admin to sort by products
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
    let productRows;
    if(sortByProductAmount===0){
       productRows = await client.query(`SELECT * FROM products`);
    } else if(sortByProductAmount===1){
      productRows = await client.query(`SELECT * FROM products ORDER BY productprice ASC`);
    } else{
      productRows = await client.query(`SELECT * FROM products ORDER BY productprice DESC`);
    }
    res.status(200).json({
      "success":true,
      "products":productRows.rows,
    })
} catch (error) {
  console.log(error);
}
}


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

const getSubCategoriesByCategoryName = async (req: any, res: any) => {
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
    const categoryRow = await client.query(
      `SELECT * FROM productCategories WHERE categoryname=$1`,
      [categoryname]
    );
    const productcategoryid = categoryRow.rows[0].productcategoryid;

    // getting subcategires
    const subCategoriesRows = await client.query(
      `SELECT * FROM subCategories WHERE productcategoryid=$1`,
      [productcategoryid]
    );
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
  } catch (error) {
    console.log(error);
  }
};

const getProductCategoryById = async (req: any, res: any) => {
  try {
    const { productcategoryid } = req.body;
    const productCategoryRow = await client.query(
      `SELECT * FROM productCategories WHERE productcategoryid=$1`,
      [productcategoryid]
    );
    res.status(200).json({
      success: true,
      categoryname: productCategoryRow.rows[0].categoryname,
    });
  } catch (error) {
    console.log(error);
  }
};

const getSubCategoryById = async (req: any, res: any) => {
  try {
    const { productcategoryid, subcategoryid } = req.body;
    const subCategoryRow = await client.query(
      `SELECT * FROM subCategories WHERE productcategoryid=$1 AND subcategoryid=$2`,
      [productcategoryid, subcategoryid]
    );
    res.status(200).json({
      success: true,
      subcategoryname: subCategoryRow.rows[0].subcategoryname,
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

const getAllProducts = async (req: any, res: any) => {
  try {
    const productRows = await client.query(`SELECT * FROM products`);
    res.status(200).json({
      success: true,
      products: productRows.rows,
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
  getSubCategoriesByCategoryName,
  getAllProducts,
  getProductCategoryById,
  getSubCategoryById,
  editProduct,
  deleteProduct,
  sortByAmount,
  addMultipleProducts,
};
