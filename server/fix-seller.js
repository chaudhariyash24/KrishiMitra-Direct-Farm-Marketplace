const m = require('mongoose');
m.connect('mongodb://127.0.0.1:27017/krushimitra').then(async () => {
  // Fix products without sellerId
  await m.connection.db.collection('products').updateMany(
    { farmer: 'Prajwal Dilip Sonawane', sellerId: { $in: [null, '', undefined] } },
    { $set: { sellerId: 'KS-8428' } }
  );
  // Fix orders with empty sellerId
  await m.connection.db.collection('orders').updateMany(
    { sellerName: 'Prajwal Dilip Sonawane', sellerId: '' },
    { $set: { sellerId: 'KS-8428' } }
  );
  console.log('✅ Fixed sellerId for all products and orders');
  process.exit();
});
