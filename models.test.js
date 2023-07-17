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


describe('Tests if the mongoose DB functions are working as expected', () => {

    // TEST FOR FINDING A USER (for search)
    test('Should return the corresponding user', async () => {
        const user_id = '64b4f17fabc5cddaad670762';

        // EXPECTED VALUE(S)
        const ex_user = 'testerist';
        const ex_usertype = 0;
        const ex_email = "pipoclemente798@gmail.com";
        const ex_address ={
            addressline1: 'L15, B35',
            addressline2: 'Mahiwaga St., Araw Araw Village',
            city: 'Pasig',
            region: 'Metro Manila'
        };
        const ex_contactno = "09177654321"

        const user = await UserModel.findOne({_id: user_id});

        expect(String(user.username)).toBe(ex_user);
        expect(user.user_type).toBe(ex_usertype);
        expect(String(user.email)).toBe(ex_email);
        expect(user.address).toEqual(ex_address);
        expect(String(user.contact_no)).toBe(ex_contactno);
    });

    //TEST FOR FILTERING USERS BY USER TYPE
    test('Should return the users with the corresponding admins', async () => {
        const user_type = 1;
    
        // EXPECTED VALUE(S)
        const ex_admins = ["awaw", "Darren", "idolnation", "kennymkl", "LebronJordan", "pipo_clems", "RomanReigns"];
    
        // FIND ALL ADMINS
        const num_admins = await UserModel.find({user_type: user_type}).sort({username: 1}).collation({locale: 'en', caseLevel: true});
    
        let i = 0;
        num_admins.forEach((admin) => {
            expect(admin.username).toBe(ex_admins[i]);
            i++;
        });
        
    });

    // TEST FOR CHECKING THE ITEMS IN THE USER'S CART
    test('Should return the users with the corresponding items of the user in their shopping cart', async () => {
        const username = "testerist";
    
        // EXPECTED VALUE(S)
        const ex_items = ["No Data (White) "]
        const ex_sizes = ["S"]
        const ex_qty = [1]
        const ex_price = 100
     
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
});
