// TESTS IF THE DATABASE IT RETURNING THE EXPECTED DOCUMENTS
const mongoose = require('mongoose');

const retrospectDB = "mongodb+srv://retrospect:Retrosp3ct@retrospect.fboiauc.mongodb.net/retrospectDB";
const retrospectConnection = mongoose.connect(retrospectDB);

// ALL MODELS INITIALIZED
const UserModel = require('./models/userDB');
const UserCartModel = require('./models/user_cartDB');
const ItemsModel = require('./models/itemsDB');
const OrdersModel = require('./models/ordersDB');
const BlogsModel = require('./models/blogsDB');


// TEST FOR FINDING A USER (for search)
test('Should return the corresponding user', async () => {
    const user_id = '6420384a21db20b7fab37534';

    // EXPECTED VALUE(S)
    const ex_user = 'kennymkl';
    const ex_usertype = 1;
    const ex_email = "kenn@gmail.com";
    const ex_address = "";
    const ex_contactno = ""

    const user = await UserModel.findOne({_id: user_id});

    expect(String(user.username)).toBe(ex_user);
    expect(user.user_type).toBe(ex_usertype);
    expect(String(user.email)).toBe(ex_email);
    expect(String(user.address)).toBe(ex_address);
    expect(String(user.contact_no)).toBe(ex_contactno);
});

//TEST FOR FILTERING USERS BY USER TYPE
test('Should return the users with the corresponding admins', async () => {
    const user_type = 1;

    // EXPECTED VALUE(S)
    const ex_admins = ["LebronJordan","RomanReigns", "awaw", "idolnation", "kennymkl", "pipo_clems", "testing"];

    // FIND ALL ADMINS
    const num_admins = await UserModel.find({user_type: user_type}).sort({username: 1});

    let i = 0;
    num_admins.forEach((admin) => {
        expect(admin.username).toBe(ex_admins[i]);
        i++;
    });
    
});

// TEST FOR FILTERING ORDERS
test('Should return the users with the corresponding order numbers', async () => {
    const order_status = "Out for Delivery.";

    // EXPECTED VALUE(S)
    const ex_orderids = ["6486d086b1bb788a1427cd61", "643aba197b906759e595e48b", "6437e2f3b7a56ab0fd55a423"];
 
    const orders = await OrdersModel.find({status: order_status}).sort({username: 1});
    // CHECKS ALL OF THE ORDERS WITH THE CORRESPONDING STATUS
    let i = 0;
    orders.forEach((order) => {
        expect(String(order._id)).toBe(ex_orderids[i]);
        i++;
    });
});

// TEST FOR CHECKING THE ITEMS IN THE USER'S CART
test('Should return the users with the corresponding items of the user in their shopping cart', async () => {
    const username = "testerist";

    // EXPECTED VALUE(S)
    const ex_items = ["NLND (Black) ", "NLND (Black) "]
    const ex_sizes = ["L", "XS"]
    const ex_qty = [1, 5]
    const ex_price = 550
 
    const usercart = await UserCartModel.findOne({username: username})
    // CHECKS ALL OF THE ORDERS WITH THE CORRESPONDING STATUS
    let i = 0;
    usercart.items.forEach((item) => {
        expect(String(item.item_name)).toBe(ex_items[i]);
        expect(String(item.size)).toBe(ex_sizes[i]);
        expect(item.quantity).toBe(ex_qty[i]);
        expect(item.price).toBe(ex_price);
        i++;
    });
});
