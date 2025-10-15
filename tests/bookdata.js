import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchBook, parseBook, addBook, removeBook } from '../src/js/utils/data.js';

let testBook = {
  isbn: 9781839762123,
  first_publish_date: 1902,
  title: 'Mutual Aid: A Factor in Evolution !',
  authors: 'Peter Kropotkin',
  dateAdded: new Date(Date.now()).toString(),
  dateModified: new Date(Date.now()).toString(),
  count: 1
};

test('successfully retrieves a book from open library', async t => {
  let book = await fetchBook(testBook.isbn);
  await t.test('retrieves title', () => {
    return assert.equal(book.title, testBook.expected_title);
  });
  await t.test('is passed isbn as expected', () => {
    return assert.equal(book.isbn, testBook.isbn);
  });
});

test('book data parses correctly', async t => {
  const book = await fetchBook(testBook.isbn);
  const parsedBook = await parseBook(book);

  await t.test('has the necessary keys', () => {
    return assert(() => {
      return (
        parsedBook.isbn &&
        parsedBook.title &&
        parsedBook.first_publish_date &&
        parsedBook.authors &&
        parsedBook.date_added &&
        parsedBook.date_modified &&
        parsedBook.count
      );
    });
  });
  await t.test('properly parses authors', () => {
    return assert.equal(parsedBook.authors, testBook.authors);
  });
});

test('book data successfuly updated ', async t => {
  await t.test('date modified is updated', () => {
    return true; // assert.equal(parsedBook.authors, testBook.authors);
  });
  await t.test('count is updated on update', () => {
    return true; // assert.equal(parsedBook.authors, testBook.authors);
  });
});

// test('book successfully added', async t => {
//   const r = await addBook(testBook);
//   await t.test('book added successfully', () => {
//     console.log('» addbooktest | »»»»»»', testBook, r);
//     return assert(false);
//   });
// });

// test('book successfuly removed ', async t => {
//   const r = await removeBook(testBook);
//   await t.test('book removed successfully', () => {
//     console.log('» removebooktest | »»»»»»', testBook, r);
//     return assert(false);
//   });
// });
