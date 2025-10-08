import { parse, transform, stringify } from 'csv';
import fetch from 'isomorphic-unfetch';
import axios from 'axios';

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

export async function updateInventory(book, bookInventory) {
  // console.log('updateInventory', book.isbn, book.title, bookInventory);
  if (bookInventory[book.isbn]) {
    bookInventory[book.isbn].count += 1;
  } else {
    bookInventory[book.isbn] = book;
    //console.log('lets add another entry', book), bookInventory[book.isbn];
  }
  return bookInventory;
}

export async function incrementCount() {
  // find column that has qty, increment it by one
}

export async function postData(book) {
  // console.log('» | » postData', book);
  const url = `http://localhost:8080/api.php/records/books/${book.isbn}`;
  const req = axios
    .post(url, book)
    .then(r => {
      console.log(r);
    })
    .catch(error => {
      console.log('Error:', error);
    });
}

export async function stringify(data) {
  return await stringify(data);
}
