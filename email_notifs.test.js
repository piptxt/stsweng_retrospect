const sendEmail = require("./utils/sendEmail");
const UserModel = require('./models/userDB');
const OrdersModel = require('./models/ordersDB');

const expected_message = {
    to: 'priscilla_licup@dlsu.edu.ph',
    subject: 'Order Update: Payment Confirmation for Order 64b4dc2d06efd9837c642b6b',
    html: '\n' +
      '                  <h1 style="text-align: center;"><strong>RETROSPECT</strong></h1>\n' +
      '                  <hr />\n' +
      '                  <h3 style="text-align: center;">Your order is waiting for payment confirmation.</h3>\n' +
      '                  <hr />\n' +
      '                  <p>Hi <strong>priscilla</strong>!</p>\n' +
      '                  <p>&nbsp;</p>\n' +
      "                  <p>Hope you're doing well! We wanted to give you a quick heads-up about your order, <strong>64b4dc2d06efd9837c642b6b</strong>. We're just a step away from getting it ready for shipment, but we need your help with payment confirmation. Once we receive the confirmation, we'll swiftly prepare your order for shipment.</p>\n" +
      '                  <p>&nbsp;</p>\n' +
      '                  <p><strong>Order Number: 64b4dc2d06efd9837c642b6b</strong></p>\n' +
      '                  <p><strong>Order Date: undefined</strong></p>\n' +
      '                  <p><strong>Total Amount: Php 100.00</strong></p>\n' +
      '                  <p>&nbsp;</p>\n' +
      "                  <p>If you've already made the payment, please disregard this message. Apologies for any confusion caused. \n" +
      '                  <p>Need assistance or have questions? Our friendly customer support team is ready to help!</p>\n' +
      '                  <p>&nbsp;</p>\n' +
      "                  <p>Thank you for choosing us. We appreciate your swift action in confirming the payment. We can't wait to finalize your order and provide you with an amazing shopping experience.</p>\n" +
      '                  <p>&nbsp;</p>\n' +
      '                  <p>Best regards,</p>\n' +
      '                  <p>Retrospect</p>\n' +
      '                  '
  };

test('Returns the correct recipient, email subject, and message for email to be sent', async () => {
    const order_id = '64b4dc2d06efd9837c642b6b'
    const order_status = 'Payment Successful! Preparing your Order.'

    const order = await OrdersModel.findOne({_id: order_id});
    const user = await UserModel.findOne({_id: order.user_id});
    const user_email = user.email;

    const final_message = await sendEmail(user_email, order_status, order);

    expect(final_message[0]).toBe(expected_message[0]);
    expect(final_message[1]).toBe(expected_message[1]);
    expect(final_message[2]).toBe(expected_message[2]);

});