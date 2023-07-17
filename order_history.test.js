const {viewPastOrders} = require('./app');

describe('Tests the viewing of past orders in the app', () => {
    test('Should return the corresponding past orders', async () => {
        const {past_orders, cities} = await viewPastOrders();

        const act_orders = ['64b4faa46c4a268c326c5afe', '64b4fc7e5b5f53d347dbb676', '64b4fcb15b5f53d347dbb6c8'];

        let i = 0;
        past_orders.forEach((order) => {
            expect(String(order._id)).toEqual(act_orders[i]);
            i++;
        })
        
    });
});