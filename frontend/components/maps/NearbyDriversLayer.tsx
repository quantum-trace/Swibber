import React from 'react';
import { DriverMarker } from './DriverMarker';
import type { NearbyDriver } from '../../hooks/useNearbyDrivers';
import type { VehicleType } from '../../constants/enums';

interface NearbyDriversLayerProps {
  drivers: NearbyDriver[];
  onDriverPress?: (driver: NearbyDriver) => void;
}

export const NearbyDriversLayer = React.memo(function NearbyDriversLayer({
  drivers,
  onDriverPress,
}: NearbyDriversLayerProps) {
  return (
    <>
      {drivers.map((driver) => (
        <DriverMarker
          key={driver.driverId}
          driverId={driver.driverId}
          lat={driver.lat}
          lng={driver.lng}
          heading={driver.heading}
          vehicleType={driver.vehicleType as VehicleType}
          isActive={false}
          onPress={() => onDriverPress?.(driver)}
        />
      ))}
    </>
  );
});
