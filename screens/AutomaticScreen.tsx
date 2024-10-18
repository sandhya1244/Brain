import React, { useEffect, useState, Suspense } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Button,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { LineChart } from 'react-native-chart-kit'; // Import LineChart
import { Buffer } from 'buffer';
import { throttle } from 'lodash';
import { Canvas } from '@react-three/fiber';
import useControls from 'r3f-native-orbitcontrols';
import Model from '../src/models_a';
import { createTable, insertInjuryData } from '../automatic_db'; // Adjust the path as necessary
import { useNavigation } from '@react-navigation/native';


const AutomaticScreen: React.FC = ({ route }) => {
  const { connectedDevice } = route.params;
  const [OrbitControls, events] = useControls();
  const [notificationListener, setNotificationListener] = useState<any>(null);
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState<{ x: number; y: number; z: number }[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [baseline, setBaseline] = useState<{ x: number; y: number; z: number } | null>(null);
  const [calibrating, setCalibrating] = useState(false); // Add state to track calibration status
  const [highAccelerationData, setHighAccelerationData] = useState<{ x: number; y: number; z: number }[]>([]);
  const navigation = useNavigation();

 const chartConfig = {
    backgroundColor: '#e26a00',
    backgroundGradientFrom: '#fb8c00',
    backgroundGradientTo: '#ffa726',
    decimalPlaces: 2, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };


  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    createTable();
  }, []);
  

  const removeNotificationListener = () => {
    if (notificationListener) {
      notificationListener.remove();
      setNotificationListener(null); // Clear the listener reference
      setNotificationsActive(false); // Set notifications as inactive
      console.log('Notification listener removed');
    }
  };


useEffect(() => { 
  removeNotificationListener();
}, [connectedDevice]);          

 const setupAccelerometerNotifications = async (deviceId: string) => {
    try {
      const serviceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
      const characteristicUUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

      await BleManager.startNotification(deviceId, serviceUUID, characteristicUUID);

      const listener = BleManager.addListener('BleManagerDidUpdateValueForCharacteristic', ({ value, peripheral, characteristic }) => {
        if (peripheral === deviceId && characteristic === characteristicUUID) {
          handleReceivedData(value); // Process data using the helper function
        }
      });

      // Save the listener if needed
      setNotificationListener(listener);
      setNotificationsActive(true);

      console.log('Accelerometer notifications setup complete');
    } catch (error) {
      console.error('Error setting up accelerometer notifications:', error);
    }
  };
    




 const startAccelerometer = async (deviceId: string) => {
    try {
      const serviceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
      const characteristicUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
  
      const command = `
        var interval = setInterval(function() {
          var acc = Puck.accel();
          Bluetooth.println(JSON.stringify(acc));
        },2000);
        console.log('Accelerometer started');
      `;
    
      const encoder = new TextEncoder();
      const data = encoder.encode(command);
  
      await BleManager.write(deviceId, serviceUUID, characteristicUUID, Array.from(data));
      console.log('Accelerometer command sent');
      await setupAccelerometerNotifications(deviceId); // Wait until the notifications are fully set up
    } catch (error) {
      console.error('Error sending accelerometer command:', error);
      Alert.alert('Error', 'Failed to start accelerometer.');
    }
  };


   const stopAccelerometer = async (deviceId: string) => {
    try {
      const serviceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
      const characteristicUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
      
      const command = 'clearInterval(interval); Puck.accelOff(); E.reboot(); console.log("Accelerometer stopped");\n';
      const encoder = new TextEncoder();
      const data = encoder.encode(command);
      
      await BleManager.write(deviceId, serviceUUID, characteristicUUID, Array.from(data));
      console.log('Accelerometer stop command sent');
      
      setTimeout(() => {
        removeNotificationListener();
        setAccelerometerData([]);
        Alert.alert('Accelerometer Stopped', 'The accelerometer has been stopped.');
      }, 10);
      
    } catch (error) {
      console.error('Error stopping accelerometer:', error);
    }
  };


 const startCalibration = () => {
    setCalibrating(true);
    setAccelerometerData([]); // Clear previous data for calibration
  
    setTimeout(() => {
      // Calculate the baseline values after 5 seconds
      if (accelerometerData.length > 0) {
        const sum = accelerometerData.reduce(
          (acc, data) => ({
            x: acc.x + data.x,
            y: acc.y + data.y,
            z: acc.z + data.z,
          }),
          { x: 0, y: 0, z: 0 }
        );
  
        const average = {
          x: sum.x / accelerometerData.length,
          y: sum.y / accelerometerData.length,
          z: sum.z / accelerometerData.length,
        };
  
        setBaseline(average);
        console.log('Baseline set:', average); // Log the baseline value
        setCalibrating(false);
      } else {
        console.error('No data received during calibration.');
        setCalibrating(false);
      }
    }, 5000); // Calibration time of 5 seconds
  };

 //console.log(baseline);


  
  
