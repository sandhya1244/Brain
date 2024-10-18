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
  ImageBackground,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { LineChart } from 'react-native-chart-kit'; // Import LineChart
import { Buffer } from 'buffer';
import { throttle } from 'lodash';



  const  BluetoothDevicesScreen: React.FC = ({navigation}) => {
 
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<any | null>(null);
  const [notificationListener, setNotificationListener] = useState<any>(null);
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState<{ x: number; y: number; z: number }[]>([]);
  const [baseline, setBaseline] = useState<{ x: number; y: number; z: number } | null>(null);
  const [calibrating, setCalibrating] = useState(false); // Add state to track calibration status
  const [highAccelerationData, setHighAccelerationData] = useState<{ x: number; y: number; z: number }[]>([]);

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

      Alert.alert('Connection Successful', `Connected to ${device.name}`);
      navigation.navigate('Automatic', { connectedDevice: device });
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

  const renderDeviceItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.deviceItem} onPress={() => connectToDevice(item)}>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );


  return (
  <ImageBackground
   source={require('../assets/background_img.jpg')} // Add your image path here
    style={styles.backgroundImage} // Apply background image style
    >
    <View style={styles.container}>
      <Text style={styles.heading}>BLE Scanner</Text>
      <Button title="Scan Devices" onPress={startScan} />
      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.id}
        style={styles.deviceList}
      />
    </View>
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
  deviceList: {
    marginBottom: 20,
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'cover', // Optional: Adjust the image layout (contain, stretch, etc.)
  },
  deviceId: {
    fontSize: 14,
    color: '#888',
  },
});

export default BluetoothDevicesScreen;