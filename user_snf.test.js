const {filterUserTransactions} = require('./app');
const UserModel = require('./models/userDB');

const all_users = await UserModel.find({ _id: {$nin: curr_user._id}, user_type: {$lte: curr_user.user_type}}); // Gets all lower or equal users except current user
    
const selectedOptions1 = [4];
const selectedOptions2 = [1, 2];
const selectedOptions3 = [0, 1, 2, 3, 4, 5];

describe('Should test the filter users function of the app', () => {
    test('Should return the corresponding users with 4 transactions', async () => {
        var final_users = await filterUserTransactions(selectedOptions1.length, selectedOptions1, all_users);
        var expected_users = [
            {
              address: { addressline1: '', addressline2: '', city: '', region: '' },
              _id: new ObjectId("64845b12557766ad4e557180"),
              username: 'priscilla',
              user_type: 0,
              email: 'priscilla_licup@dlsu.edu.ph',
              password: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
              contact_no: '639171234567',
              __v: 0
            }
          ]

        expect(final_users).toBe(expected_users);
    });
});