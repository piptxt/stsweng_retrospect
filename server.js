    const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const { createHash } = require('crypto');
const mongoDBStore = require('connect-mongodb-session')(session);

let app = express();

// Function for Google Login
function isLoggedIn(req,res,next) {
    req.user ? next() : res.sendStatus(401);
}

// Middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('./public'));

const retrospectDB = "mongodb+srv://retrospect:Retrosp3ct@retrospect.fboiauc.mongodb.net/retrospectDB";
const retrospectConnection = mongoose.connect(retrospectDB);

// WHERE THE FILES WILL BE STORES WHEN UPLOADED
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/items'); // cb(error, folder where files are stored)
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + "-" + file.originalname); // cb(error, new filename)
    }

})
const upload = multer({storage: storage})

// Initializing session
const sessionStore = new mongoDBStore({
    uri: retrospectDB,
    url: retrospectConnection,
    collection: 'sessions'
});
app.use(session({
    secret: 'some secret ya foo',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {secure: false} // Google Login
}));
const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    } else {
        res.redirect('/log-in')
    }
}
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

// Google Login
require('./auth');
const passport = require('passport');

app.use(passport.initialize());
app.use(passport.session());

// SCHEMAS
const UserModel = require('./models/userDB');
const UserCartModel = require('./models/user_cartDB');
const ItemsModel = require('./models/itemsDB');
const OrdersModel = require('./models/ordersDB');
const BlogsModel = require('./models/blogsDB');
const { findOneAndDelete } = require('./models/user_cartDB');
const items = require('./models/itemsDB');
const { AsyncResource } = require('async_hooks');
const usercart = require('./models/user_cartDB');
const blogs = require('./models/blogsDB');

// Google Login Pages
app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( '/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/',
        failureRedirect: '/auth/google/failure' // need to configure for google login failure
}));

app.get('/auth/google/failure',(req,res)=>{
    res.send('Something went wrong');
});

app.get('/auth/protected', isLoggedIn,(req,res)=>{
    let name = req.user.displayName;
    console.log(req.user);
    res.send(`Hello ${name}`);
});

// LANDING PAGE
app.get('/', async function(req, res){
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    // Google Account Logged In
    if (req.user) {
        console.log(req.user);
        console.log(req.session);

        const existingEmail = await UserModel.findOne({ email: req.user.email});
        // Validation if there is already an existing record with same id
        if (existingEmail) {
            console.log('Account already exists');
            curr_user = await UserModel.findOne({ email:req.user.email});
            console.log(curr_user);
        } else {
            const space = /\s/.test(req.user.given_name);
            const giveName = req.user.given_name;

            var firstname = "";
            
            if(space) {
                firstname = giveName.split(' ')[0];
            } else {
                firstname = giveName;
            }
            
            curr_user = new UserModel({
                username: firstname,
                user_type: 0,
                email: req.user.email,
                password: "google_account"
            });
            await curr_user.save();

            //create cart for the user
            const newUserCart = await UserCartModel({
                user_id: curr_user,
                username: req.user.displayName,
                items: []
            });
            await newUserCart.save();

            console.log('success!')
            console.log(curr_user);
        } 
    }

    res.render('landing-page', {
        curr_user: curr_user
    });
});
app.get('/landing-page', async function(req, res){
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    // Google Account Logged In
    if (req.user) {
        console.log(req.user);
        console.log(req.session);

        const existingEmail = await UserModel.findOne({ email: req.user.email});
        // Validation if there is already an existing record with same id
        if (existingEmail) {
            console.log('Account already exists');
            curr_user = await UserModel.findOne({ email:req.user.email});
            console.log(curr_user);
        } else {
            curr_user = new UserModel({
                username: req.user.displayName,
                user_type: 0,
                email: req.user.email,
                password: "google_account"
            });
            await curr_user.save();

            //create cart for the user
            const newUserCart = await UserCartModel({
                user_id: curr_user,
                username: req.user.displayName,
                items: []
            });
            await newUserCart.save();

            console.log('success!')
        } 
    }

    res.render('landing-page',{
        curr_user: curr_user
    });

});

