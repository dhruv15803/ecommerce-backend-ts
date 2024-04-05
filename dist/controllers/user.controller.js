"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editAvatar = exports.editPassword = exports.editUsername = exports.uploadAvatar = exports.getLoggedInUser = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config({
    path: "C:\\Users\\DHRUV\\Desktop\\typescript-projects\\ecommerce-app\\backendsrc\\.env",
});
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const registerUser = async (req, res) => {
    try {
        const { email, username, password, confirmPassword, firstname, lastname, } = req.body;
        let avatarUrl = "";
        let localFilePath;
        let isadmin = false;
        // any register fields cannot be empty
        const registerFields = [
            email,
            username,
            password,
            confirmPassword,
            firstname,
            lastname,
        ];
        if (req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is logged in",
            });
            return;
        }
        registerFields.forEach((val) => {
            if (val.trim() === "") {
                if (req.file) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                res.status(400).json({
                    success: false,
                    message: "Please enter all fields",
                });
                return;
            }
        });
        if (password !== confirmPassword) {
            if (req.file) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(400).json({
                success: false,
                message: "password and confirm password do not match",
            });
            return;
        }
        // check if username or email already exists
        const isUser = await index_1.client.query(`SELECT * FROM users WHERE username=$1 OR email=$2`, [username.trim().toLowerCase(), email.trim().toLowerCase()]);
        if (isUser.rows.length !== 0) {
            if (req.file) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(400).json({
                success: false,
                message: "username or email already exists",
            });
            return;
        }
        // if user is registering then ofcourse it cannot be logged in
        if (req.file) {
            localFilePath = req.file.path;
            const { url } = await cloudinary_1.v2.uploader.upload(localFilePath, {
                resource_type: "auto",
            });
            avatarUrl = url;
            fs_1.default.unlinkSync(localFilePath);
        }
        // checking if password and confirm password are equal
        // hashing password
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // isadmin
        if (username.trim().toLowerCase() === process.env.ADMIN_USERNAME &&
            email.trim().toLowerCase() === process.env.ADMIN_EMAIL &&
            password.trim() === process.env.ADMIN_PASSWORD) {
            isadmin = true;
        }
        const newUser = await index_1.client.query(`INSERT INTO users(username,email,firstname,lastname,avatarurl,isadmin,password) VALUES('${username
            .trim()
            .toLowerCase()}','${email
            .trim()
            .toLowerCase()}','${firstname.trim()}','${lastname.trim()}','${avatarUrl}',${isadmin},'${hashedPassword}')`);
        res.status(200).json({
            success: true,
            message: "user registered successfully",
            user: newUser.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // check if a user is already logged in
        if (req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is logged in",
            });
            return;
        }
        // check if user is registered into the system
        const isUser = await index_1.client.query(`SELECT * FROM users WHERE email=$1`, [
            email.trim().toLowerCase(),
        ]);
        if (isUser.rows.length === 0) {
            res.status(400).json({
                success: false,
                message: "email or password is incorrect",
            });
            return;
        }
        // checking if password is correct
        const isCorrect = await bcrypt_1.default.compare(password, isUser.rows[0].password);
        if (!isCorrect) {
            res.status(400).json({
                success: false,
                message: "email or password is incorrect",
            });
        }
        // email and password are correct
        // generating token using jwt
        const token = jsonwebtoken_1.default.sign({ userid: isUser.rows[0].userid }, String(process.env.JWT_SECRET), {
            expiresIn: "1d",
        });
        res
            .status(200)
            .cookie("accessToken", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 1000 * 60 * 24),
        })
            .json({
            success: true,
            message: "user logged in successfully",
            user: isUser.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.loginUser = loginUser;
const logoutUser = async (req, res) => {
    try {
        // the user needs to be logged in to logout
        // 1: check if the user is logged in
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        res.clearCookie("accessToken");
        res.status(200).json({
            success: true,
            message: "user successfully logged out",
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.logoutUser = logoutUser;
const uploadAvatar = async (req, res) => {
    try {
        console.log(req.file);
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "file not available",
            });
            return;
        }
        const localFilePath = req.file.path;
        const { url } = await cloudinary_1.v2.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        res.status(200).json({
            success: true,
            url,
        });
        fs_1.default.unlinkSync(localFilePath);
    }
    catch (error) {
        console.log(error);
    }
};
exports.uploadAvatar = uploadAvatar;
const getLoggedInUser = async (req, res) => {
    // check if user is logged in
    try {
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        const { userid } = Object(payload);
        const user = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [
            Number(userid),
        ]);
        if (user.rows.length === 0) {
            res.status(500).json({
                success: false,
                message: "something went wrong with DB",
            });
            return;
        }
        res.status(200).json({
            success: true,
            user: user.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getLoggedInUser = getLoggedInUser;
const editUsername = async (req, res) => {
    try {
        const { newUsername } = req.body;
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        const { userid } = Object(payload);
        // check if new username is empty
        if (newUsername.trim() === "") {
            res.status(400).json({
                success: false,
                message: "please enter a username",
            });
            return;
        }
        // check if another user has this username
        const isUsername = await index_1.client.query(`SELECT * FROM users WHERE username=$1`, [newUsername.trim().toLowerCase()]);
        if (isUsername.rows.length !== 0) {
            res.status(400).json({
                success: false,
                message: "username already exists",
            });
            return;
        }
        // updating user with new Username
        await index_1.client.query(`UPDATE users SET username=$1 WHERE userid=$2`, [
            newUsername.trim().toLowerCase(),
            userid,
        ]);
        // getting updated user
        const userRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [
            userid,
        ]);
        res.status(200).json({
            success: true,
            newUser: userRow.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.editUsername = editUsername;
const editPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        console.log(newPassword);
        // need to be logged in
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        const { userid } = Object(payload);
        if (newPassword.trim() === "") {
            res.status(400).json({
                success: false,
                message: "password cannot be an empty field",
            });
            return;
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(newPassword, salt);
        // updating password in user
        await index_1.client.query(`UPDATE users SET password=$1 WHERE userid=$2`, [
            hashedPassword,
            userid,
        ]);
        // getting updated user
        const userRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [
            userid,
        ]);
        res.status(200).json({
            success: true,
            message: "successfully edited password",
            newUser: userRow.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.editPassword = editPassword;
const editAvatar = async (req, res) => {
    try {
        const { newAvatarUrl } = req.body;
        // need to be logged in
        if (!req.cookies?.accessToken) {
            res.status(400).json({
                success: false,
                message: "user is not logged in",
            });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(req.cookies.accessToken, String(process.env.JWT_SECRET));
        const { userid } = Object(payload);
        if (newAvatarUrl.trim() === "") {
            res.status(400).json({
                "success": false,
                "message": "avatar url is empty"
            });
            return;
        }
        // update query
        await index_1.client.query(`UPDATE users SET avatarurl=$1 WHERE userid=$2`, [newAvatarUrl, userid]);
        // getting updated user
        const newUserRow = await index_1.client.query(`SELECT * FROM users WHERE userid=$1`, [userid]);
        res.status(200).json({
            "success": true,
            "message": "successfully edited avatar",
            "newUser": newUserRow.rows[0],
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.editAvatar = editAvatar;
