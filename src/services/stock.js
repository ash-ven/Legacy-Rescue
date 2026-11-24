// Un prodotto è "sotto scorta" quando la quantità è sotto la scorta minima.
const isLowStock = (product) => product.qty < product.minQty;

module.exports = { isLowStock };
