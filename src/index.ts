import express from 'express'
import dotenv from 'dotenv'
dotenv.config({
    path:"C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backend\\src\\.env",
})
import {Client} from 'pg'
import multer from 'multer';
import { getLoggedInUser, loginUser, logoutUser, registerUser, uploadAvatar } from './controllers/user.controller';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import { addProduct, addProductCategory, deleteProductCategory, editProductCategory, getAllProductCategories, uploadProductThumbnail } from './controllers/product.controller';

type dbObj = {
    database:string | undefined;
    host:string | undefined;
    port:number | undefined;
    user:string | undefined;
    password:string | undefined;
} 

const app = express();
const port:string|undefined=process.env.PORT;

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backend\\src\\Public')
    },
    filename: function(req,file,cb){
        cb(null,file.originalname);
    }
})
const upload = multer({storage:storage});


const pgObj:dbObj = {
    database:process.env.DB_NAME,
    host:process.env.DB_HOST,
    port:Number(process.env.DB_PORT),
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
}

// DB CONNECTION
export const client = new Client(pgObj);

const connectToDb = async () => {
    try {
        await client.connect();
        console.log('DB CONNECTED');
    } catch (error) {
        console.log(error);
    }
}
connectToDb();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}));

// user routes
app.post('/user/register',upload.single('avatar'),registerUser);
app.post('/user/login',loginUser);
app.get('/user/logout',logoutUser);
app.get('/user/getLoggedInUser',getLoggedInUser);
app.post('/user/uploadAvatar',upload.single('avatar'),uploadAvatar);


// product routes
app.post('/product/uploadProductThumbnail',upload.single('productThumbnail'),uploadProductThumbnail);
app.post('/product/add',addProduct);
app.post('/product/addCategory',addProductCategory);
app.get('/product/getAllProductCategories',getAllProductCategories);
app.delete('/product/deleteProductCategory/:id',deleteProductCategory);
app.put('/product/editProductCategory',editProductCategory);

app.listen(port,()=>{
    console.log(`server running at http://localhost:${port}`);
})