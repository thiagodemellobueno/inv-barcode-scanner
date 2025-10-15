import { log } from '../utils/log.js';
import axios from 'axios';

export async function fetchBook(isbn) {
  // console.log('| getBookDetails » | ', isbn);
  const url = 'https://openlibrary.org/search.json?isbn=' + isbn + '&format=json&jscmd=data';
  let book = {};
  return axios
    .get(url)
    .then(r => {
      book = r.data.docs[0];
      book.isbn = isbn;
      return book;
    })
    .catch(error => {
      console.log('Error:', error);
    });
}

export async function parseBook(book) {
  // console.log('| parseBook » | ');
  let authors = book.author_name.join(',');
  let bookObj = {
    isbn: book.isbn,
    first_publish_date: book.first_publish_date,
    title: book.title,
    authors: authors,
    dateAdded: book.dateAdded || new Date(Date.now()).toString(),
    dateModified: Date(Date.now()).toString(),
    count: 1
  };

  return bookObj;
}

export async function updateBook(book, bookInventory) {
  // log.info('| updateBook » | ', book.isbn, book.title);
  if (bookInventory[book.isbn]) {
    bookInventory[book.isbn].count += 1;
    // UPDATE COUNT FIELD VIA API
  } else {
    bookInventory[book.isbn] = book;
    // ADD BOOK VIA API
    //console.log('lets add another entry', book), bookInventory[book.isbn];
  }
  return bookInventory;
}

export async function addBook(book) {
  const url = `http://localhost:8000/api.php/records/books/`; // ${book.isbn}`;
  // log.info('| addBook » | ', url, book);
  return axios
    .post(url, book)
    .then(r => {
      log.info('| addBook » |', book, r);
    })
    .catch(error => {
      console.log('Error:', error);
    });
}

export async function removeBook(book) {
  const url = `http://localhost:8000/api.php/records/books/${book.isbn}`;
  // log.info('| removeBook » | ', url, book);
  return axios
    .post(url)
    .then(r => {
      log.info('| removeBook » | ', book, r);
    })
    .catch(error => {
      console.log('Error:', error);
    });
}
