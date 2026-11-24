// Magazzino API - v1
// Gestisce prodotti, ordini e report per piu' aziende clienti.
// NB: funziona, non toccare se non serve.

var express = require('express');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

var app = express();
app.use(express.json());

var db;

// la chiave dice di che azienda sei
app.use(function (req, res, next) {
  var key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'missing api key' });
  }
  db.collection('apikeys').findOne({ key: key }).then(function (k) {
    if (!k) {
      return res.status(401).json({ error: 'invalid api key' });
    }
    return db.collection('tenants').findOne({ _id: k.tenantId }).then(function (t) {
      req.tenant = t;
      req.tenantId = k.tenantId;
      next();
    });
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
});

// ---------------- PRODOTTI ----------------

app.get('/products', function (req, res) {
  var q = { tenantId: req.tenantId };
  if (req.query.search) {
    q.name = new RegExp(req.query.search, 'i');
  }
  db.collection('products').find(q).sort({ sku: 1 }).toArray().then(function (products) {
    if (req.query.low_stock == '1') {
      products = products.filter(function (p) { return p.qty < p.minQty; });
    }
    res.json(products);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
});

app.post('/products', function (req, res) {
  var p = req.body;
  if (!p.sku || !p.name) {
    return res.status(400).json({ error: 'sku and name are required' });
  }
  p.tenantId = req.tenantId;
  if (p.qty == undefined) p.qty = 0;
  if (p.minQty == undefined) p.minQty = 0;
  db.collection('products').insertOne(p).then(function () {
    res.status(201).json(p);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
});

app.put('/products/:id', function (req, res) {
  var id = new ObjectId(req.params.id);
  db.collection('products').findOneAndUpdate(
    { _id: id, tenantId: req.tenantId },
    { $set: req.body },
    { returnDocument: 'after' }
  ).then(function (p) {
    if (!p) {
      return res.status(404).json({ error: 'product not found' });
    }
    res.json(p);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
});

// ---------------- ORDINI ----------------

app.get('/orders', function (req, res) {
  db.collection('orders').find({ tenantId: req.tenantId }).sort({ _id: 1 }).toArray().then(function (orders) {
    res.json(orders);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
});

app.get('/orders/:id', function (req, res) {
  db.collection('orders').findOne({ _id: new ObjectId(req.params.id) }).then(function (o) {
    if (!o) {
      return res.status(404).json({ error: 'order not found' });
    }
    res.json(o);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
});

app.post('/orders', function (req, res) {
  var items = req.body.items || [];
  var ids = items.map(function (i) { return new ObjectId(i.productId); });
  db.collection('products').find({ _id: { $in: ids } }).toArray().then(function (products) {
    var order = { tenantId: req.tenantId, items: [], total: 0, createdAt: new Date() };
    for (var i = 0; i < items.length; i++) {
      var p = products.find(function (x) { return x._id.toString() == items[i].productId; });
      if (!p) {
        return res.status(404).json({ error: 'product not found' });
      }
      if (p.qty < items[i].qty) {
        return res.status(400).json({ error: 'not enough stock for ' + p.sku });
      }
      order.items.push({ productId: p._id, sku: p.sku, qty: items[i].qty, price: p.price });
      order.total = order.total + p.price * items[i].qty;
    }
    // scala le scorte
    var updates = order.items.map(function (it) {
      return db.collection('products').updateOne({ _id: it.productId }, { $inc: { qty: -it.qty } });
    });
    return Promise.all(updates).then(function () {
      return db.collection('orders').insertOne(order);
    }).then(function (r) {
      // avvisa l'azienda (se va male, pazienza)
      fetch(req.tenant.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'order.created', orderId: r.insertedId })
      }).catch(function () {});
      res.status(201).json(order);
    });
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
});

// ---------------- REPORT ----------------

app.get('/reports/low-stock.csv', function (req, res) {
  db.collection('products').find({ tenantId: req.tenantId }).sort({ sku: 1 }).toArray().then(function (products) {
    var csv = 'sku,name,qty,minQty\n';
    products.forEach(function (p) {
      if (p.qty < p.minQty) {
        csv += p.sku + ',' + p.name + ',' + p.qty + ',' + p.minQty + '\n';
      }
    });
    res.set('Content-Type', 'text/csv');
    res.send(csv);
  }).catch(function (err) {
    res.status(500).json({ error: err.message });
  });
});

// ---------------- AVVIO ----------------

var url = process.env.MONGO_URL || 'mongodb://localhost:27017/legacy-rescue';
var port = process.env.PORT || 3000;
MongoClient.connect(url).then(function (client) {
  db = client.db();
  return db.collection('products').createIndex({ tenantId: 1, sku: 1 }, { unique: true });
}).then(function () {
  app.listen(port, function () {
    console.log('Magazzino API in ascolto sulla porta ' + port);
  });
});
