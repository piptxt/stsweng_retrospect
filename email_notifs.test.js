const sendEmail = require("./utils/sendEmail");
const UserModel = require('./models/userDB');
const OrdersModel = require('./models/ordersDB');

const expected_message = {
    to: 'priscilla_licup@dlsu.edu.ph',
    subject: 'Payment Successful! Preparing your Order 64b4dc2d06efd9837c642b6b',
    html: '\n' +
    '                <h1 style="text-align: center;"><strong>RETROSPECT</strong></h1>\n' +
    '                <hr />\n' +
    '                <h3 style="text-align: center;">Payment successful! Your order is being prepared for shipment.</h3>\n' +
    '                <hr />\n' +
    '                <p>Hello <strong>priscilla</strong>!</p>\n' +
    '                <p>&nbsp;</p>\n' +
    '                <p>We have fantastic news to share! Your payment for the order has been successfully processed, and we are thrilled to inform you that we have started preparing your order for shipment.</p>\n' +
    '                <p>&nbsp;</p>\n' +
    '                <p><strong>Order Number: 64b5cd92b33ed1d429628822</strong></p>\n' +
    '                <p><strong>Order Date: undefined</strong></p>\n' +
    '                <p><strong>Total Amount: Php 100.00</strong></p>\n' +
    '                <p>&nbsp;</p>\n' +
    "                <p>Our dedicated team is now carefully picking, packing, and double-checking your items to ensure everything is in perfect order. We are committed to ensuring a smooth delivery process, and we'll keep you updated every step of the way. If you have any questions or need assistance, our friendly customer support team is here to help. Don't hesitate to reach out to us.</p>\n" +
    '                <p>&nbsp;</p>\n' +
    "                <p>Thank you for your prompt payment and for choosing us for your purchase. We appreciate your trust in our brand, and we can't wait for you to receive your order soon!</p>\n" +
    '                <p>&nbsp;</p>\n' +
    '                <p>Best regards,</p>\n' +
    '                <p>Retrospect</p>\n' +
    '                  '
  };

  test('Returns the correct recipient, email subject, and message for email to be sent', async () => {
    const order_id = '64b50b190e69a5cb1daef225'
    const order_status = 'Payment Successful! Preparing your Order.'
    const user_email = 'priscilla_licup@dlsu.edu.ph'

    const newOrder = await OrdersModel({
        user_id: '64b50b190e69a5cb1daef225',
        username: 'priscilla',
        address: 'Metro Manila',
        contact_no: '639171234567',
        total_price: 100
    });

    // const order = await OrdersModel.findOne({_id: order_id});
    // const user = await UserModel.findOne({_id: order.user_id});
    // const user_email = user.email;

    const final_message = await sendEmail(user_email, order_status, newOrder);
    console.log(final_message);

    expect(final_message[0]).toBe(expected_message[0]);
    expect(final_message[1]).toBe(expected_message[1]);
    expect(final_message[2]).toBe(expected_message[2]);

});
