const {viewPastOrders} = require('./app');

describe('Tests the viewing of past orders in the app', () => {
    test('Should return the corresponding past orders', async () => {
        const {past_orders, cities} = await viewPastOrders();

        const act_orders = ['64b4fc7e5b5f53d347dbb676', '64b4fcb15b5f53d347dbb6c8', '64ba633367119bdc57365eb4' , '64b6628f15cdf221fe297942', '64c8dda5602dd66cf1ab2e55', '64ca3e233433f1dcaba5be53', '64ca3e2e3433f1dcaba5be78', '64ca3e393433f1dcaba5be9d', '64b4faa46c4a268c326c5afe' ];

        let i = 0;
        past_orders.forEach((order) => {
            expect(String(order._id)).toEqual(act_orders[i]);
            i++;
        })
    });
});