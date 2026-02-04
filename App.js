import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import AddRoomScreen from './screens/AddRoomScreen';
import RoomDetailScreen from './screens/RoomDetailScreen';
import SearchScreen from './screens/SearchScreen';
import PatchPanelScreen from './screens/PatchPanelScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Patch Panel Manager' }} />
        <Stack.Screen name="AddRoom" component={AddRoomScreen} options={{ title: 'Adicionar Sala' }} />
        <Stack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ title: 'Detalhes da Sala' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Buscar Porta' }} />
        <Stack.Screen name="PatchPanel" component={PatchPanelScreen} options={{ title: 'Patch Panel Virtual' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}