const [dataBuffer, setDataBuffer] = useState('');
const WINDOW_SIZE = 20;  // Sliding window size
const NUM_STD_DEV = 2;   // Number of standard deviations for high acceleration

const handleReceivedData = (value: Uint8Array) => {
  const newData = Buffer.from(value).toString('utf8');
  const delimiter = '\n';

  setDataBuffer(prevBuffer => {
    const updatedBuffer = prevBuffer + newData;
    const parts = updatedBuffer.split(delimiter);
    const validData = parts.slice(0, -1); // Extract valid data
    const remainingBuffer = parts[parts.length - 1]; // Remainder of buffer

    validData.forEach(dataPart => {
      try {
        const parsedData = JSON.parse(dataPart);
        console.log('Parsed data:', parsedData);

        if (parsedData.acc && parsedData.acc.x !== undefined && parsedData.acc.y !== undefined && parsedData.acc.z !== undefined) {
          let { x, y, z } = parsedData.acc;

          setBaseline(prevBaseline => {
            if (prevBaseline) {
              // Apply baseline correction
              x -= prevBaseline.x;
              y -= prevBaseline.y;
              z -= prevBaseline.z;
            }

            console.log('Baseline corrected:', { x, y, z });

            // Calculate the magnitude of the acceleration vector
            const magnitude = Math.sqrt(x * x + y * y + z * z);

            // Update accelerometer data with previous values
            setAccelerometerData(prevData => {
              const updatedData = [...prevData, { x, y, z }];
              if (updatedData.length > WINDOW_SIZE) {
                updatedData.shift(); // Keep only the last WINDOW_SIZE data points
              }

              if (updatedData.length >= WINDOW_SIZE) {
                // Calculate mean and standard deviation for the sliding window
                const mean = updatedData.reduce((sum, val) => sum + Math.sqrt(val.x * val.x + val.y * val.y + val.z * val.z), 0) / WINDOW_SIZE;
                const variance = updatedData.reduce((sum, val) => sum + Math.pow(Math.sqrt(val.x * val.x + val.y * val.y + val.z * val.z) - mean, 2), 0) / WINDOW_SIZE;
                const stdDev = Math.sqrt(variance);
                console.log('Mean:', mean, 'Standard deviation:', stdDev, variance / WINDOW_SIZE);

                // Detect if the current magnitude is an outlier (high acceleration)
                const deviation = Math.abs(magnitude - mean);
                if (deviation > NUM_STD_DEV * stdDev) {
                  console.log('High acceleration detected:', magnitude, 'Deviation:', deviation);

                  const currentDate = new Date();
                  const date = currentDate.toLocaleDateString();
                  const time = currentDate.toLocaleTimeString();


                  // Determine which axis has the highest absolute acceleration
                  let direction = '';
                  const maxAcceleration = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));

                  if (maxAcceleration === Math.abs(x)) {
                    direction = 'LEFT-RIGHT';
                  } else if (maxAcceleration === Math.abs(y)) {
                    direction = 'FRONT-BACK';
                  } else if (maxAcceleration === Math.abs(z)) {
                    direction = 'TOP-DOWN';
                  }

                  console.log(`High acceleration detected in the ${direction} direction.`);


                  // Also store the high acceleration data along with the direction
                  setHighAccelerationData(prevHighAccData => [
                    ...prevHighAccData,
                    { x, y, z, direction } // Add direction info
                  ]);

                 insertInjuryData(date, time, 1, direction);
                }
              }

              return updatedData;
            });

            return prevBaseline;
          });
        }
      } catch (error) {
        // Handle JSON parsing error
      }
    });

    return remainingBuffer;
  });
};





