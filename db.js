// src/db.js
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'mydatabase.db',
    location: 'default',
  },
  () => {},
  error => {
    console.log('Error opening database:', error);
  }
);

const getCurrentDateTime = () => {
  const now = new Date();
  return now.toISOString(); // Returns date and time in ISO 8601 format
};

export const createTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS brain_injury (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meshName TEXT,
        x REAL,
        y REAL,
        z REAL,
        severity INTEGER,
        injuryDate TEXT
      )`,
      [],
      () => {
        console.log('Table created successfully');
      },
      error => {
        console.log('Error creating table:', error);
      }
    );
  });
};

export const insertData = (data) => {
  const currentDateTime = getCurrentDateTime();
  
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO brain_injury (meshName, x, y, z, severity, injuryDate)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [data.meshName, data.x, data.y, data.z, data.severity, currentDateTime],
      () => {
        console.log('Data inserted successfully');
      },
      error => {
        console.log('Error inserting data:', error);
      }
    );
  });
};
