import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { retrieveData } from '../db';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { PermissionsAndroid } from 'react-native';

const HistoryScreen: React.FC = () => {
  const [historyData, setHistoryData] = useState([]);
  const [activeTab, setActiveTab] = useState('History');
  const navigation = useNavigation();
  const route = useRoute();

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




  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to save PDFs.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
  
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Storage permission granted');
        return true; // Return true if permission is granted
      } else {
        console.log('Storage permission denied');
        return false; // Return false if permission is denied
      }
    } catch (err) {
      console.warn(err);
      return false; // Return false if there is an error
    }
  };
// Call this function before attempting to save the PDF


  // Export to PDF function
  const exportToPDF = async () => {
    await requestStoragePermission(); // Ensure permission is granted
    if (historyData.length === 0) {
      Alert.alert('No Data', 'There is no history data to export.');
      return;
    }

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', sans-serif; color: #333; margin: 20px; border-radius: 10px; overflow: hidden; border: 1px solid #ddd;">
        <!-- Header -->
        <header style="background-color: #fd7013; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">History Data Report</h1>
        </header>
  
        <!-- GCS Severity Info -->
        <section style="padding: 20px; background-color: #ffffff; border-bottom: 2px solid #fd7013;">
          <h2 style="color: #fd7013; font-size: 20px;">Glasgow Coma Scale (GCS) Severity Levels</h2>
          <p style="margin: 8px 0; font-size: 16px;">
            <strong>Mild:</strong> GCS score 13-15 <br>
            <strong>Moderate:</strong> GCS score 9-12 <br>
            <strong>Severe:</strong> GCS score 3-8
          </p>
        </section>
  
        <!-- Content -->
        <section style="padding: 20px; background-color: #f9f9f9;">
          <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
            <thead>
              <tr>
                <th style="border: 1px solid #fd7013; padding: 12px; background-color: #f2f2f2; color: #393e46; text-align: left;">Injury Date & Time</th>
                <th style="border: 1px solid #fd7013; padding: 12px; background-color: #f2f2f2; color: #393e46; text-align: left;">Severity</th>
                <th style="border: 1px solid #fd7013; padding: 12px; background-color: #f2f2f2; color: #393e46; text-align: left;">Region</th>
              </tr>
            </thead>
            <tbody>
              ${historyData.map((item, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f7f7f7'};">
                  <td style="border: 1px solid #ddd; padding: 10px; color: #444;">${new Date(item.injuryDate).toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; color: ${item.severity === 'Severe' ? '#d9534f' : (item.severity === 'Moderate' ? '#f0ad4e' : '#5bc0de')}; font-weight: bold;">${item.severity}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; color: #444;">${item.meshName}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
  
        <!-- Divider -->
        <div style="height: 5px; background: linear-gradient(to right, #fd7013, #393e46); margin: 0;"></div>
  
        <!-- Footer -->
        <footer style="text-align: center; padding: 15px; background-color: #393e46; color: #ffffff;">
          <p style="margin: 0; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
          <p style="margin: 0; font-size: 12px; color: #cccccc;">This is an automatically generated report</p>
        </footer>
      </div>
    `;


    const downloadPath = `${RNFS.DownloadDirectoryPath}/HistoryData.pdf`; // Saves to the "Downloads" folder

    const options = {
      html: htmlContent,
      fileName: 'HistoryData',
      directory: 'Downloads', // Specifies the Downloads directory
      filePath: downloadPath, // Path where the file will be saved
    };

    try {
      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('PDF created', `File saved to: ${file.filePath}`);
      console.log('PDF created:', file.filePath);
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to create PDF');
    }
  };

  // Check if we need to call exportToPDF
  useEffect(() => {
    if (route.params?.callExport) {
      exportToPDF();
    }
  }, [route.params]);


  const renderItem = ({ item }) => {
    const circleColor =
      item.severity === 'Severe' ? '#FF6B6B' :
      item.severity === 'Moderate' ? '#FFD93D' :
      '#A8E6CF'; // Soft Green for Mild
  
    return (
      <View style={styles.itemContainer}>
        <View style={styles.row}>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Injury Date & Time</Text>
            <Text style={styles.dateTimeValue}>
              {new Date(item.injuryDate).toLocaleString()}
            </Text>
          </View>
          <View style={styles.regionContainer}>
            <Text style={styles.label}>Region</Text>
            <Text style={styles.regionValue}>{item.meshName}</Text>
          </View>
          <View style={styles.severityContainer}>
            <Text style={styles.label}>Severity</Text>
            <View style={[styles.circle, { borderColor: circleColor }]}>
              <Text style={[styles.severityText, { color: circleColor }]}>
                {item.severity}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

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

       <FlatList
            data={historyData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
          />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  list: {
    paddingBottom: 20,
  },

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
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  itemContainer: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  dateTimeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
 
  circle: {
    width: 75, // Increased width for better visibility
    height: 60, // Increased height for better visibility
    borderRadius: 100,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent for depth
  },
  severityText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
 
  regionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  list: {
    paddingBottom: 20,
  },
  exportButton: {
    backgroundColor: '#fd7013',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
 
  label: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'left', // Center-align text for better uniformity
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dateTimeContainer: {
    flex: 2, // Adjusted to give more space to the date and time
    marginRight: 20,
  },
  regionContainer: {
    flex: 2, // This will place the region in the middle
    alignItems: 'left', // Center the content vertically
    
  },
  severityContainer: {
    flex: 2, // This will place the severity at the end
    alignItems: 'center', // Center the content horizontally
  },

});

export default HistoryScreen;
