const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

const inputFilePath = './product.csv';
const outputFilePath = './newProduct.csv'

const transformData = (row) => {
  return {
    product_id: parseInt(row.id),
    name: row.name,
    slogan: row.slogan,
    description: row.description,
    category: row.category,
    default_price: row.default_price
  };
};

const inputStream = fs.createReadStream(inputFilePath);
const outputStream= fs.createWriteStream(outputFilePath);

const headers = ['style_id', 'url', 'thumbnail_url'];
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