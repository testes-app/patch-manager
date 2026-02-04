import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    loadRooms();
    const unsubscribe = navigation.addListener('focus', () => loadRooms());
    return unsubscribe;
  }, [navigation]);

  const loadRooms = async () => {
    try {
      const storedRooms = await AsyncStorage.getItem('rooms');
      if (storedRooms) setRooms(JSON.parse(storedRooms));
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  const deleteRoom = async (roomId) => {
    Alert.alert('Confirmar Exclusão', 'Tem certeza que deseja excluir esta sala?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedRooms = rooms.filter(room => room.id !== roomId);
            await AsyncStorage.setItem('rooms', JSON.stringify(updatedRooms));
            setRooms(updatedRooms);
          } catch (error) {
            console.error('Erro ao excluir sala:', error);
          }
        },
      },
    ]);
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => navigation.navigate('RoomDetail', { room: item })}>
      <View style={styles.roomHeader}>
        <Ionicons name="business" size={24} color="#2196F3" />
        <Text style={styles.roomName}>{item.name}</Text>
      </View>
      <Text style={styles.portCount}>{item.ports?.length || 0} porta(s)</Text>
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRoom(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#f44336" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {rooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma sala cadastrada</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        />
      )}

      {/* Botões flutuantes */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#4CAF50' }]} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#FF9800' }]} onPress={() => navigation.navigate('PatchPanel')}>
          <Ionicons name="grid" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#2196F3' }]} onPress={() => navigation.navigate('AddRoom')}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { padding: 16, paddingBottom: 90 },
  roomCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  roomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  roomName: { fontSize: 18, fontWeight: 'bold', marginLeft: 12, flex: 1, color: '#333' },
  portCount: { fontSize: 14, color: '#666' },
  deleteButton: { position: 'absolute', top: 16, right: 16, padding: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, color: '#999', marginTop: 16, fontWeight: '600' },

  // Botões flutuantes – corrigido
  bottomButtons: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 70 : 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});