const {searchProduct, filterProducts} = require('./app');


describe('Should return the corresponding items given the filter or search query', () => {
    test('Tests if searchProduct gives the corrects product(s) given \'nl\' as the query ', async () => {
        const ex_itemid = '64bb57e0352cba3b992dbd21';
        const query = 'No Data (Black)';

        const act_item = await searchProduct(query);
        
        act_item.forEach((item) => {
            expect(String(item._id)).toBe(ex_itemid);
        });
        
    })

    test('Tests if searchProduct gives the corrects product(s) given \'black\'  as the query', async () => {
        const ex_itemid = ['64bb57e0352cba3b992dbd21'];
        const query = 'black';

        const act_item = await searchProduct(query);

        let i = 0;
        act_item.forEach((item) => {
            expect(String(item._id)).toBe(ex_itemid[i]);
            i++;
        });
        
    })

    test('Tests if filterProducts gives the corrects product(s) given \'PANTS\' as the filter', async () => {
        const ex_itemid = '6436da09673546491d9e24d1';
        const filter = 'pants';

        const act_item = await filterProducts(filter);
        
        act_item.forEach((item) => {
            expect(String(item._id)).toBe(ex_itemid);
        });
        
    })

    test('Tests if filterProducts gives the corrects product(s) given \'SHIRT\'  as the query', async () => {
        const ex_itemid = ['6404b3cee60e3656fc4f6d1d', '64bb57e0352cba3b992dbd21'];
        const filter = 'SHIRT';

        const act_item = await filterProducts(filter);

        let i = 0;
        act_item.forEach((item) => {
            expect(String(item._id)).toBe(ex_itemid[i]);
            i++;
        });
        
    })
});