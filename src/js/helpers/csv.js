import { parse, transform, stringify } from 'csv';
import fetch from 'isomorphic-unfetch';

export async function appendEntry(book, data) {
  console.log('hi from appendEntry');
}

export async function csvToObject(csvData) {
  let data = {};

  csvData.forEach((entry, index) => {
    if (index > 0 && csvData[entry]) {
      data[csvData[entry][0]] = {
        isbn: csvData[entry][0],
        isbn10: csvData[entry][1],
        title: csvData[entry][2],
        subtitle: csvData[entry][3],
        authors: csvData[entry][4],
        publisher: csvData[entry][5],
        publishedDate: csvData[entry][6],
        lanuage: csvData[entry][7],
        pageCount: csvData[entry][8],
        description: csvData[entry][9],
        categories: csvData[entry][10],
        maturityRating: csvData[entry][11],
        dateModified: csvData[entry][12],
        dateAdded: csvData[entry][13],
        count: csvData[entry][14]
      };
    }
  });
  return data;
}

export async function updateEntry(book, bookInventory) {
  console.log('updateEntry', book, bookInventory);
  if (bookInventory[book.isbn]) {
    bookInventory[book.isbn].count += 1;
  } else {
    bookInventory[book.isbn] = book;
    console.log('lets add another entry', book), bookInventory[book.isbn];
  }
}

export async function incrementCount() {
  // find column that has qty, increment it by one
}

export async function hitEndPoint(string) {
  try {
    // calling the API
    const the_date = Date.now();
    const url = `endpoint.php?msg=${the_date}, ${string}`;
    console.log('url', url);
    return fetch(url).then(r => console.log(r));
  } catch (err) {
    console.log(err);
  }
}