return (
  <ImageBackground
    source={require('../assets/background_img.jpg')} // Add your image path here
    style={styles.backgroundImage} // Apply background image style
  >
  <ScrollView contentContainerStyle={styles.scrollContainer}>
  <View style={styles.container}>
    <Text style={styles.heading}></Text>
    <View style={styles.canvasContainer}{...events}>
      <Canvas style={styles.canvas} camera={{ position: [0, 0, 4] }}>
        <OrbitControls enablePan={true} />
        <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[-1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[1, 0, 10]} args={['#9e9e9e', 2]} />
        <directionalLight position={[-1, 0, 10]} args={['#9e9e9e', 2]} />
        <Suspense fallback={null}>
          <Model rotationSpeed={0.01} />   
        </Suspense>
      </Canvas>
    </View>

    {connectedDevice && (
            <View style={styles.bucketContainer}>
              {/* Start Accelerometer */}
              <TouchableOpacity
                style={[styles.bucket, { backgroundColor: '#ff6b6b' }]}
                onPress={() => startAccelerometer(connectedDevice.id)}
              >
                <Text style={styles.bucketText}>Start</Text>
              </TouchableOpacity>

              {/* Stop Accelerometer */}
              <TouchableOpacity
                style={[styles.bucket, { backgroundColor: '#4ecdc4' }]}
                onPress={() => stopAccelerometer(connectedDevice.id)}
              >
                <Text style={styles.bucketText}>Stop</Text>
              </TouchableOpacity>

              {/* Calibrate Accelerometer */}
              <TouchableOpacity
                style={[styles.bucket, { backgroundColor: '#f7b731' }]}
                onPress={startCalibration}
                disabled={calibrating}
              >
                <Text style={styles.bucketText}>Calibrate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  style={[styles.bucket, { backgroundColor: '#CCCCFF' }]}
                  onPress={() => setShowChart(prev => !prev)} // Toggle chart visibility
                >
                  <Text style={styles.bucketText}>Graph</Text>
                </TouchableOpacity>
            </View>
          )}

      {showChart && accelerometerData.length > 0 && (
        <LineChart
          data={{
            labels: [...Array(accelerometerData.length).keys()].map(String),
            datasets: [
              { data: accelerometerData.map(data => data.x), color: () => 'red' }, // X-axis
              { data: accelerometerData.map(data => data.y), color: () => 'green' }, // Y-axis
              { data: accelerometerData.map(data => data.z), color: () => 'blue' }, // Z-axis
            ],
          }}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      )}

    {highAccelerationData.length > 0 ? (
  <View style={styles.container}>
    <Text style={styles.listTitle}>Injury Side Records</Text>
    <View style={styles.listContainer}>
      <FlatList
        data={highAccelerationData}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.highAccItemContainer}
            onPress={() => navigation.navigate('Chart')}
          >
            <View style={styles.highAccIndexContainer}>
              <Text style={styles.highAccIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.highAccContent}>
              <Text style={styles.highAccTitle}>Location ({item.direction})</Text>
              <View style={styles.highAccValues}>
                <Text style={styles.highAccText}>X: {item.x.toFixed(2)}</Text>
                <Text style={styles.highAccText}>Y: {item.y.toFixed(2)}</Text>
                <Text style={styles.highAccText}>Z: {item.z.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
        style={styles.highAccList}
        contentContainerStyle={{ paddingBottom: 20 }} // Optional: Add padding to the bottom
      />
    </View>
  </View>
) : (
  <TouchableOpacity 
      style={styles.noDataContainer} 
      onPress={() => navigation.navigate('Chart')} // Adjust 'ChartPage' to your actual chart screen name
    >
      <Text style={styles.noDataText}>No Data Available</Text>
      <Text style={styles.footerMessage}>Please make sure your device is connected.</Text> 
    </TouchableOpacity>
)}
</View>
</ScrollView>
</ImageBackground>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 20,
  backgroundColor: 'transparent',
},
heading: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 20,
  textAlign: 'center',
},

