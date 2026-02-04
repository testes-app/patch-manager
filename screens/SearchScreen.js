import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allPorts, setAllPorts] = useState([]);
  const [filteredPorts, setFilteredPorts] = useState([]);
  const [panels, setPanels] = useState([
    { id: 'casa10', name: 'Casa 10' },
    { id: 'casa11', name: 'Casa 11' }
  ]);

  useEffect(() => {
    loadAllPorts();
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

  useEffect(() => {
    filterPorts();
  }, [searchQuery, allPorts]);

  const loadAllPorts = async () => {
    try {
      const storedRooms = await AsyncStorage.getItem('rooms');
      if (storedRooms) {
        const rooms = JSON.parse(storedRooms);
        const ports = [];
        rooms.forEach(room => {
          if (room.ports) {
            room.ports.forEach(port => {
              ports.push({ ...port, roomName: room.name, roomId: room.id });
            });
          }
        });
        setAllPorts(ports);
      }
    } catch (error) {
      console.error('Erro ao carregar portas:', error);
    }
  };

  const filterPorts = () => {
    if (!searchQuery.trim()) {
      setFilteredPorts([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const filtered = allPorts.filter(port =>
      port.number.toLowerCase().includes(query) ||
      port.roomName.toLowerCase().includes(query) ||
      (port.observation && port.observation.toLowerCase().includes(query))
    );
    setFilteredPorts(filtered);
  };

  const renderPort = ({ item }) => {
    const panel = panels.find(p => p.id === item.panelId) || panels[0];
    return (
      <View style={styles.resultCard}>
        <View style={styles.portHeader}>
          <View style={styles.portNumberContainer}>
            <Ionicons name="git-network" size={24} color="#2196F3" />
            <View>
              <Text style={styles.portNumber}>{item.number}</Text>
              <Text style={styles.panelName}>{panel.name}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.active ? '#4CAF50' : '#999' }]}>
            <Text style={styles.statusText}>{item.active ? 'Ativa' : 'Inativa'}</Text>
          </View>
        </View>
        <View style={styles.roomInfo}>
          <Ionicons name="business" size={16} color="#666" />
          <Text style={styles.roomName}>{item.roomName}</Text>
        </View>
        {item.observation ? <Text style={styles.observation}>{item.observation}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput style={styles.searchInput} placeholder="Porta, sala ou painel..." value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="characters" autoFocus />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {!searchQuery.trim() ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Digite para buscar</Text>
          <Text style={styles.emptySubtext}>Procure por número de porta ou nome da sala</Text>
        </View>
      ) : filteredPorts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
          <Text style={styles.emptySubtext}>Tente buscar por outro termo</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPorts.sort((a, b) => a.number.localeCompare(b.number))}
          renderItem={renderPort}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchSection: { backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  listContainer: { padding: 16 },
  resultCard: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 },
  portHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  portNumberContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  portNumber: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  panelName: { fontSize: 12, color: '#2196F3', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  roomInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  roomName: { fontSize: 16, color: '#666', fontWeight: '500' },
  observation: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, color: '#999', marginTop: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center' },
});