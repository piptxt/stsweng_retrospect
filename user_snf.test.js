const {filterUserTransactions} = require('./app');
const UserModel = require('./models/userDB');
    
const selectedOptions1 = ['4'];
const selectedOptions2 = ['1', '2'];

describe('Should test the filter users function of the app', () => {
    test('Should return the corresponding users with 4 transactions', async () => {
      const curr_user = await UserModel.findOne({_id: '6420384a21db20b7fab37534'}); // current user: kennymkl (admin)

      var final_users = await filterUserTransactions(selectedOptions1.length, selectedOptions1, curr_user);

      // Add or delete user/s if they change in the future
      // or change equality to inclusivity
      const user1 = await UserModel.findOne({_id: '64845b12557766ad4e557180'}); // priscilla

      const expected_users = [];
      expected_users.push(user1);

      expect(final_users).toStrictEqual(expected_users);
    }, 30000);

    test('Should return the corresponding users with 1 or 2 transactions', async () => {
      const curr_user = await UserModel.findOne({_id: '6420384a21db20b7fab37534'}); // current user: kennymkl (admin)

      var final_users = await filterUserTransactions(selectedOptions2.length, selectedOptions2, curr_user);

      // Add or delete user/s if they change in the future
      // or change equality to inclusivity
      const user1 = await UserModel.findOne({_id: '64ba94ff89887ad42beae054'}); // bilbo
      const user2 = await UserModel.findOne({_id: '643500cf47ddf5cac6f458bd'}); // retrospect
      const user3 = await UserModel.findOne({_id: '64b4f17fabc5cddaad670762'}); // testerist
      const user4 = await UserModel.findOne({_id: '64b762fa410f12965e428200'}); // Vincent

      const expected_users = [];
      expected_users.push(user1);
      expected_users.push(user2);
      expected_users.push(user3);
      expected_users.push(user4);

      expect(final_users).toStrictEqual(expected_users);
    }, 30000);
});