"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: "C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backend\\src\\.env",
});
const pg_1 = require("pg");
const multer_1 = __importDefault(require("multer"));
const user_controller_1 = require("./controllers/user.controller");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const product_controller_1 = require("./controllers/product.controller");
const app = (0, express_1.default)();
const port = process.env.PORT;
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backend\\src\\Public');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage: storage });
const pgObj = {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};
// DB CONNECTION
exports.client = new pg_1.Client(pgObj);
// IIFE - Immediately invoked function expressions
(async () => {
    try {
        await exports.client.connect();
        console.log('DB CONNECTED');
    }
    catch (error) {
        console.log(error);
    }
})();
// middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
// user routes
app.post('/user/register', upload.single('avatar'), user_controller_1.registerUser);
app.post('/user/login', user_controller_1.loginUser);
app.get('/user/logout', user_controller_1.logoutUser);
app.get('/user/getLoggedInUser', user_controller_1.getLoggedInUser);
app.post('/user/uploadAvatar', upload.single('avatar'), user_controller_1.uploadAvatar);
app.put('/user/editUsername', user_controller_1.editUsername);
app.put('/user/editPassword', user_controller_1.editPassword);
// product routes
app.post('/product/uploadProductThumbnail', upload.single('productThumbnail'), product_controller_1.uploadProductThumbnail);
app.post('/product/add', product_controller_1.addProduct);
app.post('/product/addCategory', product_controller_1.addProductCategory);
app.get('/product/getAllProductCategories', product_controller_1.getAllProductCategories);
app.get('/product/getAllProducts', product_controller_1.getAllProducts);
app.delete('/product/deleteProductCategory/:id', product_controller_1.deleteProductCategory);
app.put('/product/editProductCategory', product_controller_1.editProductCategory);
app.post('/product/getSubCategories', product_controller_1.getSubCategories);
app.post('/product/addSubCategory', product_controller_1.addSubCategory);
app.put('/product/editSubCategory', product_controller_1.editSubCategory);
app.delete('/product/deleteSubCategory/:id', product_controller_1.deleteSubCategory);
app.post('/product/getSubCategoriesByCategoryName', product_controller_1.getSubCategoriesByCategoryName);
app.post('/product/getProductCategoryById', product_controller_1.getProductCategoryById);
app.post('/product/getSubCategoryById', product_controller_1.getSubCategoryById);
app.put('/product/edit', product_controller_1.editProduct);
app.delete('/product/deleteProduct/:id', product_controller_1.deleteProduct);
app.post('/product/sortByAmount', product_controller_1.sortByAmount);
app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
});
