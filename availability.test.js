const ItemsModel = require('./models/itemsDB');
const editStockAvailability = require('./server');

const item_id = '6404b3cee60e3656fc4f6d1d';

test('Edit the stock availability of the corresponding item (adds 1)', async () => {
    const edit_item = await ItemsModel.findOne({_id: item_id});
    const old_size = edit_item.availability[0].size;
    const old_stock = edit_item.availability[0].stock;

    const new_size = 'S';
    var new_stock = parseInt(old_stock) + 1;

    const newly_edit_item = await editStockAvailability(item_id, old_size, old_stock, new_size, new_stock);

    const _id = String(newly_edit_item._id);
    var i = 0;
    let size = "";
    let stock = "";

    while (i < newly_edit_item.availability.length) {
        if (newly_edit_item.availability[i].size == new_size) {
            if (newly_edit_item.availability[i].stock == new_stock) {
                size = newly_edit_item.availability[i].size;
                stock = newly_edit_item.availability[i].stock;
                break;
            }
        }
        i++;
    }
    
    expect(_id).toBe(item_id);
    expect(size).toBe(new_size);
    expect(stock).toBe(new_stock);

    console.log("Old Values")
    console.log("old size: " + old_size);
    console.log("old stock: " + old_stock);
    console.log("After Expect")
    console.log("size: " + size + " = new_size: " + new_size);
    console.log("stock: " + stock + " = new_stock: " + new_stock);

    await ItemsModel.updateOne({_id: item_id, availability: { $elemMatch: {size: new_size, stock: new_stock}} },{
        $set: {
            'availability.$.size': old_size,
            'availability.$.stock': old_stock
        }
    });

    console.log("Reverted Values")
    console.log("reverted size: " + edit_item.availability[0].size);
    console.log("reverted stock: " + edit_item.availability[0].stock);
});