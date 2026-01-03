import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

// Try to import BleManager - it won't be available in Expo Go
let BleManager = null;
try {
  const ble = require('react-native-ble-plx');
  BleManager = ble.BleManager;
} catch (err) {
  console.warn('⚠️ BLE not available - Expo Go has no native module support');
  BleManager = null;
}

const FALLBACK_BEACON_ID = '550e8400-e29b-41d4-a716-446655441111';
const BLE_SCAN_TIMEOUT = 15000;

/**
 * Extract UUID from iBeacon manufacturer data (base64)
 * iBeacon format: Company ID (2) + Type (1) + Length (1) + UUID (16) + Major (2) + Minor (2) + TxPower (1)
 */
function extractUUIDFromManufacturerData(manufacturerDataBase64) {
  if (!manufacturerDataBase64) return null;
  
  try {
    // Decode base64 to binary
    const binaryString = atob ? atob(manufacturerDataBase64) : Buffer.from(manufacturerDataBase64, 'base64').toString('binary');
    
    // iBeacon UUID starts at byte 4 and is 16 bytes
    if (binaryString.length < 20) return null;
    
    // Extract UUID bytes (indices 4-19)
    const uuidBytes = [];
    for (let i = 4; i < 20; i++) {
      uuidBytes.push(binaryString.charCodeAt(i).toString(16).padStart(2, '0'));
    }
    
    // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuid = [
      uuidBytes.slice(0, 4).join(''),
      uuidBytes.slice(4, 6).join(''),
      uuidBytes.slice(6, 8).join(''),
      uuidBytes.slice(8, 10).join(''),
      uuidBytes.slice(10, 16).join(''),
    ].join('-');
    
    console.log('✅ Extracted iBeacon UUID from manufacturer data:', uuid);
    return uuid;
  } catch (err) {
    console.error('Error extracting UUID from manufacturer data:', err);
    return null;
  }
}

/**
 * BLE Beacon Detection Hook
 * 
 * ⚠️ IMPORTANT: BLE requires NATIVE MODULES
 * Works in:
 * - EAS builds (expo build)
 * - Native builds
 * - Custom Expo dev clients
 * 
 * Does NOT work in:
 * - Expo Go (no native module support)
 * - Managed Expo (web)
 * 
 * Falls back to manual beacon selection when unavailable.
 */
