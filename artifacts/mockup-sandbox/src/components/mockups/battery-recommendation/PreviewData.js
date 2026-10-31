export const products = [
  { id: "hyxi-5-3-1p", brand: "HYXiPower", model: "5.3 kWh", kWh: 5.3, phase: "1-phase", price: 4500 },
  { id: "hyxi-10-6-1p", brand: "HYXiPower", model: "10.6 kWh", kWh: 10.6, phase: "1-phase", price: 5250 },
  { id: "hyxi-15-9-1p", brand: "HYXiPower", model: "15.9 kWh", kWh: 15.9, phase: "1-phase", price: 6950 },
  { id: "hyxi-10-6-all-in-3p", brand: "HYXiPower", model: "10.6 kWh All-in-One", kWh: 10.6, phase: "3-phase", price: 7250, backupCapable: true },
  { id: "hyxi-15-9-all-in-3p", brand: "HYXiPower", model: "15.9 kWh All-in-One", kWh: 15.9, phase: "3-phase", price: 8500, backupCapable: true },
  { id: "hyxi-21-2-all-in-3p", brand: "HYXiPower", model: "21.2 kWh All-in-One", kWh: 21.2, phase: "3-phase", price: 9500, backupCapable: true },
  { id: "hyxi-26-5-all-in-3p", brand: "HYXiPower", model: "26.5 kWh All-in-One", kWh: 26.5, phase: "3-phase", price: 10500, backupCapable: true },
  { id: "hyxi-15-9-3p", brand: "HYXiPower", model: "15.9 kWh", kWh: 15.9, phase: "3-phase", price: 7450 },
  { id: "alphaess-18-6-10kw-3p", brand: "AlphaESS", model: "18.6 kWh + 10 kW inverter", kWh: 18.6, phase: "3-phase", price: 8750 },
  { id: "alphaess-9-3-10kw-3p", brand: "AlphaESS", model: "9.3 kWh + 10 kW inverter", kWh: 9.3, phase: "3-phase", price: 6500 },
  { id: "dyness-14-2-3p", brand: "Dyness", model: "Tower S3 · 14.2 kWh", kWh: 14.2, phase: "3-phase", price: 7000 },
  { id: "dyness-7-1-3p", brand: "Dyness", model: "Tower S3 · 7.1 kWh", kWh: 7.1, phase: "3-phase", price: 5500 },
  { id: "kstar-25-5-all-in-3p", brand: "KSTAR", model: "25.5 kWh All-in", kWh: 25.5, phase: "3-phase", price: 10990 },
  { id: "kstar-5-1-all-in-1p", brand: "KSTAR", model: "5.1 kWh All-in", kWh: 5.1, phase: "1-phase", price: 4950 },
]

export const recommendations = [
  { product_id: "hyxi-15-9-all-in-3p", balanced_fit: true, recommended: false, more_independent: false, maximum_storage: false, comparison_product_id: "hyxi-10-6-all-in-3p", incremental_roi_pct: 52.4, incremental_payback_years: 1.9, self_sufficiency_after_pct: 47.2, utilization_pct: 84.6, ten_year_net_value_eur: 13300 },
  { product_id: "dyness-14-2-3p", balanced_fit: false, recommended: true, more_independent: false, maximum_storage: false, comparison_product_id: null, incremental_roi_pct: 81.6, incremental_payback_years: 1.2, self_sufficiency_after_pct: 44.1, utilization_pct: 91.3, ten_year_net_value_eur: 12600 },
  { product_id: "hyxi-26-5-all-in-3p", balanced_fit: false, recommended: false, more_independent: true, maximum_storage: true, comparison_product_id: "hyxi-21-2-all-in-3p", incremental_roi_pct: 14.8, incremental_payback_years: 6.8, self_sufficiency_after_pct: 59.8, utilization_pct: 65.4, ten_year_net_value_eur: 10600 },
  { product_id: "kstar-25-5-all-in-3p", balanced_fit: false, recommended: false, more_independent: false, maximum_storage: true, comparison_product_id: "dyness-21-3-3p", incremental_roi_pct: 19.4, incremental_payback_years: 5.2, self_sufficiency_after_pct: 58.2, utilization_pct: 72.1, ten_year_net_value_eur: 9700 },
]