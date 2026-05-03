import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { palette } from '../app/constants/design';

type Props = {
  latitude: number;
  longitude: number;
  address?: string | null;
};

export default function JobMapMobile({ latitude, longitude, address }: Props) {
  return (
    <View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
      {address && <Text style={styles.address}>{address}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 250,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  address: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 4,
  },
});
