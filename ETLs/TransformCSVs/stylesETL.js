const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

const inputFilePath = './styles.csv';
const outputFilePath = './newStyles.csv'

const transformData = (row) => {
  return {
    style_id: parseInt(row.id),
    product_id: parseInt(row.productId),
    name: row.name,
    original_price: row.original_price,
    sale_price: row.sale_price,
    default_style: row.default_style,
    photos: [],
    skus: {}
  };
};

const inputStream = fs.createReadStream(inputFilePath);
const outputStream= fs.createWriteStream(outputFilePath);

const headers = ['style_id', 'product_id', 'name', 'original_price', 'sale_price', 'default_style', 'photos', 'skus'];
outputStream.write(headers.join(',') + '\n');

const parser = new Parser({ header: false });

inputStream
  .pipe(csv())
  .on('data', (row) => {
    const transformedRow = transformData(row);

    const csvRow = parser.parse([transformedRow]);
    outputStream.write(csvRow + '\n');
  })
  .on('end', () => {
    console.log('Hurray you did it!')
  })
  .on('error', (err) => {
    console.log('Crap. Error!', err)
  })