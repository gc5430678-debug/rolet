import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Register from './app/_layout.tsx';
import Rolet from './app/Rolet.jsx';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="_layout">
        <Stack.Screen
          name="_layout"
          component={Register}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Rolet"
          component={Rolet}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
