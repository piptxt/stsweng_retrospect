document.addEventListener('DOMContentLoaded', () => {
    const filterTransactButton = document.getElementById('filter_transact');
    filterTransactButton.addEventListener('click', filterFunction);
});

function filterFunction() {
    const UserModel = require('./models/userDB');
    const OrdersModel = require('./models/ordersDB');

    const content = document.querySelector('.checkbox-dropdown  ');
    const selectedOptions = Array.from(content.querySelectorAll('input:checked'))
    .map(checkbox => checkbox.value);
    console.log('Selected options:', selectedOptions);
    
    const admins = UserModel.find({user_type: 1});
    const regulars = UserModel.find({user_type: 0});

    for (let i = 0; i < selectedOptions.length; i++) {
        var num;
        switch(selectedOptions[i]) {
            case "0": num = 0; break;
            case "1": num = 1; break;
            case "2": num = 2; break;
            case "3": num = 3; break;
            case "4": num = 4; break;
            case "5": num = 5; break;
        }

        Array.from(admins).forEach((admin_user) => {
            var transactions = OrdersModel.find({user_id: admin_user._id});
            var num_transacts = transactions.length
            if (num == 5) {
                if (num <= num_transacts) {
                    admin_user.style.display = "block";
                } else {
                    admin_user.style.display = "none";
                }
            } else {
                if (num == num_transacts) {
                    admin_user.style.display = "block";
                } else {
                    admin_user.style.display = "none";
                }
            }
          });

          Array.from(regulars).forEach((regular_user) => {
            var transactions = OrdersModel.find({user_id: regular_user._id});
            var num_transacts = transactions.length
            if (num == 5) {
                if (num <= num_transacts) {
                    regular_user.style.display = "block";
                } else {
                    regular_user.style.display = "none";
                }
            } else {
                if (num == num_transacts) {
                    regular_user.style.display = "block";
                } else {
                    regular_user.style.display = "none";
                }
            }
          });
    }
}

// const UserModel = require('./models/userDB');

// const admins = await UserModel.find({user_type: 1});
// const regulars = await UserModel.find({user_type: 0});

// function transactionFilter(checked_boxes) {
//     console.log("transaction file: " + checked_boxes)
// }
    
// module.exports.transactionFilter = transactionFilter