// ABOUT US
app.get('/about-us', async function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    // Google Account Logged In
    if (req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
    }

    res.render('about-us',{
        curr_user: curr_user
    });
});

// SHOP
app.get('/shop', async function(req, res){
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    // Google Account Logged In
    if (req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
    }

    const items = await ItemsModel.find({});

    res.render('shop',{
        curr_user: curr_user,
        items: items
    });
});

// SHOPPING-CART
app.get('/shopping-cart', async function(req, res){

    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    // Google Account Logged In
    if (req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
    }
    var cart_items = "";
    
    if(req.session.isAuth){
        cart_items = await UserCartModel.find({user_id: req.session._id});
    }

    if(req.user){
        cart_items = await UserCartModel.find({user_id: curr_user._id});
    }
    
    // console.log(cart_items);

    return res.render('shopping-cart', {
        curr_user: curr_user,
        cart_items: cart_items,
        msg: null,
    })
});
// DELETE ITEM IN SHOPPING CART
app.get('/delete-item/:user_id/:item_name/:size', async function(req, res) {
    const {user_id, item_name, size} = req.params

    console.log(req.params);

    const delete_item = "";
    if(req.session.isAuth) {
        delete_item = await UserCartModel.updateOne(
        {user_id: req.session._id},
        {$pull: {
            items: {
                item_name: item_name,
                size: size
                }
            }
        }
    );
    }

    if(req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
        delete_item = await UserCartModel.updateOne(
        {user_id: curr_user._id},
        {$pull: {
            items: {
                item_name: item_name,
                size: size
                }
            }
        }
    );
    }

    res.redirect('/shopping-cart');
});

//ADD ITEM TO USER CART
app.post('/add-to-cart', async function(req, res){

    if(req.session.isAuth == undefined && req.user == undefined){
        console.log("Need Account Before adding to cart");
        return res.render('login', {
            msg: "An account is needed before adding to cart."
        });
    }

    const items = await ItemsModel.find({});

    const {item_name, item_photo ,price, size, quantity} = req.body;
    const total_price = quantity * price;

    const item =  {item_name, item_photo, price, size, quantity, total_price}

    var find_item = "";
    if (req.session.isAuth) {
        find_item = await UserCartModel.findOne({
        user_id: req.session._id,
        items: {
            $elemMatch: {
                item_name: item_name,
                size: size
            }
        }
    });
    }
    
    if (req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
        find_item = await UserCartModel.findOne({
        user_id: curr_user._id,
        items: {
            $elemMatch: {
                item_name: item_name,
                size: size
            }
        }
    });
    console.log(find_item);
    }
    
    var user_cart = "";
    if (req.session.isAuth) {
        if(find_item) { // IF ITEMS EXIST JUST ADD CURRENT ITEM
        user_cart = await UserCartModel.updateOne({
                user_id: req.session._id,
                items: {
                    $elemMatch: {
                        item_name: item_name,
                        size: size
                    }
                }
            }, {
                $inc:{
                    "items.$.quantity": quantity,
                    "items.$.total_price": total_price
                }
            });
            console.log(user_cart);
    } else { // IF ITEM DOES NOT EXIST
        console.log("item doesnt exist")
        user_cart = await UserCartModel.updateOne(
            {user_id: req.session._id},
            {$push: {items: item}}
        );
    }
    }

    if(req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
        if(find_item) { // IF ITEMS EXIST JUST ADD CURRENT ITEM
        user_cart = await UserCartModel.updateOne({
                user_id: curr_user._id,
                items: {
                    $elemMatch: {
                        item_name: item_name,
                        size: size
                    }
                }
            }, {
                $inc:{
                    "items.$.quantity": quantity,
                    "items.$.total_price": total_price
                }
            });
            console.log(user_cart);
    } else { // IF ITEM DOES NOT EXIST
        curr_user = await UserModel.findOne({ email:req.user.email});
        console.log("item doesnt exist")
        user_cart = await UserCartModel.updateOne(
            {user_id: curr_user.id},
            {$push: {items: item}}
        );
    }
    }
    

    return res.redirect('/shop');
});

