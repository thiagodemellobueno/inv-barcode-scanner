import fetch from 'isomorphic-unfetch';

export async function getBookDetails(code) {
  try {
    // calling the API
    console.log('getBookDetails', code);
    let book = {};
    var url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + code + '&country=US';
    return fetch(url)
      .then(r => r.json())
      .then(data => data.items[0].volumeInfo);
  } catch (err) {
    console.log(err);
  }
}
