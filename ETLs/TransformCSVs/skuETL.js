const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

const inputFilePath = './skus.csv';
const outputFilePath = './newSkus.csv'

const transformData = (row) => {
  return {
    sku_id: parseInt(row.id),
    style_id: parseInt(row.styleId),
    quantity: row.quantity,
    size: row.size
  };
};

const inputStream = fs.createReadStream(inputFilePath);
const outputStream= fs.createWriteStream(outputFilePath);

const headers = ['sku_id', 'style_id', 'quantity', 'size'];
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