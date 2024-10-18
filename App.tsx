// App.tsx
import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BucketScreen from './screens/BucketScreen';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import HistoryScreen from './screens/history';
import SettingsScreen from './screens/Settings';
import BluetoothDevicesScreen from './screens/BluetoothDevicesScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import AutomaticScreen from './screens/AutomaticScreen';;
import SplashScreen from './screens/logoScreen'; // Import the splash screen component
import Chart from './screens/Chart';

const Stack = createStackNavigator();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <SplashScreen onAnimationEnd={() => setIsLoading(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
