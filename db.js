import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({ name: 'app.db', location: 'default' });

export const createTable = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS injuries (id INTEGER PRIMARY KEY AUTOINCREMENT, meshName TEXT, x REAL, y REAL, z REAL, severity TEXT, eyeResponse TEXT, verbalResponse TEXT, motorResponse TEXT, injuryDate TEXT, submissionDate TEXT)',
        [],
        () => {
          console.log('Table created successfully');
          resolve();
        },
        (tx, error) => {
          console.log('Error creating table:', error);
          reject(error);
        }
      );
    });
  });
};

export const insertData = (data) => {
  const { meshName, x, y, z, severity, eyeResponse, verbalResponse, motorResponse, injuryDate, submissionDate } = data;
  console.log(data);
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO injuries (meshName, x, y, z, severity, eyeResponse, verbalResponse, motorResponse, injuryDate, submissionDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [meshName, x, y, z, severity, eyeResponse, verbalResponse, motorResponse, injuryDate, submissionDate],
        () => {
          console.log('Data inserted successfully');
          queryLatestData(); // Query and log the latest data after insertion
          resolve();
        },
        (tx, error) => {
          console.log('Error inserting data:', error);
          reject(error);
        }
      );
    });
  });
};


export const retrieveData = () => {
  return new Promise((resolve, reject) => {
    db.transaction(txn => {
      txn.executeSql(
        'SELECT * FROM injuries',
        [],
        (txn, results) => {
          console.log('Retrieved data:');
          let data = [];
          for (let i = 0; i < results.rows.length; i++) {
            data.push(results.rows.item(i));
          }
          resolve(data);
        },
        error => {
          console.log('Error retrieving data:', error);
          reject(error);
        }
      );
    });
  });
};

const queryLatestData = () => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM injuries ORDER BY id DESC LIMIT 1', // Query the latest inserted row
      [],
      (tx, results) => {
        if (results.rows.length > 0) {
          const row = results.rows.item(0);
          console.log('Latest data:', row);
        } else {
          console.log('No data found');
        }
      },
      error => {
        console.log('Error querying data:', error);
      }
    );
  });
};

export default db;
