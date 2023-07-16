const {viewPastOrders} = require('./app');

describe('Tests the viewing of past orders in the app', () => {
    test('Should return the corresponding past orders', async () => {
        const {past_orders, cities} = await viewPastOrders();

        const act_orders = ['64b4268e8eb8ee75b44d8729', '64b429f48eb8ee75b44d88cf'];

        let i = 0;
        past_orders.forEach((order) => {
            expect(String(order._id)).toEqual(act_orders[i]);
            i++;
        })
        
    });
});