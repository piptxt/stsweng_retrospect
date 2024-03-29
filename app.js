const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const { createHash } = require('crypto');
const mongoDBStore = require('connect-mongodb-session')(session);

//Email Notifications
const sendEmail = require("./utils/sendEmail");

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
const { errorMonitor } = require('events');

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
                firstname = firstname.concat("_gmail");
            } else {
                firstname = giveName;
                firstname = firstname.concat("_gmail");
            }
            
            // check if username exists
            user_exists = await UserModel.findOne({ username:firstname});

            var counter = 1;
            while (user_exists) {
                firstname = firstname.concat(counter);
                user_exists = await UserModel.findOne({ username:firstname});
                counter = counter + 1;
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
            const space = /\s/.test(req.user.given_name);
            const giveName = req.user.given_name;

            var firstname = "";
            
            if(space) {
                firstname = giveName.split(' ')[0];
                firstname = firstname.concat("_gmail");
            } else {
                firstname = giveName;
                firstname = firstname.concat("_gmail");
            }
            
            // check if username exists
            user_exists = await UserModel.findOne({ username:firstname});

            var counter = 1;
            while (user_exists) {
                firstname = firstname.concat(counter);
                user_exists = await UserModel.findOne({ username:firstname});
                counter = counter + 1;
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

// FAQs
app.get('/faqs', async function(req, res){
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    // Google Account Logged In
    if (req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
    }

    res.render('faqs',{
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

    const items = await ItemsModel.find({}).sort({collection_type: 1});
    let product_filter = new Set();

    items.forEach((item) => {
        product_filter.add(item.product_type);
    });

    console.log(product_filter);
    res.render('shop',{
        curr_user: curr_user,
        items: items, 
        product_filter: product_filter
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

    var delete_item = "";
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
        const delete_item = await UserCartModel.updateOne(
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

    

    // Email Notifications
    try {
        const user = await UserModel.findOne({_id: newOrder.user_id});
        const user_email = user.email;

        console.log(user_email, newOrder.status, newOrder);
        const final_message = await sendEmail(user_email, newOrder.status, newOrder);
        console.log(final_message);
        
      } catch (error) {
        console.error(error);
      }

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

    const orders = await OrdersModel.find({status: {$not: {$regex: "Order Received."}}}); // Gets all orders
    const past_orders = await getPastOrders(); // Gets all past orders
    const all_users = await UserModel.find({ _id: {$nin: curr_user._id}, user_type: {$lte: curr_user.user_type}}).collation({locale:'en',strength: 2}).sort({username:1});// Gets all lower or equal users except current user
    const all_items = await ItemsModel.find({}).sort({collection_type: 1}); // Gets all items
	const all_blogs = await BlogsModel.find({}); // Gets all blogs

    console.log(past_orders);
    
    return res.render('admin-dash',{
        msg: msg,
        curr_user: curr_user,
        all_users: all_users,
        all_items: all_items,
		all_blogs: all_blogs,
        orders: orders,
        past_orders: past_orders
    });

});

async function getPastOrders(){
    const past_orders = await OrdersModel.find({status: "Order Received."});
    return past_orders;
}

module.exports.getPastOrders = getPastOrders;


// UPDATE ORDER STATUS

app.post('/update-order-status', async function(req, res) { 

    const order_id = req.body.order_id;
    const order_status = req.body.order_status

    const updated_status = await updateOrderStatus(order_id, order_status)

    console.log(updated_status._id + " " + updated_status.username +" " + updated_status.status);

    // Email Notifications
    try {
        const order = await OrdersModel.findOne({_id: order_id});
        const user = await UserModel.findOne({_id: order.user_id});
        const user_email = user.email;

        console.log(user_email, order_status, order);
        const final_message = await sendEmail(user_email, order_status, order);

        console.log(final_message);
        
      } catch (error) {
        console.error(error);
      }

    return res.redirect('/admin');
})
// UPDATE ORDER STATUS HELPER
async function updateOrderStatus(order_id, order_status){

    let updated_status;
    
    if(order_status === "Order Received."){
        // gets the order document from the DB and updates the corresponding order status
        updated_status = await OrdersModel.findOneAndUpdate({_id: order_id},{
            $set: {
                status: order_status,
                date_delivered: new Date().toLocaleDateString()
            }
        }, {
            new: true // Gets the updated document
        });
    } else {
        updated_status = await OrdersModel.findOneAndUpdate({_id: order_id},{
            $set: {
                status: order_status,
                date_delivered: ""
            }
        }, {
            new: true // Gets the updated document
        });
    }
    
    
    return updated_status;
}

module.exports.updateOrderStatus = updateOrderStatus;

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

    const {collection, item_name, product_type, description, price} = req.body;
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
        product_type: String(product_type).toLowerCase(), 
        description: description,
        product_type: product_type,
        price: price,
        item_photo: item_photo
    }); 
    await newItem.save();

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

    const {item_id, collection, item_name, product_type, description, price} = req.body;

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
        product_type: String(product_type).toLowerCase(),
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
    // console.log(edit_item);

    const takenSize = await ItemsModel.findOne({_id: item_id, availability: { $elemMatch: {size: new_size, stock: new_stock}}});
    if(takenSize) {
        return res.render('edit-item', {
            curr_user: curr_user,
            msg: "Size already exists",
            edit_item: edit_item 
        });
    }
    // console.log(item_id + " " + size + " " + stock + " " + new_size + " " + new_stock); 
    
    const editedItemStock = await editStockAvailability(item_id, size, stock, new_size, new_stock);

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
module.exports.editStockAvailability = editStockAvailability;

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

    let user;
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
    let user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
        user = await UserModel.findOne({_id: req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
        user = await UserModel.findOne({email: req.user.email});
    }

    const {user_id, userName, emailAddress, contactNumber} = req.body;

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
            contact_no: contactNumber
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

// UPDATE ADDRESS
app.post('/update-address', async function(req, res){
    let user = null;

    if(req.session.isAuth){
        user = await UserModel.findOne({user: req.session._id});
    } 
    if(req.user){
        user = await UserModel.findOne({email: req.user.email});
    }

    const {addressline1, addressline2, city, region} = req.body;

    const user_address = await UserModel.findOneAndUpdate({_id: user._id}, {
        $set: {
            "address.addressline1": addressline1,
            "address.addressline2": addressline2,
            "address.city": city,
            "address.region": region
        }
    }); 
    console.log(user_address);

    return res.redirect('/profile');
})

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

    const orders = await OrdersModel.find({user_id: curr_user._id, status: {$not: {$regex: "Order Received"}}});
    const past_orders = await OrdersModel.find({user_id: curr_user._id, status: "Order Received."});

    return res.render('orders', {
        curr_user: curr_user,
        orders: orders,
        past_orders: past_orders
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

    return res.render('payment-options', {
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

    return res.render('payment-prompt', {
        curr_user: curr_user,
    })
});

// FILTER PAGE FOR PAST ORDERS
app.get('/view-past-orders', async function(req, res) {
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
    }

    const {past_orders, cities} = await viewPastOrders();
    console.log(past_orders, cities);

    return res.render('past-orders', {
        curr_user: curr_user,
        past_orders: past_orders,
        filter_type: null,
        cities: cities,
        count: null
    });
});
async function viewPastOrders(){
    const past_orders = await OrdersModel.find({status: "Order Received."}).sort({date_delivered: 1})
    let cities = new Set();
    past_orders.forEach((past_order) => {
        cities.add(past_order.address.city);
    })

    return {past_orders, cities};
}
module.exports.viewPastOrders = viewPastOrders;

// FILTER BY CITY
app.post('/filter-location', async function(req, res) {
    let curr_user = null;
    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
    }  
    const city = req.body.city;

    const {past_orders, cities, count} = await getFilterLocation(city);
    console.log(past_orders, cities, count);

    return res.render('past-orders', {
        curr_user: curr_user,
        past_orders: past_orders,
        filter_type: city,
        cities: cities,
        count: count
    });
});

async function getFilterLocation(city){
    const past_orders = await OrdersModel.find({status: "Order Received.", "address.city": city}).sort({date: 1});
    const all_orders = await OrdersModel.find({status: "Order Received."}).sort({date: 1});
    let cities = new Set();
    let count =  await OrdersModel.count({status: "Order Received.", "address.city": city})

    all_orders.forEach((order) => {
        cities.add(order.address.city);
    }) 

    return {past_orders, cities, count};
}
module.exports.getFilterLocation = getFilterLocation

// FILTER PRODUCTS
app.post('/filter-product', async function(req, res){ 
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    // Google Account Logged In
    if (req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
    }
    const filter = req.body.filter;

    const filtered_items = await filterProducts(filter);        

    const items = await ItemsModel.find({}).sort({collection_type: 1});
    let product_filter = new Set();

    items.forEach((item) => {
        product_filter.add(item.product_type);
    });

    res.render('shop',{
        curr_user: curr_user,
        items: filtered_items, 
        product_filter: product_filter
    });
});

async function filterProducts(filter){
    let filtered_items;
    if(filter === "ALL"){
        filtered_items = await ItemsModel.find({}).sort({collection_type: 1});
    } else {
        filtered_items = await ItemsModel.find({product_type: String(filter).toLowerCase()}).sort({collection_type: 1});
    }
    return filtered_items;
}

module.exports.filterProducts = filterProducts;

// FILTER PRODUCTS
app.post('/search-products', async function(req, res){ 
    let curr_user = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }

    // Google Account Logged In
    if (req.user) {
        curr_user = await UserModel.findOne({ email:req.user.email});
    }
    const query = req.body.product

    const filtered_items = await searchProduct(query);
    const items = await ItemsModel.find({}).sort({collection_type: 1});

    let product_filter = new Set();
    items.forEach((item) => {
        product_filter.add(item.product_type);
    });

    console.log(product_filter);
    res.render('shop',{
        curr_user: curr_user,
        items: filtered_items, 
        product_filter: product_filter
    });
});

async function searchProduct(query) {
    const filtered_items = await ItemsModel.find({item_name: { $regex : query, $options:'i'}}).sort({collection_type: 1});

    return filtered_items;
}

module.exports.searchProduct = searchProduct;

// VIEW ALL USERS
app.get('/view-all-users', async function(req, res) {
    let curr_user = null;
    let msg = null;
    let results = null;

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
    }
    if(!curr_user){
        return res.redirect('back');
    }

    const all_users = await UserModel.find({}); 

    return res.render('view-users', {
        curr_user: curr_user,
        msg: msg,
        all_users: all_users,
        results: results
    });
});

// FILTER USERS BY TRANSACTIONS
app.post('/filter-transactions', async function(req, res) {
    let curr_user = null;
    let msg = null;
    let results = "Showing users with ";

    if(req.session.isAuth){
        curr_user = await UserModel.findOne({ _id:req.session._id});
    }
    if(req.user){
        curr_user = await UserModel.findOne({ email:req.user.email});
    }  
    
    console.log("Curr User:")
    console.log(curr_user)

    const selectedOptions = req.body; // The form data will be available in req.body
    var array_length = Object.keys(selectedOptions).length;
    var array_values = Object.values(selectedOptions)

    console.log('Received data:', selectedOptions);
    console.log('Length:', Object.keys(selectedOptions).length);
    console.log('Values:', Object.values(selectedOptions));

    if (array_length == 1) {
        if (array_values[0] == 5) {
            results = results.concat(array_values[0], "+");
        } else {
            results = results.concat(array_values[0]);
        }
        
    } else if (array_length == 2) {
        if (array_values[1] == 5) {
            results = results.concat(array_values[0], " or ", array_values[1], "+");
        } else {
            results = results.concat(array_values[0], " or ", array_values[1]);
        }
    } else {
        for (const num in array_values) {
            if (num == array_length-1) {
                if (array_values[num] == 5) {
                    results = results.concat("or ", array_values[num], "+");
                } else {
                    results = results.concat("or ", array_values[num]);
                }
            } else {
                results = results.concat(array_values[num], ", ");
            }
        }
    }

    results = results.concat(" transaction/s.")

    var final_users = await filterUserTransactions(array_length, array_values, curr_user);
    // console.log(Array.isArray(final_users))
    // console.log("Print Users:")
    // console.log(typeof final_users)
    // console.log(typeof all_users)

    return res.render('view-users', {
        curr_user: curr_user,
        msg: msg,
        all_users: final_users,
        results: results
    });
});

async function getUserTransactions(userId){
    const user_orders = await OrdersModel.find({user_id: userId});
    // console.log(user_orders.length);
    return user_orders.length;
    
}

async function filterUserTransactions(array_length, array_values, curr_user){
    const all_users = await UserModel.find({});
    var final_users = [];

    for (let i = 0; i < array_length; i++) {
        var num;
        switch(array_values[i]) {
            case "0": num = 0; break;
            case "1": num = 1; break;
            case "2": num = 2; break;
            case "3": num = 3; break;
            case "4": num = 4; break;
            case "5": num = 5; break;
        }

        for(const user of all_users) {
            var num_transacts = await getUserTransactions(user._id)

            // console.log('User: ', user.username);
            // console.log('Transactions: ', num_transacts);
            // console.log(" ")

            if (num == 5) {
                if (num <= num_transacts) {
                    final_users.push(user)
                }
            } else {
                if (num == num_transacts) {
                    // console.log(user)
                    final_users.push(user)
                }
            }
            
        }
    }
    // console.log(Array.isArray(final_users))
    // console.log(final_users)

    return final_users
}

module.exports.filterUserTransactions = filterUserTransactions;

// EXPORTING THE WHOLE FILE 
module.exports.app = app;