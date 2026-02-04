import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function RoomDetailScreen({ route, navigation }) {
  const { room } = route.params;
  const [ports, setPorts] = useState(room.ports || []);
  const [newPort, setNewPort] = useState(route.params?.initialPortNumber || '');
  const [observation, setObservation] = useState('');
  const [selectedPanelId, setSelectedPanelId] = useState(route.params?.initialPanelId || room.defaultPanelId || 'casa10');
  const [panels, setPanels] = useState([
    { id: 'casa10', name: 'Casa 10' },
    { id: 'casa11', name: 'Casa 11' }
  ]);

  useEffect(() => {
    navigation.setOptions({ title: room.name });
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

  const addPort = async () => {
    if (!newPort.trim()) {
      Alert.alert('Atenção', 'Digite o número da porta');
      return;
    }

    if (ports.some(p => p.number.toLowerCase() === newPort.trim().toLowerCase() && p.panelId === selectedPanelId)) {
      Alert.alert('Atenção', 'Esta porta já foi cadastrada nesta sala para este painel');
      return;
    }

    try {
      const port = {
        id: Date.now().toString(),
        number: newPort.trim().toUpperCase(),
        observation: observation.trim(),
        active: true,
        panelId: selectedPanelId,
        createdAt: new Date().toISOString(),
      };

      const updatedPorts = [...ports, port];
      await saveRoomPorts(updatedPorts);
      setPorts(updatedPorts);
      setNewPort('');
      setObservation('');
    } catch (error) {
      console.error('Erro ao adicionar porta:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a porta');
    }
  };

  const deletePort = async (portId) => {
    Alert.alert('Confirmar Exclusão', 'Tem certeza que deseja excluir esta porta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedPorts = ports.filter(p => p.id !== portId);
            await saveRoomPorts(updatedPorts);
            setPorts(updatedPorts);
          } catch (error) {
            console.error('Erro ao excluir porta:', error);
          }
        },
      },
    ]);
  };

  const togglePortStatus = async (portId) => {
    try {
      const updatedPorts = ports.map(p => p.id === portId ? { ...p, active: !p.active } : p);
      await saveRoomPorts(updatedPorts);
      setPorts(updatedPorts);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const saveRoomPorts = async (updatedPorts) => {
    try {
      const storedRooms = await AsyncStorage.getItem('rooms');
      const rooms = storedRooms ? JSON.parse(storedRooms) : [];
      const updatedRooms = rooms.map(r => r.id === room.id ? { ...r, ports: updatedPorts } : r);
      await AsyncStorage.setItem('rooms', JSON.stringify(updatedRooms));
    } catch (error) {
      throw error;
    }
  };

  const renderPort = ({ item }) => {
    const panel = panels.find(p => p.id === item.panelId) || panels[0];
    return (
      <View style={styles.portCard}>
        <View style={styles.portHeader}>
          <View style={styles.portInfo}>
            <View style={styles.portBadgeRow}>
              <Text style={styles.portNumber}>{item.number}</Text>
              <View style={styles.panelBadge}>
                <Text style={styles.panelBadgeText}>{panel.name}</Text>
              </View>
            </View>
            {item.observation ? <Text style={styles.portObservation}>{item.observation}</Text> : null}
          </View>
          <View style={styles.portActions}>
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: item.active ? '#4CAF50' : '#999' }]}
              onPress={() => togglePortStatus(item.id)}
            >
              <Text style={styles.statusText}>{item.active ? 'Ativa' : 'Inativa'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteIcon} onPress={() => deletePort(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.addPortSection}>
        <Text style={styles.sectionTitle}>Selecionar Painel</Text>
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

        <Text style={styles.sectionTitle}>Adicionar Nova Porta</Text>
        <TextInput style={styles.input} placeholder="Ex: A1, B12, C5..." value={newPort} onChangeText={setNewPort} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Observação (opcional)" value={observation} onChangeText={setObservation} />
        <TouchableOpacity style={styles.addButton} onPress={addPort}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Adicionar Porta</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Portas Cadastradas ({ports.length})</Text>
        {ports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="git-network-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma porta cadastrada</Text>
          </View>
        ) : (
          <FlatList
            data={ports.sort((a, b) => a.panelId.localeCompare(b.panelId) || a.number.localeCompare(b.number))}
            renderItem={renderPort}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  addPortSection: { backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#666', marginTop: 8 },
  panelSelector: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  panelOption: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  activePanelOption: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
  panelOptionText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activePanelOptionText: { color: '#2196F3' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  addButton: { backgroundColor: '#2196F3', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  listSection: { flex: 1, padding: 16 },
  listContainer: { paddingBottom: 16 },
  portCard: { backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  portHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  portInfo: { flex: 1 },
  portBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  portNumber: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },
  panelBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  panelBadgeText: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  portObservation: { fontSize: 14, color: '#666', marginTop: 4 },
  portActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  deleteIcon: { padding: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});