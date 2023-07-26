const nodemailer = require("nodemailer");
const alert = require("alert");

function status_message(to, order_status, order) {
    var final_message = {};
    if (order_status == "Waiting for Payment Confirmation.") {
        final_message = {
            to: to,
            subject: "Order Update: Payment Confirmation for Order " + order._id,
            html: `
                  <h1 style="text-align: center;"><strong>RETROSPECT</strong></h1>
                  <hr />
                  <h3 style="text-align: center;">Your order is waiting for payment confirmation.</h3>
                  <hr />
                  <p>Hi <strong>${order.username}</strong>!</p>
                  <p>&nbsp;</p>
                  <p>Hope you're doing well! We wanted to give you a quick heads-up about your order, <strong>${order._id}</strong>. We're just a step away from getting it ready for shipment, but we need your help with payment confirmation. Once we receive the confirmation, we'll swiftly prepare your order for shipment.</p>
                  <p>&nbsp;</p>
                  <p><strong>Order Number: ${order._id}</strong></p>
                  <p><strong>Order Date: ${order.date_ordered}</strong></p>
                  <p><strong>Total Amount: Php ${order.total_price}.00</strong></p>
                  <p>&nbsp;</p>
                  <p>If you've already made the payment, please disregard this message. Apologies for any confusion caused. 
                  <p>Need assistance or have questions? Our friendly customer support team is ready to help!</p>
                  <p>&nbsp;</p>
                  <p>Thank you for choosing us. We appreciate your swift action in confirming the payment. We can't wait to finalize your order and provide you with an amazing shopping experience.</p>
                  <p>&nbsp;</p>
                  <p>Best regards,</p>
                  <p>Retrospect</p>
                  `,
          };
    } else if (order_status == "Payment Successful! Preparing your Order.") {
        final_message = {
            to: to,
            subject: "Order Update: Payment Successful for Order " + order._id,
            html: `
                <h1 style="text-align: center;"><strong>RETROSPECT</strong></h1>
                <hr />
                <h3 style="text-align: center;">Payment successful! Your order is being prepared for shipment.</h3>
                <hr />
                <p>Hello <strong>${order.username}</strong>!</p>
                <p>&nbsp;</p>
                <p>We have fantastic news to share! Your payment for the order has been successfully processed, and we are thrilled to inform you that we have started preparing your order for shipment.</p>
                <p>&nbsp;</p>
                <p><strong>Order Number: ${order._id}</strong></p>
                <p><strong>Order Date: ${order.date_ordered}</strong></p>
                <p><strong>Total Amount: Php ${order.total_price}.00</strong></p>
                <p>&nbsp;</p>
                <p>Our dedicated team is now carefully picking, packing, and double-checking your items to ensure everything is in perfect order. We are committed to ensuring a smooth delivery process, and we'll keep you updated every step of the way. If you have any questions or need assistance, our friendly customer support team is here to help. Don't hesitate to reach out to us.</p>
                <p>&nbsp;</p>
                <p>Thank you for your prompt payment and for choosing us for your purchase. We appreciate your trust in our brand, and we can't wait for you to receive your order soon!</p>
                <p>&nbsp;</p>
                <p>Best regards,</p>
                <p>Retrospect</p>
                  `,
          };
    } else if (order_status == "Out for Delivery.") {
        final_message = {
            to: to,
            subject: "Order Update: Order " + order._id + "  Out for Delivery!",
            html: `
                <h1 style="text-align: center;"><strong>RETROSPECT</strong></h1>
                <hr />
                <h3 style="text-align: center;">Your order is out for delivery!</h3>
                <hr />
                <p>Hello <strong>${order.username}</strong>!</p>
                <p>&nbsp;</p>
                <p>We hope this email finds you well and filled with anticipation! We're thrilled to inform you that your order is <strong>out for delivery</strong> and making its way to your doorstep.</p>
                <p>&nbsp;</p>
                <p><strong>Order Number: ${order._id}</strong></p>
                <p><strong>Order Date: ${order.date_ordered}</strong></p>
                <p><strong>Shipment Date: ${order.date_delivered}</strong></p>
                <p>&nbsp;</p>
                <p>If you have any questions or require assistance, our friendly customer support team is here to help. Feel free to contact us, and we'll be more than happy to assist you.</p>
                <p>&nbsp;</p>
                <p>Thank you for choosing us for your purchase. We appreciate your support and hope that this delivery brings you satisfaction. We can't wait for you to receive your order and enjoy your purchase.</p>
                <p>&nbsp;</p>
                <p>Best regards,</p>
                <p>Retrospect</p>
                  `,
          };
    } else if (order_status == "Order Received.") {
        final_message = {
            to: to,
            subject: "Order Update: Order " + order._id + " Delivered!",
            html: `
                <h1 style="text-align: center;"><strong>RETROSPECT</strong></h1>
                <hr />
                <h3 style="text-align: center;">Your order has been delivered!</h3>
                <hr />
                <p>Hello <strong>${order.username}</strong>!</p>
                <p>&nbsp;</p>
                <p>We wanted to share some exciting news with you - your order has been <strong>successfully delivered</strong>!</p>
                <p>&nbsp;</p>
                <p><strong>Order Number: ${order._id} </strong></p>
                <p><strong>Order Date: ${order.date_ordered}</strong></p>
                <p>&nbsp;</p>
                <p>We want to ensure your utmost satisfaction with your purchase, so please take a moment to inspect the items upon arrival. If you have any concerns or questions about the delivered order, don't hesitate to reach out to our customer support team for assistance.</p>
                <p>&nbsp;</p>
                <p>Thank you for choosing us for your purchase. We truly appreciate your trust in our brand. It has been a pleasure serving you, and we look forward to assisting you with any future needs.</p>
                <p>&nbsp;</p>
                <p>Best regards,</p>
                <p>Retrospect</p>
                  `,
          };
    }
    return final_message;
}

const sendEmail = async (to, order_status, order) => {
  var message;
  try {
    //create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "stswengretrospect@gmail.com",
        pass: "ckeeugebzofdxuyh",
      },
    });
    //message obj
    message = status_message(to, order_status, order);
    //send the email
    const info = await transporter.sendMail(message);
    // console.log("Message sent", info.messageId);
    // how to popup alert SENT
  } catch (error) {
    console.log(error);
    // how to popup alert NOT SENT
    throw new Error("Email could not be sent");
  }
  return message; 
};

// TO DO: 
// error handling for invalid emails or emails not sent

module.exports = sendEmail;