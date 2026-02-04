import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_PANELS = [
  { id: 'casa10', name: 'Casa 10', rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], columns: 24 },
  { id: 'casa11', name: 'Casa 11', rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], columns: 24 },
];

export default function PatchPanelScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [panels, setPanels] = useState(DEFAULT_PANELS);
  const [activePanelId, setActivePanelId] = useState('casa10');
  const [selectedPort, setSelectedPort] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Config state
  const [tempRows, setTempRows] = useState('');
  const [tempCols, setTempCols] = useState('');
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    loadRooms();
    loadPanels();
    const unsubscribe = navigation.addListener('focus', () => loadRooms());
    return unsubscribe;
  }, [navigation]);

  const activePanel = panels.find(p => p.id === activePanelId) || panels[0];

  const loadPanels = async () => {
    try {
      const savedPanels = await AsyncStorage.getItem('patchPanels');
      if (savedPanels) {
        setPanels(JSON.parse(savedPanels));
      }
    } catch (error) {
      console.error('Erro ao carregar painéis:', error);
    }
  };

  const savePanels = async (updatedPanels) => {
    try {
      await AsyncStorage.setItem('patchPanels', JSON.stringify(updatedPanels));
      setPanels(updatedPanels);
    } catch (error) {
      console.error('Erro ao salvar painéis:', error);
    }
  };

  const handleOpenConfig = () => {
    setTempName(activePanel.name);
    setTempRows(activePanel.rows.length.toString());
    setTempCols(activePanel.columns.toString());
    setShowConfig(true);
  };

  const saveConfig = async () => {
    try {
      const numRows = parseInt(tempRows) || 8;
      const numCols = parseInt(tempCols) || 24;

      if (numRows < 1 || numRows > 26) {
        Alert.alert('Atenção', 'Número de linhas deve ser entre 1 e 26');
        return;
      }
      if (numCols < 1 || numCols > 48) {
        Alert.alert('Atenção', 'Número de colunas deve ser entre 1 e 48');
        return;
      }

      const newRows = Array.from({ length: numRows }, (_, i) => String.fromCharCode(65 + i));
      const updatedPanels = panels.map(p =>
        p.id === activePanelId
          ? { ...p, name: tempName, rows: newRows, columns: numCols }
          : p
      );

      await savePanels(updatedPanels);
      setShowConfig(false);
      Alert.alert('Sucesso', 'Configuração salva!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
    }
  };

  const loadRooms = async () => {
    try {
      const storedRooms = await AsyncStorage.getItem('rooms');
      if (storedRooms) setRooms(JSON.parse(storedRooms));
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  const getPortInfo = (portNumber) => {
    for (let room of rooms) {
      if (room.ports) {
        const port = room.ports.find(p =>
          p.number === portNumber &&
          (p.panelId === activePanelId || (!p.panelId && activePanelId === 'casa10'))
        );
        if (port) {
          return { ...port, roomName: room.name, roomId: room.id };
        }
      }
    }
    return null;
  };

  const getPortColor = (portNumber) => {
    const portInfo = getPortInfo(portNumber);
    if (!portInfo) return '#E0E0E0'; // Cinza - sem sala
    if (!portInfo.active) return '#f44336'; // Vermelho - inativa

    // Cores diferentes por sala
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFC107', '#E91E63', '#3F51B5'];
    const roomIndex = rooms.findIndex(r => r.id === portInfo.roomId);
    return colors[roomIndex % colors.length];
  };

  const handlePortPress = (portNumber) => {
    const portInfo = getPortInfo(portNumber);
    setSelectedPort({ portNumber, portInfo });
  };

  const navigateToRoom = () => {
    if (selectedPort?.portInfo) {
      const room = rooms.find(r => r.id === selectedPort.portInfo.roomId);
      if (room) {
        setSelectedPort(null);
        navigation.navigate('RoomDetail', { room, initialPanelId: activePanelId });
      }
    }
  };

  const associatePort = () => {
    if (rooms.length === 0) {
      Alert.alert('Aviso', 'Cadastre uma sala primeiro', [
        { text: 'Ir para Cadastro', onPress: () => navigation.navigate('AddRoom') }
      ]);
      return;
    }

    // Mostra um seletor de sala simples para associar a porta
    Alert.alert(
      'Associar Porta',
      `Para qual sala deseja associar a porta ${selectedPort.portNumber}?`,
      rooms.map(room => ({
        text: room.name,
        onPress: () => {
          navigation.navigate('RoomDetail', {
            room,
            initialPanelId: activePanelId,
            initialPortNumber: selectedPort.portNumber
          });
          setSelectedPort(null);
        }
      })).concat([{ text: 'Cancelar', style: 'cancel' }])
    );
  };

  const renderPort = (row, col) => {
    const portNumber = `${row}${col}`;
    const color = getPortColor(portNumber);
    const portInfo = getPortInfo(portNumber);
    const portSize = 40 * zoom;

    return (
      <TouchableOpacity
        key={portNumber}
        style={[styles.port, {
          backgroundColor: color,
          width: portSize,
          height: portSize,
          borderRadius: 6 * zoom,
        }]}
        onPress={() => handlePortPress(portNumber)}
        activeOpacity={0.7}
      >
        <Text style={[styles.portText, { fontSize: 11 * zoom }]}>{portNumber}</Text>
        {portInfo && (
          <View style={[styles.portIndicator, {
            width: 6 * zoom,
            height: 6 * zoom,
            borderRadius: 3 * zoom,
          }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderColumnHeaders = () => {
    const headerSize = 30 * zoom;
    return (
      <View style={styles.columnHeaderRow}>
        <View style={[styles.cornerCell, { width: headerSize, height: headerSize }]} />
        {Array.from({ length: activePanel.columns }, (_, i) => i + 1).map(col => (
          <View key={col} style={[styles.columnHeader, {
            width: 40 * zoom,
            height: headerSize,
          }]}>
            <Text style={[styles.columnHeaderText, { fontSize: 10 * zoom }]}>{col}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Panel Switcher */}
      <View style={styles.panelSwitcher}>
        {panels.map(panel => (
          <TouchableOpacity
            key={panel.id}
            style={[styles.panelTab, activePanelId === panel.id && styles.activePanelTab]}
            onPress={() => setActivePanelId(panel.id)}
          >
            <Text style={[styles.panelTabText, activePanelId === panel.id && styles.activePanelTabText]}>
              {panel.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location-outline" size={24} color="#2196F3" />
          <Text style={styles.title}>{activePanel.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleOpenConfig} style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#E0E0E0' }]} />
          <Text style={styles.legendText}>Livre</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Ativa</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#f44336' }]} />
          <Text style={styles.legendText}>Inativa</Text>
        </View>
      </View>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoom(Math.max(0.5, zoom - 0.25))}
          disabled={zoom <= 0.5}
        >
          <Ionicons name="remove" size={20} color={zoom <= 0.5 ? '#ccc' : '#2196F3'} />
        </TouchableOpacity>
        <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoom(Math.min(2, zoom + 0.25))}
          disabled={zoom >= 2}
        >
          <Ionicons name="add" size={20} color={zoom >= 2 ? '#ccc' : '#2196F3'} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scrollContainer}>
        <ScrollView showsVerticalScrollIndicator={true}>
          <View style={styles.panelContainer}>
            {renderColumnHeaders()}
            {activePanel.rows.map(row => (
              <View key={row} style={styles.row}>
                <View style={[styles.rowLabel, {
                  width: 30 * zoom,
                  height: 40 * zoom,
                }]}>
                  <Text style={[styles.rowLabelText, { fontSize: 14 * zoom }]}>{row}</Text>
                </View>
                {Array.from({ length: activePanel.columns }, (_, i) => i + 1).map(col => renderPort(row, col))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Modal de Detalhes da Porta */}
      <Modal visible={!!selectedPort} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="git-network" size={28} color="#2196F3" />
                <Text style={styles.modalTitle}>Porta {selectedPort?.portNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPort(null)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedPort?.portInfo ? (
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={20} color="#666" />
                  <Text style={styles.infoLabel}>Sala:</Text>
                  <Text style={styles.infoValue}>{selectedPort.portInfo.roomName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="radio-button-on" size={20} color={selectedPort.portInfo.active ? '#4CAF50' : '#f44336'} />
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: selectedPort.portInfo.active ? '#4CAF50' : '#f44336'
                  }]}>
                    <Text style={styles.statusText}>
                      {selectedPort.portInfo.active ? 'Ativa' : 'Inativa'}
                    </Text>
                  </View>
                </View>

                {selectedPort.portInfo.observation && (
                  <View style={styles.infoRow}>
                    <Ionicons name="information-circle" size={20} color="#666" />
                    <Text style={styles.infoLabel}>Observação:</Text>
                    <Text style={styles.infoValue}>{selectedPort.portInfo.observation}</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.navigateButton} onPress={navigateToRoom}>
                  <Ionicons name="arrow-forward-circle" size={20} color="white" />
                  <Text style={styles.navigateButtonText}>Ir para Sala</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <View style={styles.emptyPortContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyPortText}>Porta não associada</Text>
                  <Text style={styles.emptyPortSubtext}>
                    Esta porta ainda não está vinculada a nenhuma sala
                  </Text>

                  <TouchableOpacity style={[styles.navigateButton, { marginTop: 24, backgroundColor: '#4CAF50' }]} onPress={associatePort}>
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text style={styles.navigateButtonText}>Associar à uma Sala</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPort(null)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Config Modal */}
      <Modal visible={showConfig} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.configModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar {activePanel.name}</Text>
              <TouchableOpacity onPress={() => setShowConfig(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.configBody}>
              <Text style={styles.configLabel}>Nome do Painel:</Text>
              <TextInput style={styles.configInput} value={tempName} onChangeText={setTempName} placeholder="Ex: Casa 10" />

              <Text style={styles.configLabel}>Linhas (A-Z):</Text>
              <TextInput style={styles.configInput} value={tempRows} onChangeText={setTempRows} keyboardType="number-pad" />

              <Text style={styles.configLabel}>Colunas:</Text>
              <TextInput style={styles.configInput} value={tempCols} onChangeText={setTempCols} keyboardType="number-pad" />
            </View>

            <View style={styles.configButtons}>
              <TouchableOpacity style={[styles.configButton, styles.cancelButton]} onPress={() => setShowConfig(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.configButton, styles.saveButton]} onPress={saveConfig}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  panelSwitcher: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  panelTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activePanelTab: { borderBottomColor: '#2196F3' },
  panelTabText: { fontWeight: 'bold', color: '#999' },
  activePanelTabText: { color: '#2196F3' },
  header: { backgroundColor: 'white', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  legend: { backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: '#ccc' },
  legendText: { fontSize: 12, color: '#666' },
  zoomControls: { backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  zoomButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  zoomText: { fontSize: 14, fontWeight: '600', color: '#333', minWidth: 50, textAlign: 'center' },
  scrollContainer: { flex: 1 },
  panelContainer: { padding: 16, backgroundColor: '#fafafa' },
  columnHeaderRow: { flexDirection: 'row', marginBottom: 4 },
  columnHeader: { justifyContent: 'center', alignItems: 'center', marginHorizontal: 2 },
  columnHeaderText: { color: '#666', fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: 4, alignItems: 'center' },
  rowLabel: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 4, marginRight: 4 },
  rowLabelText: { fontWeight: 'bold', color: '#333' },
  port: { justifyContent: 'center', alignItems: 'center', marginHorizontal: 2, borderWidth: 1, borderColor: '#ccc', elevation: 1 },
  portText: { color: '#333', fontWeight: '600' },
  portIndicator: { position: 'absolute', top: 2, right: 2, backgroundColor: 'white', borderWidth: 1, borderColor: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 400, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalBody: { padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  infoLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  navigateButton: { backgroundColor: '#2196F3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 8, marginTop: 8, gap: 8 },
  navigateButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  emptyPortContainer: { alignItems: 'center', paddingVertical: 20 },
  emptyPortText: { fontSize: 16, fontWeight: '600', color: '#999', marginTop: 12 },
  emptyPortSubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center' },
  closeButton: { backgroundColor: '#f5f5f5', padding: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, alignItems: 'center' },
  closeButtonText: { fontSize: 16, color: '#666', fontWeight: '600' },
  configModal: { backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 400, elevation: 5 },
  configBody: { padding: 20 },
  configLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  configInput: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  configButtons: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  configButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f5f5f5' },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  saveButton: { backgroundColor: '#2196F3' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
