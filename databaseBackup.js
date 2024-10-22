// databaseBackup.js
import RNFS from 'react-native-fs';
import { GoogleSignin } from 'react-native-google-signin';
import GoogleDrive from 'react-native-google-drive-api-wrapper';
import db from './db'; // Import the database operations

// Function to backup the database
export const backupDatabase = async () => {
  const sourcePath = `${RNFS.DocumentDirectoryPath}/app.db`; // Path to the original database
  const backupPath = `${RNFS.DocumentDirectoryPath}/backup_app.db`; // Path for backup

  try {
    await RNFS.copyFile(sourcePath, backupPath); // Copy the original database to a backup
    console.log('Database backup created at:', backupPath);
    return backupPath; // Return the backup file path
  } catch (error) {
    console.log('Error backing up database:', error);
    throw error;
  }
};

// Function to upload the database backup to Google Drive
export const uploadDatabaseToGoogleDrive = async (filePath) => {
  try {
    await GoogleSignin.signIn(); // Sign in the user to Google

    const userInfo = await GoogleSignin.getCurrentUser();
    const accessToken = userInfo?.accessToken;

    GoogleDrive.setAccessToken(accessToken); // Set the access token for Google Drive API

    const response = await GoogleDrive.files.create({
      fileName: 'backup_app.db',
      mimeType: 'application/octet-stream',
      path: filePath,
    });

    console.log('File uploaded to Google Drive:', response);
    alert('Backup uploaded successfully!');
  } catch (error) {
    console.log('Error uploading to Google Drive:', error);
    alert('Failed to upload backup: ' + error.message);
  }
};

// Function to restore the database from a backup
export const restoreDatabase = async (backupFilePath) => {
  const originalPath = `${RNFS.DocumentDirectoryPath}/app.db`; // Path to the original database

  try {
    await RNFS.copyFile(backupFilePath, originalPath); // Copy the backup to the original path
    console.log('Database restored from backup successfully!');
    alert('Database restored successfully!');
  } catch (error) {
    console.log('Error restoring database:', error);
    alert('Failed to restore database: ' + error.message);
  }
};
