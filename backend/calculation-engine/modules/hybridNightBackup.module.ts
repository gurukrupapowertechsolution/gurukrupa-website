/**
 * calculation-engine/modules/hybridNightBackup.module.ts
 *
 * MODULE A — Hybrid Backup Calculator (Night Time / No Sun hours)
 * Source: Document 3 §11, "Module A: Hybrid Backup Calculator (Night Time)".
 *
 * Formulas preserved EXACTLY as documented:
 *   Total Load        = Σ(Appliance Wattage × Quantity)
 *   Consumption (wh)  = Total Load × Hours
 *   Kwh conversion    = 1000w * h   (i.e. kwh = wh / 1000)
 *   Battery Capacity (wh) = (Voltage × Ah) × 0.9   [Battery Power Factor]
 *   Required Batteries = Total Consumption (kwh) / Battery Capacity (kwh)
 *
 * Worked example validated by this module (Doc 3 §11):
 *   AC(2200*1) + Fridge(600*1) + 4×Fan(70*4=280) + 4×Tube(22*4=88) = 3168W
 *   Running 3 hrs => 9504 wh => 9.504 kwh
 *   51.2V/100Ah battery => 5120W * 0.9 = 4608 wh = 4.608 kwh per battery
 *   Required batteries to cover 9.504 kwh => 2 (2 × 4.608 = 9.216 kwh)
 */

import { ApplianceId, APPLIANCE_WATTAGE } from "../../config/applianceConstants";
import { CALCULATION_CONSTANTS } from "../../config/calculationConstants";
import { BatteryTypeId } from "../../config/priceListConfig";

export interface HybridNightBackupInput {
  applications: { applianceId: ApplianceId; quantity: number }[];
  backupHoursNight: number;
  /** Voltage/Ah pair used for battery sizing (Doc 3 §11 references 51.2V/100Ah). */
  battery: { voltage: number; ah: number; typeId: BatteryTypeId };
}

export interface HybridNightBackupResult {
  totalConnectedLoadW: number;
  consumptionWh: number;
  totalConsumptionKwh: number;
  batteryCapacityWh: number;
  batteryCapacityKwh: number;
  requiredBatteryCount: number;
}

export function calculateHybridNightBackup(input: HybridNightBackupInput): HybridNightBackupResult {
  const { applications, backupHoursNight, battery } = input;

  // Total Load = Σ(Appliance Wattage × Quantity)  — Doc 3 §11
  const totalConnectedLoadW = applications.reduce((sum, entry) => {
    const wattage = APPLIANCE_WATTAGE[entry.applianceId];
    return sum + wattage * entry.quantity;
  }, 0);

  // Consumption (wh) = Total Load × Hours — Doc 3 §11
  const consumptionWh = totalConnectedLoadW * backupHoursNight;

  // Kwh = 1000w * h  =>  kwh = wh / 1000 — Doc 3 §11 conversion rule
  const totalConsumptionKwh = consumptionWh / CALCULATION_CONSTANTS.WATT_HOURS_PER_KWH;

  // Battery Capacity (wh) = (Voltage × Ah) × 0.9 — Doc 3 §11
  const batteryCapacityWh = battery.voltage * battery.ah * CALCULATION_CONSTANTS.BATTERY_POWER_FACTOR;
  const batteryCapacityKwh = batteryCapacityWh / CALCULATION_CONSTANTS.WATT_HOURS_PER_KWH;

  // Required Batteries = Total Consumption (kwh) / Battery Capacity (kwh) — Doc 3 §11
  // We use Math.round to match the Doc 3 worked example (9.504 / 4.608 = 2.0625 -> 2 batteries).
  const requiredBatteryCount = Math.round(totalConsumptionKwh / batteryCapacityKwh);

  return {
    totalConnectedLoadW,
    consumptionWh,
    totalConsumptionKwh,
    batteryCapacityWh,
    batteryCapacityKwh,
    requiredBatteryCount,
  };
}
