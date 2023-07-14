const {updateOrderStatus} = require('./app');
const OrdersModel = require('./models/ordersDB');


// TEST FOR ALL ORDER STATUS
describe('Should update the status of the corresponding order', () => {
    test('updated order status input is equal to the order status in the DB', async () => {
        const orig_order = await OrdersModel.findOne({_id: '64ae9576dc6b16fd3d79094c'})
        const orig_status = orig_order.status;
        const order_id = orig_order._id;

        let order_status = 'Waiting for Payment Confirmation.'
        let updated_order = await updateOrderStatus(order_id, order_status);
        expect(updated_order._id).toEqual(order_id);
        expect(updated_order.status).toBe(order_status);
    
        order_status = 'Payment Successful! Preparing your Order.'
        updated_order = await updateOrderStatus(order_id, order_status);
        expect(updated_order._id).toEqual(order_id);
        expect(updated_order.status).toBe(order_status);
    
        order_status = 'Out for Delivery.'
        updated_order = await updateOrderStatus(order_id, order_status);
        expect(updated_order._id).toEqual(order_id);
        expect(updated_order.status).toBe(order_status);
    
        order_status = 'Order Received.'
        updated_order = await updateOrderStatus(order_id, order_status);
        expect(updated_order._id).toEqual(order_id);
        expect(updated_order.status).toBe(order_status);

        // SET TO ORIGINAL STATUS
        await OrdersModel.updateOne({_id: orig_order._id}, {
            $set: {
                status: orig_status
            }
        })
    });
});