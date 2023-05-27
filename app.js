//jshint esversion:6
require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const bcrypt = require("bcrypt")
// const saltRounds = 10
// const md5 = require("md5")
// const encrypt = require("mongoose-encryption")


const app = express()

app.use(express.static("public"))

app.set("view engine","ejs")

app.use(bodyParser.urlencoded({extended:true}))

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize())

app.use(passport.session())

mongoose.connect("mongodb+srv://venkatasai24042004:PlBtdPBaTwUugI4S@cluster0.s6se6mz.mongodb.net/secretsDB",{useNewUrlParser:true})
.then(()=>{console.log("mongodb server connected")})
.catch((err)=>{console.log(err)})

const newSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId: String,
    secret:[String]
})

newSchema.plugin(passportLocalMongoose)

newSchema.plugin(findOrCreate);


// newSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]})

const user = new mongoose.model("user",newSchema)

passport.use(user.createStrategy());

// passport.serializeUser(user.serializeUser());

// passport.deserializeUser(user.deserializeUser());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
    });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy(
    {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) 
    {
        user.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
    });
    }
));

app.get("/",(req,res)=>{
    res.render("home")
})

app.get('/auth/google',passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
    res.redirect('/secrets');
});

app.get("/register",(req,res)=>{
    res.render("register",{message:""})
})

app.get("/login",(req,res)=>{
    if(req.isAuthenticated()){res.redirect("/secrets")}
    else{res.render("login",{message:""})}
    // res.render("login")
})

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated())
    {
        user.findById(req.user.id)
        .then((user) => {
        if (!user) {
            console.log('User not found');
        } else {
            res.render("secrets",{secrets:user});
        }
        })
        .catch((err) => {
            console.error('Error finding user:', err);
        });
    }
    else
    {
        res.redirect("/login");
    }
})

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){res.render("submit")}
    else{res.redirect("/login")}
})


app.get("/logout",(req,res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})

app.post("/register",(req,res)=>
{
    // bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
        //     const newUser = {
            //         email:req.body.username,
            //         // password:md5(req.body.password)
    //         password:hash
    //     }
    //     user.findOne({email:req.body.username})
    //     .then((response)=>{
        //         if(response === null )
        //         {
            //             user.create(newUser)
            //             .then(()=>res.render("secrets"))
            //             .catch((err)=>console.log(err))
            //         }
            //         else
            //         {
                //             res.json("User with that email already exists")
                //         }
                //     })
                //     .catch((err)=>console.log(err))
                // });
                
                user.register({username:req.body.username},req.body.password,function(err,result)
                {
        if(err)
        {
            res.render("register",{message:err.name})
        }
        else
        {
            passport.authenticate("local")(req,res,function()
            {
                res.redirect("/secrets")
            })
        }
    })
})

app.post("/login", (req, res, next) => {
    const newUser = new user({
    username: req.body.username,
    password: req.body.password
});

passport.authenticate("local", function(err, user, info) {
    if (err) {
        console.log(err);
    }
    
    if (!user) {
        // Authentication failed, handle accordingly
        if(info.message==="Missing credentials") return res.render("login",{message:"Missing credentials"})
        return res.render("login",{message:info.name})
        // return res.redirect("/login"); // Redirect to the login page or any other appropriate page
    }
    
    req.login(user, function(err) {
    if (err) {
        console.log(err);
    }
    return res.redirect("/secrets");
});
})(req, res, next);
});

app.post("/edit",(req,res)=>
{
    res.render("update",{message:req.body})
})


// app.post("/login",(req,res)=>
// {
//         // const {username,password} = req.body;
//         // user.findOne({email:username})
//         // .then((response)=>{
//             //     if(response === null )
//             //     {
//                 //         res.json("user not found")
//                 //     }
//     //     // else if(response.password === md5(password) )
//     //     else
//     //     {
//         //         bcrypt.compare(password,response.password).then(function(result) {
//             //             if(result){res.render("secrets")}
//             //             else{res.json("wrong password")}
//             //         });
//             //     }
//             //     // else if(response.password === password )
//             //     // {
//                 //     //     res.render("secrets")
//                 //     // }
//                 //     // else {res.json("wrong password")}
//                 // })
//                 // .catch((err)=>console.log(err))
            
//                 const newUser = new user({
//                         username:req.body.username,
//                         password:req.body.password
//                     })
                
//                     req.login(newUser,function(err)
//                     {
//                             if(err)
//         { 
//                 console.log(err)
//             }
//             else
//             {
//                     passport.authenticate("local")(req,res,function()
//                     {
//                             res.redirect("/secrets")
//                         })
//                     }
//                 })
//             })
            
            app.post("/submit",(req,res)=>
            {
                const newSecret = req.body.secret;
                user.findById(req.user.id)
                .then((user) => {
                    if (!user) {
        console.log('User not found');
    } else {
        user.secret.push(newSecret) ;
        user.save()
        .then(() => res.redirect("/secrets"))
        .catch(err => console.error(err));
    }
})
.catch((err) => {
    console.error('Error finding user:', err);
});
})

app.post("/update",(req,res)=>
{
    const {prevsecret,id,secret} = req.body ;
    user.updateOne(
    { _id: id, 'secret': prevsecret }, // Match the document with the specific user ID and the element you want to update
    { $set: { 'secret.$': secret } }) // Use $set and positional operator $ to update the matching element
    .then(()=>res.redirect("/secrets"))
    .catch((err)=>console.log(err))
})

app.post("/delete",(req,res)=>{
    const {id,secret} = req.body ;
    user.updateOne(
    { _id: id}, // Filter condition to identify the document
    { $pull: { "secret": secret } })
    .then(()=>res.redirect("/secrets"))
    .catch((err)=>console.log(err))
})


app.listen(3000,()=>console.log("server started at port 3000"))