// ORDER CHECKOUT
app.post('/checkout', async function(req, res) {

    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id: req.session._id});
    } else {

    }

    // Google Account Logged In
    if (req.user) {
        curr_user = await UserModel.findOne({ email: req.user.email});
    }

    const {user_id, total_price} = req.body;

    let user_cart = "";

    if (req.session.isAuth) {
        user_cart = await UserCartModel.findOne({user_id: user_id});
    }

    if (req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
        user_cart = await UserCartModel.findOne({user_id: curr_user._id});
    }
    
    //if there are no items in cart
    if(user_cart.items == 0){
        let cart_items = "";
        if (req.session.isAuth) {
            cart_items = await UserCartModel.find({user_id: req.session._id});
        }

        if (req.user) {
            curr_user = await UserModel.findOne({ email:req.user.email});
            cart_items = await UserCartModel.find({user_id: curr_user._id});
        }

        return res.render('shopping-cart', {
            curr_user: curr_user,
            cart_items: cart_items,
            msg: "Add items to cart first.",
        })
    }
    
    if(curr_user.address.length === 0 || curr_user.contact_no.length === 0){
        let cart_items = "";
        if (req.session.isAuth) {
            cart_items = await UserCartModel.find({user_id: req.session._id});
        }

        if (req.user) {
            cart_items = await UserCartModel.find({email: req.user.email});
        }

        return res.render('shopping-cart', {
            curr_user: curr_user,
            cart_items: cart_items,
            msg: "Make sure to put address and/or contact number in your profile before checking out. \n You can access your profile by clicking your username in the navigation bar",
        })
    }

    const newOrder = await OrdersModel({
        user_id: curr_user._id,
        username: curr_user.username,
        address: curr_user.address,
        contact_no: curr_user.contact_no,
        items: user_cart.items,
        total_price: total_price
    });
    await newOrder.save();

    await UserCartModel.updateOne({user_id: curr_user._id,},{
        $pullAll: {
            items: user_cart.items
        }
    })

    return res.redirect('/payment-prompt');
});

// BLOG
app.get('/blog', async function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    if (req.user) {
        curr_user = await UserModel.findOne({ email: req.user.email});
    }
	
	const blogs = await BlogsModel.find({});
	
    return res.render('blog', {
        curr_user: curr_user,
		blogs: blogs
    });
});

// SIZE CHART
app.get('/size-chart', async function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    if (req.user) {
        curr_user = await UserModel.findOne({ email: req.user.email});
    }

    return res.render('size-chart', {
        curr_user: curr_user
    });
});

// LOGIN
app.get('/login', async function(req, res){
    const msg = null;
    return res.render('login', {msg: msg}); // Will store error message if needed
});
app.post('/user-login', async function(req, res){

    const { username, password } = req.body;

    let users = await UserModel.findOne({ username: username});
    const hashedPassword = createHash('sha256').update(password).digest('hex');
    // check if there is an existing user and if password is correct
    if(!users || users.password !== hashedPassword){
        return res.render('login',{msg: "Wrong Username or Password."});
    }

    req.session.isAuth = true;
    res.session = users;
    req.session._id = users._id;
    req.session.username = users.username;
    req.session.user_type = users.user_type;

    console.log('logged in user._id: ' + users._id);
    return res.redirect('/landing-page');
});
// LOG OUT
app.get('/log-out', function(req, res){

    if(isAuth || req.user){
        req.session.isAuth = false;
        req.session.destroy((err) => {
            if (err) throw err;

            console.log(req.session);
            console.log('log out success!');
            return res.redirect('/landing-page');
        })
    }

});

