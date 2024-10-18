import React, { useEffect, useState } from 'react';
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
  Dimensions,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { LineChart } from 'react-native-chart-kit'; // Import LineChart
import { Buffer } from 'buffer';
import { throttle } from 'lodash';

  const  BluetoothDevicesScreen: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<any | null>(null);
  const [notificationListener, setNotificationListener] = useState<any>(null);
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState<{ x: number; y: number; z: number }[]>([]);
  const [baseline, setBaseline] = useState<{ x: number; y: number; z: number } | null>(null);
  const [calibrating, setCalibrating] = useState(false); // Add state to track calibration status
  const [highAccelerationData, setHighAccelerationData] = useState<{ x: number; y: number; z: number }[]>([]);



   // Setup chart dimensions
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

  // Check and request necessary permissions on Android
  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const allPermissionsGranted = permissions.every(
          perm => granted[perm] === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allPermissionsGranted) {
          BleManager.start({ showAlert: false });
        } else {
          Alert.alert('Permissions required', 'Please enable Bluetooth and location permissions.');
        }
      } catch (error) {
        console.error('Permission request error:', error);
      }
    } else {
      BleManager.start({ showAlert: false });
    }
  };

  // Check Bluetooth state and ensure it is on
  const checkBluetoothState = () => {
    BleManager.checkState();
    const stateListener = BleManager.addListener('BleManagerDidUpdateState', state => {
      console.log('Bluetooth state:', state.state);
      if (state.state !== 'on') {
        Alert.alert('Bluetooth is Off', 'Please enable Bluetooth to scan for devices.');
      }
    });

    return stateListener;
  };

  // Initialize BLE and check for permissions and Bluetooth state
  useEffect(() => {
    checkPermissions();
    const stateListener = checkBluetoothState();

    return () => {
      BleManager.stopScan();
      stateListener.remove();
      if (notificationsActive) {
        removeNotificationListener();
      }
    };
  }, [notificationsActive]);

  // Start scanning for BLE devices
  const startScan = () => {
    setDevices([]);
    setScanning(true);
    console.log('Starting scan...');

    if (notificationListener) {
      removeNotificationListener();
    }

    BleManager.scan([], 5, true)
      .then(() => {
        console.log('Scanning started');
        setTimeout(() => {
          BleManager.stopScan();
          setScanning(false);
          console.log('Scanning stopped');
        }, 5000);
      })
      .catch(err => {
        console.error('Scanning error:', err);
        setScanning(false);
      });
  };

  // Listen for discovered BLE devices
  useEffect(() => {
    const handleDiscoverPeripheral = (peripheral: any) => {
      console.log('Discovered peripheral:', peripheral);

      const deviceName = peripheral.name || 'Unnamed Device';

      setDevices(prevDevices => {
        if (!prevDevices.find(dev => dev.id === peripheral.id)) {
          console.log('Adding device to list:', peripheral);
          return [...prevDevices, { ...peripheral, name: deviceName }];
        }
        return prevDevices;
      });
    };

    const discoverListener = BleManager.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral
    );

    return () => {
      discoverListener.remove();
    };
  }, []);

  const removeNotificationListener = () => {
    if (notificationListener) {
      notificationListener.remove();
      setNotificationListener(null); // Clear the listener reference
      setNotificationsActive(false); // Set notifications as inactive
      console.log('Notification listener removed');
    }
  };

  // Connect to a selected BLE device
  const connectToDevice = async (device: any) => {
    try {
      console.log(`Connecting to device ${device.name || 'Unnamed Device'}`);
  
      await BleManager.connect(device.id);
      setConnectedDevice(device);
      console.log(`Successfully connected to ${device.name || 'Unnamed Device'}`);
  
      const peripheralInfo = await BleManager.retrieveServices(device.id);
      console.log('Device info:', peripheralInfo); // Print all available services and characteristics
  
    } catch (error) {
      console.error('Error connecting to device:', error);
      Alert.alert(
        'Connection Failed',
        `Failed to connect to ${device.name || 'Unnamed Device'}`
      );
    }
  };

  // Setup notifications for accelerometer data
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
 
  // Send command to start accelerometer data stream
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

  // Stop accelerometer
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


  // Function to start the calibration process
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
                  // Perform actions like storing or processing the high acceleration event

                  setHighAccelerationData((prevHighAccData) => [...prevHighAccData, { x, y, z }]);
                }
              }

              return updatedData;
            });

            return prevBaseline;
          });
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    });

    return remainingBuffer;
  });
};



     // Disconnect from a connected BLE device
     const disconnectFromDevice = async (deviceId: string) => {
      try {
        if (notificationListener) {
          removeNotificationListener();
        }
        await BleManager.disconnect(deviceId);
        console.log(`Disconnected from ${deviceId}`);
        setConnectedDevice(null);
      } catch (error) {
        console.error('Error disconnecting from device:', error);
        Alert.alert('Error', 'Failed to disconnect from device.');
      }
    };

  const renderDeviceItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.deviceItem} onPress={() => connectToDevice(item)}>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>BLE Scanner</Text>
      <Button title="Scan Devices" onPress={startScan} />
      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.id}
        style={styles.deviceList}
      />
      {connectedDevice && (
        <View>
          <Text style={styles.connectedDevice}>Connected to {connectedDevice.name}</Text>
          <View style={styles.buttonContainer}>
          <Button title="Calibrate Accelerometer" onPress={startCalibration} disabled={calibrating} />
            <Button title="Start Accelerometer" onPress={() => startAccelerometer(connectedDevice.id)} />
            <Button title="Stop Accelerometer" onPress={() => stopAccelerometer(connectedDevice.id)} />
            <Button
              title="Disconnect"
              onPress={() => disconnectFromDevice(connectedDevice.id)}
            />
          </View>
        </View>
      )}
      {accelerometerData.length > 0 && (
      <LineChart
        data={{
          labels: [...Array(accelerometerData.length).keys()].map(String),
          datasets: [
            {
              data: accelerometerData.map(data => data.x),
              color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // X-axis data in red
            },
            {
              data: accelerometerData.map(data => data.y),
              color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`, // Y-axis data in green
            },
            {
              data: accelerometerData.map(data => data.z),
              color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // Z-axis data in blue
            },
          ],
        }}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      )}
      {highAccelerationData.length > 0 && (
      <FlatList
        data={highAccelerationData}
        renderItem={({ item, index }) => (
        <View style={styles.highAccItem}>
        <Text>{index + 1}.Injury Track</Text>
        <Text>X: {item.x.toFixed(2)}</Text>
        <Text>Y: {item.y.toFixed(2)}</Text>
        <Text>Z: {item.z.toFixed(2)}</Text>
        </View>
      )}
      keyExtractor={(item, index) => index.toString()}
      style={styles.highAccList}
      />
    )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  deviceList: {
    marginBottom: 20,
  },
  deviceItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 5,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 14,
    color: '#888',
  },
  connectedDevice: {
    fontSize: 16,
    marginBottom: 10,
  },
  highAccItem: {
    padding: 10,
    backgroundColor: '#e8e8e8',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 5,
    borderRadius: 5,
  },
  highAccList: {
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default BluetoothDevicesScreen;