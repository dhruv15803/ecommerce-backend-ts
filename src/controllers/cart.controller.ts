import jwt from "jsonwebtoken";
import { client } from "../index";
import dotenv from "dotenv";
dotenv.config({
  path: "C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backendsrc\\.env",
});

const addToCart = async (req: any, res: any) => {
  try {
    const { productid, itemqty }: { productid: number; itemqty: number } =
      req.body;
    console.log(req.body);
    // need to be logged in
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

    // checking if product already exists in cart of logged in user
    const isProductInCart = await client.query(
      `SELECT * FROM cart WHERE userid=$1 AND productid=$2`,
      [userid, productid]
    );
    if (isProductInCart.rows.length !== 0) {
      // getting itemqty
      const itemQty = await client.query(
        `SELECT * FROM cart WHERE userid=$1 AND productid=$2`,
        [userid, productid]
      );
      const qty = itemQty.rows[0].itemqty;
      // updating itemqty
      await client.query(
        `UPDATE cart SET itemqty=$1 WHERE userid=$2 AND productid=$3`,
        [qty + 1, userid, productid]
      );
    } else {
      await client.query(
        `INSERT INTO cart(productid,itemqty,userid) VALUES($1,$2,$3)`,
        [productid, itemqty, userid]
      );
    }

    const newCartRow = await client.query(
      `SELECT * FROM cart INNER JOIN products ON cart.productid=products.productid WHERE cart.userid=$1 AND cart.productid=$2`,
      [userid, productid]
    );

    res.status(200).json({
      success: true,
      message: "successfully added to cart",
      newCartItem: newCartRow.rows[0],
    });
  } catch (error) {
    console.log(error);
  }
};

const getCartProducts = async (req: any, res: any) => {
  // need to be logged in
  try {
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

    const cartRows = await client.query(
      `SELECT * FROM cart INNER JOIN products ON cart.productid=products.productid WHERE cart.userid=$1`,
      [userid]
    );
    res.status(200).json({
      success: true,
      cartProducts: cartRows.rows,
    });
  } catch (error) {
    console.log(error);
  }
};


const deleteCartItem = async (req:any,res:any) => {
try {
        const {id}:{id:number} = req.params;
        // need to be logged in 
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
    
        //   delete query
        await client.query(`DELETE FROM cart WHERE userid=$1 AND cartid=$2`,[userid,id]);
        res.status(200).json({
            "success":true,
            "message":"successfully deleted cart item"
        })
} catch (error) {
    console.log(error);
}
}

const incrementQty = async (req:any,res:any) => {
try {
        const {itemqty,cartid}:{itemqty:number,cartid:number} = req.body;
        // need to be logged in 
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
    
        //   update query
        await client.query(`UPDATE cart SET itemqty=$1 WHERE userid=$2 AND cartid=$3`,[itemqty+1,userid,cartid]);
        res.status(200).json({
            "success":true,
            "message":"successfully incremented quantity"
        })
} catch (error) {
    console.log(error);
}
}


const decrementQty = async (req:any,res:any) => {
    try {
        const {itemqty,cartid}:{itemqty:number,cartid:number} = req.body;
        // need to be logged in 
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
    
        //   update query
        await client.query(`UPDATE cart SET itemqty=$1 WHERE userid=$2 AND cartid=$3`,[itemqty-1,userid,cartid]);
        res.status(200).json({
            "success":true,
            "message":"successfully incremented quantity"
        })
} catch (error) {
    console.log(error);
}
}

export { addToCart,getCartProducts ,deleteCartItem,incrementQty,decrementQty};
