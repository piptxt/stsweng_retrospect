const {updateOrderStatus} = require('./app');


// TEST FOR ALL ORDER STATUS
test('Should update the status of the corresponding order', async () => {
    const order_id = '649bf8d7142724079e47bb8f';

    let order_status = 'Waiting for Payment Confirmation.'
    let updated_order = await updateOrderStatus(order_id, order_status);
    expect(String(updated_order._id)).toBe(order_id);
    expect(String(updated_order.status)).toBe(order_status);

    order_status = 'Payment Successful! Preparing your Order.'
    updated_order = await updateOrderStatus(order_id, order_status);
    expect(String(updated_order._id)).toBe(order_id);
    expect(String(updated_order.status)).toBe(order_status);

    order_status = 'Out for Delivery.'
    updated_order = await updateOrderStatus(order_id, order_status);
    expect(String(updated_order._id)).toBe(order_id);
    expect(String(updated_order.status)).toBe(order_status);

    order_status = 'Order Received.'
    updated_order = await updateOrderStatus(order_id, order_status);
    expect(String(updated_order._id)).toBe(order_id);
    expect(String(updated_order.status)).toBe(order_status);
});