canvasContainer: {
  width: 400,
  height: 400,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
},

highAccItemContainer: {
  flexDirection: 'row',
  padding: 10,
  marginVertical: 5,
  backgroundColor: '#f5f5f5',
  borderRadius: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 3, // for Android shadow
  borderWidth: 1,
  borderColor: '#ddd',
},

footerMessage: {
  // New styles for footer message
  fontSize: 14,
  color: 'gray', // or any color you prefer
  marginTop: 10, // Space between no data text and footer message
},

highAccIndexContainer: {
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#ff7043', // vibrant color for the index
  borderRadius: 55,
  width: 35,
  height: 35,
  marginRight: 10,
},
highAccIndexText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
},
highAccContent: {
  flex: 1,
  justifyContent: 'center',
},
highAccTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 5,
},
listTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center',
  color: '#333',
},
scrollContainer: { flexGrow: 1 },
listContainer: {
  borderWidth: 1,
  borderColor: 'transparent',
  borderRadius: 10,
  overflow: 'hidden',
},
highAccValues: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},
highAccText: {
  fontSize: 14,
  color: '#666',
},
noDataContainer: {
  flex: 1, // Take up the available space
  justifyContent: 'center', // Center the content vertically
  alignItems: 'center', // Center the content horizontally
  padding: 0.5, // Add some padding
  backgroundColor: 'transparent',
  borderWidth: 1, // Optional border
  borderColor: '#ddd', // Light border color
  borderRadius: 6, // Rounded corners
  margin: 30, // Margin around the container
  shadowColor: '#000', // Shadow color for iOS
  shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
  shadowOpacity: 0.3, // Shadow opacity for iOS
  shadowRadius: 4, // Shadow radius for iOS
  elevation: 5, // Elevation for Android

},

noDataText: {
  textAlign: 'center',
  fontSize: 18, // Increased font size
  color: '#555', // Darker text color for better visibility
  marginTop: 10,
  fontWeight: 'bold', // Bold text for emphasis
  textDecorationLine: 'underline', // Optional: Underline for a link-like effect
},

highAccList: {
  marginTop: 20,
},

highAccItem: {
  padding: 10,
  backgroundColor: '#e8e8e8',
  borderColor: '#ccc',
  borderWidth: 1,
  marginBottom: 5,
  borderRadius: 5,
},

bucketContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: 20,
},
bucket: {
  width: 80,
  height: 80,
  borderRadius: 40,
  justifyContent: 'center',
  alignItems: 'center',
},
bucketText: {
  color: 'white',
  fontWeight: 'bold',

},
backgroundImage: {
  flex: 1,
  resizeMode: 'cover', // Optional: Adjust the image layout (contain, stretch, etc.)
},
canvas: {
  flex: 1,
  width: '100%',
  height: '100%',
},
chart: {
  marginVertical: 8,
  borderRadius: 16,
},

transparentContainer: {
  position: 'absolute',
  width: '100%',
  zIndex: 1,
  backgroundColor: 'transparent',
},
});

export default AutomaticScreen;