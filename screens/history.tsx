import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { retrieveData } from '../db';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';

const HistoryScreen: React.FC = () => {
  const [historyData, setHistoryData] = useState([]);
  const [activeTab, setActiveTab] = useState('History');
  const navigation = useNavigation();

  useEffect(() => {
    retrieveData()
      .then((data) => {
        const sortedData = data.sort(
          (a, b) => new Date(b.submissionDate) - new Date(a.submissionDate)
        );
        setHistoryData(sortedData);
      })
      .catch((error) => {
        console.log('Error fetching history data:', error);
      });
  }, []);




  const exportToPDF = async () => {
    const htmlContent = `
        <h1>History Data</h1>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px;">Injury Date & Time</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Severity</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Region</th>
            </tr>
          </thead>
          <tbody>
            ${historyData.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(item.injuryDate).toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.severity}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.meshName}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
  
    // Save PDF directly to public Downloads folder
    const downloadPath = `${RNFS.DownloadDirectoryPath}/HistoryData.pdf`;
  
    const options = {
      html: htmlContent,
      fileName: 'HistoryData',
      directory: 'Download',
      filePath: downloadPath,  // Correct public download folder path
    };
  
    try {
      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('PDF created', `File saved to: ${file.filePath}`);
      console.log('PDF file path:', file.filePath);
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to create PDF');
    }
  };
  

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.label}>Injury Date & Time:</Text>
      <Text style={styles.value}>{new Date(item.injuryDate).toLocaleString()}</Text>

      <Text style={styles.label}>Severity:</Text>
      <Text style={styles.value}>{item.severity}</Text>

      <Text style={styles.label}>Region:</Text>
      <Text style={styles.value}>{item.meshName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'History' && styles.activeTab]}
          onPress={() => setActiveTab('History')}
        >
          <Text style={styles.recordIcon}>📜</Text>
          <Text style={styles.tabText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Dashboard' && styles.activeTab]}
          onPress={() => {
            setActiveTab('Dashboard');
            navigation.navigate('Details');
          }}
        >
          <Text style={styles.recordIcon}>📊</Text>
          <Text style={styles.tabText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'History' && (
        <>
          <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
            <Text style={styles.exportButtonText}>Export to PDF</Text>
          </TouchableOpacity>
          <FlatList
            data={historyData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#444',
  },
  tabText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recordIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  itemContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  list: {
    paddingBottom: 20,
  },
  exportButton: {
    backgroundColor: '#fd7013',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HistoryScreen;
