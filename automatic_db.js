import SQLite from 'react-native-sqlite-storage';

// Open or create the database
const db = SQLite.openDatabase(
  {
    name: 'Automatic_injuryData.db',
    location: 'default',
  },
  () => {},
  error => {
    console.error('Database error: ', error);
  }
);

// Create the table
export const createTable = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS InjuryRecords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        time TEXT,
        injury_count INTEGER,
        direction TEXT
      );`,
      [],
      () => {
        console.log('Table created successfully');
      },
      error => {
        console.error('Error creating table: ', error);
      }
    );
  });
};

// Insert injury data
export const insertInjuryData = (date, time, injuryCount, direction) => {
  console.log('Inserting data:');
  console.log('Date:', date);
  console.log('Time:', time);
  console.log('Injury Count:', injuryCount);
  console.log('Direction:', direction);

  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO InjuryRecords (date, time, injury_count, direction) VALUES (?, ?, ?, ?)`,
      [date, time, injuryCount, direction],
      () => {
        console.log('Data inserted successfully');
      },
      error => {
        console.error('Error inserting data: ', error);
      }
    );
  });
};

// Retrieve injury data
export const fetchInjuryData = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM InjuryRecords;`,
      [],
      (tx, results) => {
        const data = [];
        for (let i = 0; i < results.rows.length; i++) {
          data.push(results.rows.item(i));
        }
        console.log('Retrieved data:', data);
        callback(data);
      },
      error => {
        console.error('Error retrieving data: ', error);
        callback([]); // Return an empty array on error
      }
    );
  });
};


