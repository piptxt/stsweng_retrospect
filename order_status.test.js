const updateOrderStatus = require('./server');

const order_id = '6486d086b1bb788a1427cd61';
const order_status = 'Out for Delivery.'

test('Should update the status of the corresponding order', async () => {
    const updated_order = await updateOrderStatus(order_id, order_status);
    const _id = String(updated_order._id);
    const status = String(updated_order.status);

    expect(_id).toBe(order_id);
    expect(status).toBe(order_status);
});