// SIGN UP
app.get('/signup', function(req, res){
    const msg = null;
    return res.render('signup', {msg: msg}); // Will store error message if needed
});
app.post('/create-user', async function(req, res){

    const { username, your_email, password, confirm_password} = req.body;
    console.log(username + " "  + your_email + " " + password + " " + confirm_password);

    const takenUsername = await UserModel.findOne({ username: username});
    // Validation if there is already an existing record with same username
    if (takenUsername) {
        console.log('taken username');
        return res.render('signup',{msg: "Username already taken"});
    }
    const takenEmail = await UserModel.findOne({ email: your_email});
    // Validation if there is already an existing record with same email
    if (takenEmail) {
        console.log('taken email');
        return res.render('signup',{msg: "Email already taken"});
    }

    // Validation if passwords match
    if( password !== confirm_password){
        console.log('passwords do not match ' + password + ' - ' + confirm_password);
        return res.render('signup',{msg: "Passwords do not match"});
    }
    const hashedPassword = createHash('sha256').update(password).digest('hex');

    const newUser = await UserModel({
        username: username,
        user_type: 0,
        email: your_email,
        password: hashedPassword
    });
    await newUser.save();

    //create cart for the user
    const newUserCart = await UserCartModel({
        user_id: newUser,
        username: username,
        items: []
    });
    await newUserCart.save();

    console.log('success!')
    return res.render('login',{msg: "You may now log in"});
});

// ADMIN
app.get('/admin', async function(req, res){
    let curr_user = null;
    let msg = null;
    
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email: req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    // Not allowed if user null
    if(!curr_user){
        return res.redirect('back');
    }

    const orders = await OrdersModel.find({}); // Gets all orders
    const all_users = await UserModel.find({ _id: {$nin: curr_user._id}, user_type: {$lte: curr_user.user_type}}); // Gets all lower or equal users except current user
    const all_items = await ItemsModel.find({}); // Gets all items
	const all_blogs = await BlogsModel.find({}); // Gets all blogs
    
    return res.render('admin-dash',{
        msg: msg,
        curr_user: curr_user,
        all_users: all_users,
        all_items: all_items,
		all_blogs: all_blogs,
        orders: orders
    });

});
// Revert Status
app.get('/revert-status/:order_id/:status', async function(req, res) {

    const status = req.params.status;
    const order_id = req.params.order_id;

    console.log("Order: #" + order_id);
    console.log("Reverted Status: " + status);

    if(status === "Payment Successful! Preparing your Order.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Waiting for Payment Confirmation."}
        })
    } else if(status === "Out for Delivery.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Payment Successful! Preparing your Order."}
        })
    } else if(status === "Order Received.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Out for Delivery."}
        })
    }

    res.redirect('/admin');
});
// Revert Status
app.get('/advance-status/:order_id/:status', async function(req, res) {

    const status = req.params.status;
    const order_id = req.params.order_id;

    if(status === "Waiting for Payment Confirmation.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Payment Successful! Preparing your Order."}
        })
    } else if(status === "Payment Successful! Preparing your Order.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Out for Delivery."}
        })
    } else if(status === "Out for Delivery.") {
        await OrdersModel.updateOne({_id: order_id},{
            $set: {status: "Order Received."}
        })
    }

    res.redirect('/admin/:order_id/:status');
});
// UPDATE ORDER STATUS
app.post('/update-order-status', async function(req, res) {

    const order_id = req.body.order_id;
    const order_status = req.body.order_status

    const updated_status = await updateOrderStatus(order_id, order_status)

    console.log(updated_status._id + " " + updated_status.username +" " + updated_status.status);

    return res.redirect('/admin');
})
// UPDATE ORDER STATUS HELPER
async function updateOrderStatus(order_id, order_status){

    // gets the order document from the DB and updates the corresponding order status
    const updated_status = await OrdersModel.findOneAndUpdate({_id: order_id},{
        $set: {status: order_status}
    }, {
        new: true // Gets the updated document
    });
    return updated_status;
}
module.exports = updateOrderStatus;

