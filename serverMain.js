
import express from 'express';
import cors from 'cors'; 
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose'
import UserModel from './models/User.js';

//App definition
const app = express();

//To use JSON data from POSTMAN
app.use(express.json());

//const encoder = bodyParser.urlencoder();
app.use(cookieParser());

app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true
}));

mongoose.connect('mongodb://127.0.0.1:27017/person')

app.post('/registerUser', (req, res) => {
    const {username, email, password} = req.body;
    UserModel.create({username, email, password})
    .then(user => res.json(user))
    .catch(err => res.json(err))
    });

app.post('/loginUser', async (req, res) => {
    const { email, password } = req.body;
    UserModel.findOne({email})
    .then(user =>{
        if(user) {
            if(user.password === password){
                const accessToken = jwt.sign({email: email},
                    "jwt-access-token-secret-key", {expiresIn: '1m'})
                const refreshToken = jwt.sign({email: email},
                    "jwt-refresh-token-secret-key", {expiresIn: '5m'})

                res.cookie('accessToken', accessToken, {maxAge: 60000})

                res.cookie('refreshToken', refreshToken,
                     {maxAge: 300000, httpOnly: true, secure: true, sameSite: 'strict'})
                return res.json({Login: true})
            }
        }else{
            res.json({Login: false, Message: 'No Record Exist'})
        }
    }).catch(err => res.json(err))

const  verifyUser = (req, res, next) =>{
    const accesstoken = req.cookie.accessToken;
    if(!accesstoken){
        if(renewToken(req, res)){
            next()
        }
    }else{
        jwt.verify(accesstoken, 'jwt-access-token-secret-key', (err, decoded) =>{
            if(err){
                return res.json({valid: false, message: "Invalid Token"})
            }else{
                req.email = decoded.email
                next()
            }
        })
    }
}

const  renewToken = (req, res) =>{

    const refreshtoken = req.cookies.refreshToken;
    let exists = false;

    if(!refreshtoken){
        return res.json({valid: false, message: "No refresh token"})
    }else{
        jwt.verify(refreshtoken, 'jwt-refresh-token-secret-key', (err, decoded) =>{
            if(err){
                return res.json({valid: false, message: "Invalid Refresh Token"})
            }else{
                const accessToken = jwt.sign({email: decoded.email},
                    "jwt-access-token-secret-key", {expiresIn: '1m'})
                
                res.cookie('accessToken', accessToken, {maxAge: 60000})
                exists = true
            }
        })
    }
    return exists;
}


app.get('/dashboard', verifyUser, (req, res) =>{
        return res.json({valid: true, message: "Authorized"})
    })
});

 
//To start the server
app.listen(8000, () =>{
    console.log("Server is actively running...");
});