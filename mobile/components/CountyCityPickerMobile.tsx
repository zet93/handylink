import { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal,
  SafeAreaView, StyleSheet,
} from 'react-native';
import nomenclator from '../assets/ro-nomenclator.json';
import { palette } from '../app/constants/design';

type Props = {
  county: string;
  countyLabel: string;
  city: string;
  onCountyChange: (id: string, name: string) => void;
  onCityChange: (name: string) => void;
};

export default function CountyCityPickerMobile({
  county, countyLabel, city, onCountyChange, onCityChange,
}: Props) {
  const [countyModalVisible, setCountyModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const cities = county
    ? nomenclator.cities.filter(c => c.county_id === county)
    : [];

  return (
    <>
      <Text style={styles.label}>Județ</Text>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setCountyModalVisible(true)}
      >
        <Text style={[styles.triggerText, !countyLabel && styles.placeholder]}>
          {countyLabel || 'Selectează județul…'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Oraș / Comună</Text>
      <TouchableOpacity
        style={[styles.trigger, !county && styles.triggerDisabled]}
        disabled={!county}
        onPress={() => setCityModalVisible(true)}
      >
        <Text style={[styles.triggerText, !city && styles.placeholder]}>
          {city || (county ? 'Selectează orașul…' : 'Selectează județul întâi')}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={countyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCountyModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selectează județul</Text>
            <TouchableOpacity onPress={() => setCountyModalVisible(false)}>
              <Text style={styles.cancelText}>Anulează</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={nomenclator.counties}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, item.id === county && styles.listItemSelected]}
                onPress={() => {
                  onCountyChange(item.id, item.name);
                  setCountyModalVisible(false);
                }}
              >
                <Text style={[styles.listItemText, item.id === county && styles.listItemTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={cityModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selectează orașul</Text>
            <TouchableOpacity onPress={() => setCityModalVisible(false)}>
              <Text style={styles.cancelText}>Anulează</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={cities}
            keyExtractor={item => item.id}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={5}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, item.name === city && styles.listItemSelected]}
                onPress={() => {
                  onCityChange(item.name);
                  setCityModalVisible(false);
                }}
              >
                <Text style={[styles.listItemText, item.name === city && styles.listItemTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 4,
  },
  trigger: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: palette.panel,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    fontSize: 15,
    color: palette.text,
  },
  placeholder: {
    color: palette.muted,
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.text,
  },
  cancelText: {
    fontSize: 16,
    color: palette.accent,
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  listItemText: {
    fontSize: 16,
    color: palette.text,
  },
  listItemTextSelected: {
    color: palette.accent,
    fontWeight: '600',
  },
});