// CANCEL ORDER
app.get('/cancel-order/:order_id', async function(req, res) {
    const order_id = req.params.order_id;
    console.log("Cancelled Order: " + order_id);

    await OrdersModel.findOneAndDelete({_id: order_id});
    
    res.redirect('/admin');
});

//ADD USER
app.get('/create-admin', async function(req, res){
    let curr_user = null;
    let msg = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    // Not allowed if user null
    if(!curr_user){
        return res.redirect('back');
    }
    
    return res.render('create-admin',{
        curr_user: curr_user,
        msg: msg
    });

});
// Add an admin to DB
app.post('/add-admin', async function(req, res){
    let curr_user = null
    const { username, your_email, password, confirm_password} = req.body;
    console.log(username + " "  + your_email + " " + password + " " + confirm_password);

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const takenUsername = await UserModel.findOne({ username: username});
    // Validation if there is already an existing record with same username
    if (takenUsername) {
        console.log('taken username');
        return res.render('create-admin',{
            curr_user: curr_user,
            msg: "Username already taken"
        });
    }
    const takenEmail = await UserModel.findOne({ email: your_email});
    // Validation if there is already an existing record with same email
    if (takenEmail) {
        console.log('taken email');
        return res.render('create-admin',{
            curr_user: curr_user,
            msg: "Email already taken"
        });
    }

    // Validation if passwords match
    if( password !== confirm_password){
        console.log('passwords do not match ' + password + ' - ' + confirm_password);
        return res.render('create-admin',{
            curr_user: curr_user,
            msg: "Passwords do not match"
        });
    }
    const hashedPassword = createHash('sha256').update(password).digest('hex');

    const newUser = await UserModel({
        username: username,
        user_type: 1, // user type admin
        email: your_email,
        password: hashedPassword
    });
    await newUser.save();

    //create cart for the user
    const newUserCart = await UserCartModel({
        user_id: newUser,
        username: username,
        items: []
    });
    await newUserCart.save();

    console.log('success!')
    return res.redirect('/admin');
});
// Delete User 
app.get('/delete-user/:user_id', async function(req, res){
    let curr_user = null

    const user_id = req.params.user_id;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    await UserModel.findOneAndDelete({_id: user_id});
    await UserCartModel.findOneAndDelete({user_id: user_id});
    
    return res.redirect('/admin');
});
// Edit User
app.post('/edit-user', async function(req, res){
    let curr_user = null
    let msg = null;

    const user_id = req.body.user_id;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    // User that will be edited
    const edit_user = await UserModel.findOne({_id: user_id});
    console.log(edit_user);

    return res.render('edit-user',{
        msg: msg,
        curr_user: curr_user,
        edit_user: edit_user
    });
});
// Updates User Details in the DB
app.post('/update-user-details', async function(req, res){
    let curr_user = null
    let msg = null;

    const {user_id, username, email, user_type} = req.body;

    // User whose details will be edited
    const edit_user = await UserModel.findOne({_id: user_id});

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }
    
    const takenUsername = await UserModel.findOne({_id: {$nin: user_id}, username: username});
    // Validation if there is already an existing record with same username that is not the edited user
    if (takenUsername) {
        return res.render('edit-user',{
            msg: "Username already taken",
            curr_user: curr_user,
            edit_user: edit_user
        });
    }
    const takenEmail = await UserModel.findOne({_id: {$nin: user_id}, email: email});
    // Validation if there is already an existing record with same email that is not the edited user
    if (takenEmail) {
        return res.render('edit-user',{
            msg: "Email already taken",
            curr_user: curr_user,
            edit_user: edit_user
        });
    }

    // Validation if user_type exists
    if (user_type !== '0' && user_type !== '1') {
        return res.render('edit-user',{
            msg: "User type " + user_type + " does not exists",
            curr_user: curr_user,
            edit_user: edit_user
        });
    }

    
    // User details will be updated if it reaches this point
    const edited_user = await UserModel.updateOne({_id: user_id}, {
        $set: {
            username: username,
            email: email,
            user_type: user_type
        }
    })
    console.log(edited_user);
    const edited_usercart = await UserCartModel.updateOne({user_id: user_id},{
        $set: {
            username: username
        }
    })

    res.session = edited_user;
    console.log(req.session);
    

    return res.redirect('/admin');
});
// Changes User Password in DB
app.post('/change-user-password', async function(req, res){
    let curr_user = null
    let msg = null;

    const {user_id, new_password, confirm_password} = req.body;
    console.log(user_id + " " + new_password + " " + confirm_password);

    // User whose password will be edited
    const edit_user = await UserModel.findOne({_id: user_id});

    if(req.session.isAuth){
        curr_user = curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    if (new_password !== confirm_password) {
        return res.render('edit-user',{
            msg: "Passwords do not match",
            curr_user: curr_user,
            edit_user: edit_user
        });
    }

    const hashedPassword = createHash('sha256').update(new_password).digest('hex');
    
    // User details will be updated
    const edited_user = await UserModel.updateOne({_id: user_id}, {
        $set: {
            password: hashedPassword
        }
    })
    console.log(edited_user);

    return res.redirect('/admin');
});

// ADD ITEM PAGE
app.get('/create-item', async function(req, res) {

    let curr_user = null
    let msg = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id})

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    res.render('create-item', {
        curr_user: curr_user,
        msg: msg
    })
});
// Add item to DB
app.post('/add-item', upload.single('item_photo') ,async function(req, res){
    
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const {collection, item_name, description, price} = req.body;
    const item_photo = req.file.filename;

    const takenItemName = await ItemsModel.findOne({item_name: item_name});
    if(takenItemName && (takenItemName.collection_type === collection)){
        res.render('create-item', {
            curr_user: curr_user,
            msg: "Item name already exists in collection \"" + takenItemName.collection_type + "\"  "
        })
    }

    const newItem = await ItemsModel({
        collection_type: collection,
        item_name: item_name,
        description: description,
        price: price,
        item_photo: item_photo
    }); 
    await newItem.save();

    console.log(collection + " " + item_name + " "  + description + " "  + price + " " + item_photo);
    return res.redirect('/admin');
});

