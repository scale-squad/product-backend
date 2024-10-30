const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');

const inputFilePath = './features.csv';
const outputFilePath = './newFeatures.csv'

const transformData = (row) => {
  return {
    product_id: parseInt(row.product_id),
    feature: row.feature,
    value: row.value,
  };
};

const inputStream = fs.createReadStream(inputFilePath);
const outputStream= fs.createWriteStream(outputFilePath);

const headers = ['product_id', 'feature', 'value'];
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