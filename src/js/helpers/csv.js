import { readFile } from 'node:fs/promises'; // Access callback-based and sync functions

import { parse, transform, stringify } from 'csv';

export async function loadCSV(csvPath) {
  try {
    const data = await readFile(csvPath, { encoding: 'utf8' });
    console.log('File contents (promises):', data);
    return data;
  } catch (error) {
    console.error('Error reading file:', error);
  }
}

export async function appendEntry(rowData, csvData) {
  console.log('hi from appendEntry');
}

export async function updateEntry(rowData, csvData) {
  console.log('hi from updateEntry');
  // if entry exists
  // // call incrementCount
  // else call appendEntry
}

export async function incrementCount() {
  // find column that has qty, increment it by one
}