// EDIT ITEM PAGE
app.post('/edit-item', async function(req, res) {

    let curr_user = null
    let msg = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const item_id = req.body.edit_item;

    const edit_item = await ItemsModel.findOne({_id: item_id});

    console.log(edit_item);

    res.render('edit-item', {
        curr_user: curr_user,
        msg: msg,
        edit_item: edit_item
    });

});
// Update edited item
app.post('/update-item-details', async function(req, res) {
    let curr_user = null

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const {item_id, collection, item_name, description, price} = req.body;

    const edit_item = await ItemsModel.findOne({_id: item_id});

    const takenItemName = await ItemsModel.findOne({_id: {$nin: item_id}, item_name: item_name});
    if(takenItemName){
        res.render('edit-item', {
            curr_user: curr_user,
            msg: "Item name already taken",
            edit_item: edit_item
        });
    }

    await ItemsModel.updateOne({_id: item_id},{
        collection_type: collection,
        item_name: item_name,
        description: description,
        price: price
    })

    res.redirect('/admin');
});

// ADD BLOG PAGE
app.get('/create-blog', async function(req, res) {

    let curr_user = null
    let msg = null;

    if(req.session.isAuth){
        curr_user = req.session;

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = req.user

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    res.render('create-blog', {
        curr_user: curr_user,
        msg: msg
    })
});

// Add blog to DB
app.post('/add-blog', upload.single('blog_photo') ,async function(req, res){
    
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = req.session;

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const {blog_name, description} = req.body;
    const blog_photo = req.file.filename;

    const newBlog = await BlogsModel({
        blog_name: blog_name,
        description: description,
        blog_photo: blog_photo
    }); 
    await newBlog.save();

    console.log(blog_name + " "  + description + " "  + blog_photo);
    return res.redirect('/admin');
});

// Delete Blog in DB
app.get('/delete-blog/:blog_id', async function(req, res) {
    const blog_id = req.params.blog_id;
    
    await BlogsModel.deleteOne({_id: blog_id});

    return res.redirect('/admin');
});

// EDIT BLOG PAGE
app.post('/edit-blog', async function(req, res) {

    let curr_user = null
    let msg = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const blog_id = req.body.edit_blog;

    const edit_blog = await BlogsModel.findOne({_id: blog_id});

    console.log(edit_blog);

    res.render('edit-blog', {
        curr_user: curr_user,
        msg: msg,
        edit_blog: edit_blog
    });

});

// Update edited blog
app.post('/update-blog-details', async function(req, res) {
    let curr_user = null

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const {blog_id, blog_name, description} = req.body;

    const edit_blog = await BlogsModel.findOne({_id: blog_id});

    await BlogsModel.updateOne({_id: blog_id},{
        blog_name: blog_name,
        description: description
    })

    res.redirect('/admin');
});

// ADD AVAILABILITY PAGE
app.post('/add-availability', async function(req, res){
    let curr_user = null;
    let msg = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const item_id = req.body.item_id;
    const edit_item = await ItemsModel.findOne({_id: item_id});

    console.log(edit_item);

    res.render('add-availability', {
       curr_user: curr_user,
       msg: msg,
       edit_item: edit_item 
    });
});
app.post('/add-availability', async function(req, res){
    let curr_user = null;
    let msg = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const item_id = req.body.item_id;
    const edit_item = await ItemsModel.findOne({_id: item_id});

    console.log(edit_item);

    res.render('add-availability', {
       curr_user: curr_user,
       msg: msg,
       edit_item: edit_item 
    });
});

// Edit Availability
app.post('/edit-availability', async function(req, res) {
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const {item_id, size, stock, new_size, new_stock} = req.body;

    const edit_item = await ItemsModel.findOne({_id: item_id});
    console.log(edit_item);

    const takenSize = await ItemsModel.findOne({_id: item_id, availability: { $elemMatch: {size: new_size, stock: new_stock}}});
    if(takenSize) {
        res.render('edit-item', {
            curr_user: curr_user,
            msg: "Size already exists",
            edit_item: edit_item 
        });
    }
    console.log(item_id + " " + size + " " + stock + " " + new_size + " " + new_stock); 
    
    editStockAvailability(item_id, size, stock, new_size, new_stock);

    return res.redirect('admin');

})
// Helper Function
async function editStockAvailability(item_id, size, stock, new_size, new_stock) {
    await ItemsModel.updateOne({_id: item_id, availability: { $elemMatch: {size: size, stock: stock}} },{
        $set: {
            'availability.$.size': new_size,
            'availability.$.stock': new_stock
        }
    });

    const newly_edit_item = await ItemsModel.findOne({_id: item_id, availability: { $elemMatch: {size: new_size, stock: new_stock}} });
    // console.log(newly_edit_item._id);
    return newly_edit_item;
}
module.exports = editStockAvailability;
;

// Delete Availability
app.post('/delete-availability', async function(req, res) {

    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const {item_id, size, stock} = req.body;

    console.log(item_id);
    console.log(size);
    console.log(stock);


    // const takenSize = await ItemsModel.findOne({_id: item_id, availability: { $elemMatch: {size: size}}});

    await ItemsModel.updateOne({_id: item_id}, {
        $pull: {
            availability: {
                size: size,
                stock: stock
            }
        }
    });

    res.redirect('/admin');
});

// UPDATE AVAILABILITY
app.post('/update-availability', async function(req, res) {

    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});

        // Not allowed if user type is a regular user (0). Only admin (1) and superuser (2) 
        if(curr_user.user_type == 0){
            return res.redirect('back');
        }
    }

    if(!curr_user){
        return res.redirect('back');
    }

    const {item_id, size, stock} = req.body;

    const edit_item = await ItemsModel.findOne({_id: item_id});

    const takenSize = await ItemsModel.findOne({_id: item_id, availability: { $elemMatch: {size: size}}});
    if(takenSize) {
        return res.render('add-availability', {
            curr_user: curr_user,
            msg: "Size already exists",
            edit_item: edit_item 
        });
    }

    await ItemsModel.updateOne({_id: item_id}, {
        $push: {
            availability: {
                size: size,
                stock: stock
            }
        }
    });

    res.redirect('/admin');
});
// Delete Item in DB
app.get('/delete-item/:item_id', async function(req, res) {
    const item_id = req.params.item_id;
    
    await ItemsModel.deleteOne({_id: item_id});

    return res.redirect('/admin');
});