export const useBLE = () => {
  const [nearestBeacon, setNearestBeacon] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const bleManagerRef = useRef(null);
  const scanSubscriptionRef = useRef(null);

  // Initialize BLE Manager - only works with native modules
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('ℹ️ BLE not available on web');
      return;
    }

    if (!BleManager) {
      console.log('ℹ️ BLE not available on this device/build');
      console.log('💡 BLE only works in: EAS builds, native builds, or custom dev clients');
      console.log('💡 To build: expo build --platform android');
      return;
    }

    if (!bleManagerRef.current) {
      try {
        console.log('🔄 Initializing BleManager...');
        bleManagerRef.current = new BleManager();
        console.log('✅ BleManager initialized successfully');
      } catch (err) {
        console.warn('⚠️ BleManager failed:', err.message);
        console.log('ℹ️ Using manual beacon selection as fallback');
        bleManagerRef.current = null;
      }
    }

    return () => {
      if (scanSubscriptionRef.current) {
        try {
          scanSubscriptionRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  /**
   * Check and request BLE permissions for Android 12+
   */
  const checkAndRequestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const apiLevel = parseInt(Platform.Version.toString(), 10);
      console.log('Android API Level:', apiLevel);

      if (apiLevel >= 31) {
        // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        const results = await PermissionsAndroid.requestMultiple(permissions);
        console.log('Permission results:', results);

        const allGranted = Object.values(results).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.error('Some permissions were denied');
          setError('BLE permissions denied');
          return false;
        }

        return true;
      } else if (apiLevel >= 23) {
        // Android 6-11 requires only location permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return true;
    } catch (err) {
      console.error('Permission check error:', err);
      setError(`Permission error: ${err.message}`);
      return false;
    }
  }, []);

  /**
   * Start BLE scanning with proper error handling
   * Returns a promise that resolves with the detected beacon
   * Gracefully falls back to manual selection if BLE unavailable
   */
  const startBLEScan = useCallback(
    (timeout = BLE_SCAN_TIMEOUT) => {
      return new Promise(async (resolve) => {
        if (isScanning) {
          console.warn('⚠️ Scan already in progress');
          resolve({ id: FALLBACK_BEACON_ID, name: 'Fallback', source: 'fallback' });
          return;
        }

        setIsScanning(true);
        setError(null);
        setNearestBeacon(null);

        try {
          if (Platform.OS === 'web') {
            console.log('ℹ️ BLE not supported on web, using fallback');
            const beacon = { id: FALLBACK_BEACON_ID, name: 'Fallback Beacon (Web)', source: 'fallback' };
            setNearestBeacon(beacon);
            setIsScanning(false);
            resolve(beacon);
            return;
          }

          const manager = bleManagerRef.current;
          if (!manager) {
            console.log('ℹ️ BLE not available on this device, using fallback');
            const beacon = { id: FALLBACK_BEACON_ID, name: 'Campus Beacon (Manual Selection)', source: 'fallback' };
            setNearestBeacon(beacon);
            setIsScanning(false);
            resolve(beacon);
            return;
          }

          const permissionsOK = await checkAndRequestPermissions();
          if (!permissionsOK) {
            console.warn('⚠️ BLE permissions denied, using fallback');
            const beacon = { id: FALLBACK_BEACON_ID, name: 'Campus Beacon (Permissions denied)', source: 'fallback' };
            setNearestBeacon(beacon);
            setIsScanning(false);
            resolve(beacon);
            return;
          }

          const state = await manager.state();
          console.log('📡 Bluetooth state:', state);

          if (state !== 'PoweredOn') {
            console.warn('⚠️ Bluetooth is not enabled, using fallback');
            setError('Bluetooth is not enabled');
            const beacon = { id: FALLBACK_BEACON_ID, name: 'Campus Beacon (Bluetooth disabled)', source: 'fallback' };
            setNearestBeacon(beacon);
            setIsScanning(false);
            resolve(beacon);
            return;
          }

          console.log('🔍 Starting BLE scan with timeout:', timeout);
          let deviceCount = 0;
          let beaconCount = 0;
          let detectionResolved = false;

          const scanTimeout = setTimeout(() => {
            if (detectionResolved) return;
            detectionResolved = true;
            
            console.log(`⏱️ Scan timeout reached - found ${deviceCount} devices, ${beaconCount} beacons`);
            try {
              manager.stopDeviceScan();
            } catch (e) {}
            console.log('⚠️ No beacon detected, using fallback beacon');
            const beacon = { id: FALLBACK_BEACON_ID, name: 'Campus Beacon (Fallback)', source: 'fallback' };
            setNearestBeacon(beacon);
            setIsScanning(false);
            resolve(beacon);
          }, timeout);

          scanSubscriptionRef.current = manager.startDeviceScan(
            null,
            { allowDuplicates: true, scanMode: 1, matchMode: 2 },
            (error, device) => {
              if (error) {
                if (detectionResolved) return;
                detectionResolved = true;
                console.error('❌ Scan error:', error);
                clearTimeout(scanTimeout);
                setError(`Scan error: ${error.message}`);
                const beacon = { id: FALLBACK_BEACON_ID, name: 'Campus Beacon (Fallback - Scan error)', source: 'fallback' };
                setNearestBeacon(beacon);
                setIsScanning(false);
                resolve(beacon);
                return;
              }

              if (!device) return;

              deviceCount++;
              console.log(`📱 Device #${deviceCount}: ${device.id}`, {
                name: device.name || 'null',
                localName: device.localName || 'null',
                rssi: device.rssi || 'null',
                isConnectable: device.isConnectable,
                manufacturerData: device.manufacturerData,
                serviceData: device.serviceData,
                serviceUUIDs: device.serviceUUIDs,
              });
              console.log('Full device object:', JSON.stringify(device, null, 2));

              const hasExcellentSignal = device.rssi && device.rssi > -60;
              const hasGoodSignal = device.rssi && device.rssi > -80;
              const hasAnySignal = device.rssi && device.rssi > -100;
              
              const hasBeaconName = 
                (device.name && device.name.toLowerCase().includes('beacon')) ||
                (device.localName && device.localName.toLowerCase().includes('beacon'));
              
              const hasBeaconId = 
                (device.name && device.name.toLowerCase().includes('esp')) ||
                (device.name && device.name.toLowerCase().includes('nrf')) ||
                (device.name && device.name.toLowerCase().includes('ibeacon')) ||
                (device.localName && device.localName.toLowerCase().includes('esp')) ||
                (device.localName && device.localName.toLowerCase().includes('nrf')) ||
                (device.localName && device.localName.toLowerCase().includes('ibeacon'));
              
              const isConnectable = device.isConnectable === true || device.isConnectable === undefined;
              const isBeacon = isConnectable && (hasBeaconName || hasBeaconId || hasAnySignal);

              if (isBeacon) {
                if (detectionResolved) return;
                detectionResolved = true;
                
                beaconCount++;
                console.log(`✅ BEACON DETECTED (#${beaconCount}):`, {
                  id: device.id,
                  name: device.name || device.localName || 'Unknown',
                  rssi: device.rssi,
                  isConnectable,
                  conditions: { hasBeaconName, hasBeaconId, hasExcellentSignal, hasGoodSignal, hasAnySignal },
                });

                clearTimeout(scanTimeout);
                try {
                  manager.stopDeviceScan();
                } catch (e) {}

                // Try to extract real beacon UUID from manufacturer data, fallback to hardcoded UUID
                const extractedUUID = extractUUIDFromManufacturerData(device.manufacturerData);
                const beaconUUID = extractedUUID || FALLBACK_BEACON_ID;

                const beacon = {
                  id: beaconUUID,
                  name: device.name || device.localName || 'BLE Device',
                  rssi: device.rssi,
                  localName: device.localName,
                  source: 'ble',
                };
                
                console.log('✅ Resolving with BLE beacon:', beacon);
                setNearestBeacon(beacon);
                setIsScanning(false);
                resolve(beacon);
              }
            }
          );
        } catch (err) {
          console.error('❌ BLE scan failed:', err);
          setError(err.message);
          const beacon = { id: FALLBACK_BEACON_ID, name: 'Campus Beacon (Fallback)', source: 'fallback' };
          setNearestBeacon(beacon);
          setIsScanning(false);
          try {
            bleManagerRef.current?.stopDeviceScan();
          } catch (e) {}
          resolve(beacon);
        }
      });
    },
    [isScanning, checkAndRequestPermissions]
  );

  const stopBLEScan = useCallback(() => {
    try {
      bleManagerRef.current?.stopDeviceScan();
      if (scanSubscriptionRef.current) {
        scanSubscriptionRef.current.remove();
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scan:', err);
    }
  }, []);

  return {
    nearestBeacon,
    isScanning,
    error,
    startBLEScan,
    stopBLEScan,
    fallbackBeaconId: FALLBACK_BEACON_ID,
  };
};

export default useBLE;
