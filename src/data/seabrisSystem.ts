/**
 * SEABRIS Fixed Specifications & Telemetry Calculations
 * Fixed Standard: 50.0 L Capacity, 25.0 kg Max Weight, 0.0 - 25.0 cm Ultrasonic Depth Calibration
 */

export const SEABRIS_FIXED_SPECS = {
  FIXED_BIN_DEPTH_CM: 25.0,
  ULTRASONIC_MIN_CM: 0.0,
  ULTRASONIC_MAX_CM: 25.0,
  BIN_CAPACITY_LITERS: 50.0,
  MAX_WEIGHT_KG: 25.0,
  SOLAR_PV_WATT: 20.0,
  BATTERY_VOLTAGE_NOMINAL: 12.8,
  BATTERY_CAPACITY_AH: 18.0,
  MICROCONTROLLER: 'ESP32-WROOM-32D',
  ULTRASONIC_SENSOR: 'JSN-SR04T Waterproof Ultrasonic Transducer',
  LOAD_CELL_AMPLIFIER: 'HX711 24-Bit ADC',
  GPS_MODULE: 'u-blox NEO-6M',
};

export interface FixedBinTelemetry {
  clampedUltrasonicCm: number;
  fillPercentage: number;
  estimatedVolumeLiters: number;
  measuredWeightKg: number;
  statusLevel: 'NORMAL' | 'WARNING' | 'CRITICAL_FULL';
}

export function computeFixedBinTelemetry(
  ultrasonicDistanceCm: number,
  measuredWeightKg: number = 0
): FixedBinTelemetry {
  const clampedUltrasonicCm = Math.max(
    SEABRIS_FIXED_SPECS.ULTRASONIC_MIN_CM,
    Math.min(SEABRIS_FIXED_SPECS.ULTRASONIC_MAX_CM, Number(ultrasonicDistanceCm) || 0)
  );

  const fillRatio =
    (SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM - clampedUltrasonicCm) /
    SEABRIS_FIXED_SPECS.FIXED_BIN_DEPTH_CM;

  const fillPercentage = Math.max(0, Math.min(100, fillRatio * 100));
  const estimatedVolumeLiters = (fillPercentage / 100) * SEABRIS_FIXED_SPECS.BIN_CAPACITY_LITERS;

  let statusLevel: 'NORMAL' | 'WARNING' | 'CRITICAL_FULL' = 'NORMAL';
  if (fillPercentage >= 90) {
    statusLevel = 'CRITICAL_FULL';
  } else if (fillPercentage >= 75) {
    statusLevel = 'WARNING';
  }

  return {
    clampedUltrasonicCm,
    fillPercentage,
    estimatedVolumeLiters,
    measuredWeightKg: Number(measuredWeightKg) || 0,
    statusLevel,
  };
}
