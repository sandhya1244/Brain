import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text, View, Alert } from 'react-native';
import HistoryScreen from './screens/history';
import DetailsScreen from './screens/DetailsScreen';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/Settings';
import SplashScreen from './screens/logoScreen';

const Stack = createStackNavigator();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <SplashScreen onAnimationEnd={() => setIsLoading(false)} />;
  }

  // Custom header component with back button and hamburger icon
  const renderHeader = (navigation: any, onExportPDF: () => void) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ fontSize: 33, fontWeight: 'bold', color: '#000'}}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>History</Text>
      <TouchableOpacity onPress={onExportPDF}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#000'}}>☰</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{ headerShown: true }}>
        <Stack.Screen 
          name="History" 
          options={({ navigation }) => ({
            header: () => renderHeader(navigation, () => {
              Alert.alert(
                "Export Options",
                "Do you want to export to PDF?",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Download",
                    onPress: () => {
                      navigation.navigate('History', { callExport: true }); // Pass to HistoryScreen
                    },
                  },
                ]
              );
            }),
          })}>
          {(props) => <HistoryScreen {...props} />} 
        </Stack.Screen>
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen} 
          options={{ headerTitle: "Details" }} 
        />
        <Stack.Screen 
          name="HomeScreen" 
          component={HomeScreen} 
          options={{ headerTitle: "Home" }} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ headerTitle: "Settings" }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
