const {getFilterLocation} = require('./app');

describe('Should test the filter locations function of the app', () => {
    test('Should return the corresponding orders with the given city location', async () => {
        const city = 'Pasig';

        const {past_orders, cities, count} = await getFilterLocation(city);

        expect(count).toBe(4);
        past_orders.forEach((order) => {
            expect(order.address.city).toBe(city);
        });
    });
});