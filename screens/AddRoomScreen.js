import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddRoomScreen({ navigation }) {
  const [roomName, setRoomName] = useState('');
  const [selectedPanelId, setSelectedPanelId] = useState('casa10');
  const [panels, setPanels] = useState([
    { id: 'casa10', name: 'Casa 10' },
    { id: 'casa11', name: 'Casa 11' }
  ]);

  React.useEffect(() => {
    loadPanels();
  }, []);

  const loadPanels = async () => {
    try {
      const savedPanels = await AsyncStorage.getItem('patchPanels');
      if (savedPanels) setPanels(JSON.parse(savedPanels));
    } catch (error) {
      console.error('Erro ao carregar painéis:', error);
    }
  };

  const saveRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Atenção', 'Por favor, digite o nome da sala');
      return;
    }

    try {
      const storedRooms = await AsyncStorage.getItem('rooms');
      const rooms = storedRooms ? JSON.parse(storedRooms) : [];

      const newRoom = {
        id: Date.now().toString(),
        name: roomName.trim(),
        defaultPanelId: selectedPanelId,
        ports: [],
        createdAt: new Date().toISOString(),
      };

      rooms.push(newRoom);
      await AsyncStorage.setItem('rooms', JSON.stringify(rooms));

      Alert.alert('Sucesso', 'Sala cadastrada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Erro ao salvar sala:', error);
      Alert.alert('Erro', 'Não foi possível salvar a sala');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Nome da Sala</Text>
        <TextInput style={styles.input} placeholder="Ex: Financeiro, TI, Recepção..." value={roomName} onChangeText={setRoomName} autoFocus />

        <Text style={[styles.label, { marginTop: 20 }]}>Painel Principal</Text>
        <View style={styles.panelSelector}>
          {panels.map(panel => (
            <TouchableOpacity
              key={panel.id}
              style={[styles.panelOption, selectedPanelId === panel.id && styles.activePanelOption]}
              onPress={() => setSelectedPanelId(panel.id)}
            >
              <Text style={[styles.panelOptionText, selectedPanelId === panel.id && styles.activePanelOptionText]}>
                {panel.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={saveRoom}>
          <Text style={styles.buttonText}>Salvar Sala</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { backgroundColor: 'white', borderRadius: 8, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#2196F3', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  panelSelector: { flexDirection: 'row', gap: 8, marginTop: 8 },
  panelOption: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'white', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  activePanelOption: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
  panelOptionText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activePanelOptionText: { color: '#2196F3' },
});