app.post('/change-photo', upload.single('item_photo'), async function(req, res) {
    
    const {item_id} = req.body;
    const photo_name = req.file.filename;

    console.log(item_id);
    console.log(photo_name);

    await ItemsModel.updateOne({_id: item_id}, {item_photo: photo_name});

    res.redirect('/admin');
});

//PROFILE PAGE
app.get('/profile', async function(req, res){
    let curr_user = null;
    let user = "";
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
        user = await UserModel.findOne({_id: req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
        user = await UserModel.findOne({email: req.user.email});
    }
    
    console.log(user);

    return res.render('profile', {
        curr_user: curr_user,
        user: user
    });
});

// EDIT PROFILE PAGE
app.get('/edit-profile', async function(req, res){
    let curr_user = null;
    let msg = null;

    let user = "";
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
        user = await UserModel.findOne({_id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
        user = await UserModel.findOne({email: req.user.email})
    }
    console.log(user);

    return res.render('edit-profile', {
        curr_user: curr_user,
        user: user,
        msg: msg
    });
});
// Update Profile
app.post('/update-profile', async function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
        const user = await UserModel.findOne({_id: req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
        const user = await UserModel.findOne({email: req.user.email});
    }

    const {user_id, userName, emailAddress, contactNumber, shippingAddress} = req.body;

    console.log(userName);
    console.log(emailAddress);
    console.log(contactNumber);
    console.log(shippingAddress);

    const takenUsername = await UserModel.findOne({_id: {$nin: user_id}, username: userName});
    // Validation if there is already an existing record with same username that is not the edited user
    if (takenUsername) {
        return res.render('edit-profile',{
            msg: "Username already taken",
            curr_user: curr_user,
            user: user
        });
    }
    const takenEmail = await UserModel.findOne({_id: {$nin: user_id}, email: emailAddress});
    // Validation if there is already an existing record with same email that is not the edited user
    if (takenEmail) {
        return res.render('edit-profile',{
            msg: "Email already taken",
            curr_user: curr_user,
            user: user
        });
    }

    const updated_user = await UserModel.updateOne({_id: user_id}, {
        $set: {
            username: userName,
            email: emailAddress,
            contact_no: contactNumber,
            address: shippingAddress
        }
    })
    await UserCartModel.updateOne({user_id: user_id}, {
        $set: {
            username: userName,
        }
    })
    await OrdersModel.updateMany({user_id: user_id}, {
        $set: {
            username: userName,
        }
    })

    console.log(updated_user);

    res.redirect('/profile')
});

app.get('/tracker', async function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
    }
    return res.render('tracker', {
        curr_user: curr_user
    });
});

// ORDERS PAGE
app.get('/orders', async function(req, res) {
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
    }

    const user_orders = await OrdersModel.find({user_id: curr_user._id});
    console.log(user_orders);

    res.render('orders', {
        curr_user: curr_user,
        user_orders: user_orders
    })
});


app.get('/payment-options', async function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
    }

    res.render('payment-options', {
        curr_user: curr_user,
    })
});

app.get('/payment-prompt', async function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
    }

    res.render('payment-prompt', {
        curr_user: curr_user,
    })
});



app.listen(3000, () => console.log('Server started on port 3000'));
