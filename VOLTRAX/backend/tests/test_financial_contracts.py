import asyncio
import unittest
from unittest.mock import patch

from server import (
    BatteryCandidate,
    CalculationInput,
    CalculationResult,
    calculate as calculate_endpoint,
    calculate_battery_savings,
    rank_battery_candidates,
)


class FinancialContractsTests(unittest.TestCase):
    def calculate(self, **overrides):
        params = {
            "zonneproductie": 6000,
            "jaarverbruik": 4000,
            "teruglevering": 3000,
            "pE": 0.30,
            "pT": 0.07,
            "bat_kWh": 10,
            "battery_price": 5000,
            "terugleverkosten_value": 0,
            "terugleverkosten_unit": "jaar",
            "epex_optimization_supported": True,
        }
        params.update(overrides)
        return calculate_battery_savings(**params)

    def test_api_rejects_negative_inputs_but_accepts_valid_zero_values(self):
        payload = {
            "zonneproductie": 6000,
            "jaarverbruik": 4000,
            "teruglevering": 0,
            "prijsInkoop": 0.30,
            "prijsTeruglevering": 0,
            "battery_kWh": 0,
            "battery_price": 0,
            "terugleververgoeding_value": 0,
            "terugleverkosten_value": 0,
        }
        parsed = CalculationInput(**payload)
        self.assertEqual(parsed.teruglevering, 0)
        self.assertEqual(parsed.battery_kWh, 0)

        for field in (
            "zonneproductie",
            "jaarverbruik",
            "teruglevering",
            "prijsInkoop",
            "prijsTeruglevering",
            "battery_kWh",
            "battery_price",
            "terugleververgoeding_value",
            "terugleverkosten_value",
        ):
            invalid_payload = {**payload, field: -1}
            with self.subTest(field=field), self.assertRaises(ValueError):
                CalculationInput(**invalid_payload)

    def test_zero_solar_or_zero_consumption_is_a_valid_physical_edge_case(self):
        no_solar = self.calculate(
            zonneproductie=0,
            jaarverbruik=3500,
            teruglevering=0,
            bat_kWh=0,
            battery_price=0,
            dynamic_contract=False,
        )
        self.assertEqual(no_solar["sc_direct_kwh"], 0)
        self.assertEqual(no_solar["export_kwh_zonder"], 0)
        self.assertEqual(no_solar["grid_import_without"], 3500)
        self.assertEqual(no_solar["sc_pct_zonder"], 0)

        no_consumption = self.calculate(
            zonneproductie=3500,
            jaarverbruik=0,
            teruglevering=3500,
            bat_kWh=10.6,
            dynamic_contract=False,
            epex_optimization_supported=False,
        )
        self.assertEqual(no_consumption["sc_direct_kwh"], 0)
        self.assertEqual(no_consumption["grid_import_without"], 0)
        self.assertEqual(no_consumption["battery_home_delivery_kwh"], 0)
        self.assertEqual(no_consumption["self_sufficiency_before_pct"], 0)

    def test_api_rejects_unknown_feed_in_units(self):
        payload = {
            "zonneproductie": 6000,
            "jaarverbruik": 4000,
            "teruglevering": 3000,
            "prijsInkoop": 0.30,
            "prijsTeruglevering": 0.07,
            "battery_kWh": 10,
            "battery_price": 5000,
            "terugleververgoeding_unit": "monthly",
        }

        with self.assertRaises(ValueError):
            CalculationInput(**payload)

    def test_explicit_per_kwh_compensation_replaces_legacy_tariff(self):
        result = self.calculate(
            terugleververgoeding_value=0.20,
            terugleververgoeding_unit="kWh",
        )

        self.assertEqual(result["export_revenue_without"], 600)
        self.assertEqual(result["pT_used"], 0.20)
        self.assertEqual(
            result["export_revenue_loss_eur"],
            result["lost_terugleververgoeding"],
        )
        self.assertAlmostEqual(
            result["net_annual_cost_without"] - result["net_annual_cost_with"],
            result["net_energy_saving_eur"],
            delta=0.1,
        )

    def test_entered_export_compensation_and_feed_in_cost_both_affect_battery_result(self):
        result = self.calculate(
            terugleververgoeding_value=0.07,
            terugleververgoeding_unit="kWh",
            terugleverkosten_value=0.10,
            terugleverkosten_unit="kWh",
        )

        self.assertAlmostEqual(
            result["export_revenue_without"],
            0.07 * result["export_kwh_zonder"],
            delta=0.1,
        )
        self.assertAlmostEqual(
            result["export_revenue_with"],
            0.07 * result["export_kwh_with"],
            delta=0.1,
        )
        self.assertAlmostEqual(
            result["terugleverkosten_jaar"],
            0.10 * result["export_kwh_zonder"],
            delta=0.1,
        )
        self.assertAlmostEqual(
            result["terugleverkosten_na"],
            0.10 * result["export_kwh_with"],
            delta=0.1,
        )
        self.assertAlmostEqual(
            result["net_annual_cost_without"] - result["net_annual_cost_with"],
            result["bill_savings_annual"],
            delta=0.1,
        )

    def test_payback_uses_actual_savings_without_artificial_year_cap(self):
        result = self.calculate(battery_price=1_000_000)
        self.assertGreater(result["payback_low"], 100)
        # Fixed tariffs no longer get an artificial EMS/EPEX value range.
        self.assertAlmostEqual(result["payback_high"], result["payback_low"])

    def test_loss_making_battery_has_no_payback(self):
        result = self.calculate(pE=0.01, pT=5)
        self.assertLess(result["total_annual_high"], 0)
        self.assertIsNone(result["payback_low"])
        self.assertIsNone(result["payback_high"])

    def test_annual_compensation_is_not_treated_as_per_kwh_rate(self):
        result = self.calculate(
            terugleververgoeding_value=120,
            terugleververgoeding_unit="jaar",
        )

        self.assertEqual(result["export_revenue_without"], 120)
        self.assertEqual(result["pT_used"], 0.04)
        self.assertAlmostEqual(
            result["lost_terugleververgoeding"],
            120 * result["shift_pct"] / 100,
            delta=1,
        )
        self.assertAlmostEqual(
            result["net_annual_cost_without"] - result["net_annual_cost_with"],
            result["net_energy_saving_eur"],
            delta=1,
        )

    def test_legacy_clients_without_explicit_compensation_use_pt(self):
        result = self.calculate(terugleververgoeding_value=None)

        self.assertEqual(result["export_revenue_without"], 210)
        self.assertEqual(result["pT_used"], 0.07)
        self.assertAlmostEqual(
            result["net_annual_cost_without"] - result["net_annual_cost_with"],
            result["net_energy_saving_eur"],
            delta=1,
        )

    def test_explicit_zero_compensation_overrides_legacy_pt(self):
        result = self.calculate(
            terugleververgoeding_value=0,
            terugleververgoeding_unit="kWh",
        )

        self.assertEqual(result["export_revenue_without"], 0)
        self.assertEqual(result["pT_used"], 0)
        self.assertEqual(result["lost_terugleververgoeding"], 0)

    def test_api_result_includes_energy_movement_metrics(self):
        payload = {
            "zonneproductie": 6000,
            "jaarverbruik": 4000,
            "teruglevering": 3000,
            "prijsInkoop": 0.30,
            "prijsTeruglevering": 0,
            "battery_kWh": 10,
            "battery_price": 5000,
            "terugleververgoeding_value": 0.20,
            "terugleververgoeding_unit": "kWh",
        }
        parsed_input = CalculationInput(**payload)
        self.assertEqual(parsed_input.terugleververgoeding_value, 0.20)

        result = self.calculate(
            pT=0,
            terugleververgoeding_value=0.20,
            terugleververgoeding_unit="kWh",
        )
        parsed_result = CalculationResult(**result)
        self.assertEqual(parsed_result.pT_used, 0.20)
        self.assertEqual(parsed_result.export_revenue_with, result["export_revenue_with"])

    def test_report_regression_energy_balance_and_losses(self):
        result = self.calculate(
            zonneproductie=3500,
            jaarverbruik=2200,
            teruglevering=2000,
            bat_kWh=15.9,
            pE=0.35,
            pT=0.12,
            dynamic_contract=True,
            terugleverkosten_value=0.12,
            terugleverkosten_unit="kWh",
        )

        self.assertEqual(result["sc_direct_kwh"], 1500)
        self.assertEqual(result["grid_import_without"], 700)
        self.assertEqual(result["export_kwh_zonder"], 2000)
        self.assertEqual(result["sc_battery_kwh"], 643)
        self.assertEqual(result["battery_charge_kwh"], 677)
        self.assertEqual(result["grid_import_with"], 57)
        self.assertEqual(result["export_kwh_with"], 1323)
        self.assertAlmostEqual(result["solar_battery_charge_kwh"], 676.84, places=2)
        self.assertAlmostEqual(result["solar_battery_loss_kwh"], 33.84, places=2)
        self.assertEqual(result["terugleverkosten_jaar"], 240)
        self.assertAlmostEqual(
            result["terugleverkosten_na"],
            round(0.12 * result["export_kwh_with"], 2),
            delta=0.05,
        )
        self.assertEqual(
            result["saved_terugleverkosten"],
            round(240 - result["terugleverkosten_na"], 2),
        )
        self.assertAlmostEqual(result["battery_throughput_kwh"], 5237.66, places=2)
        self.assertAlmostEqual(result["battery_total_charge_kwh"] - result["battery_total_loss_kwh"], result["battery_throughput_kwh"], places=2)
        self.assertAlmostEqual(
            result["battery_total_charge_kwh"] - result["battery_total_loss_kwh"],
            result["battery_throughput_kwh"],
            places=2,
        )

    def test_106_kwh_reference_report_energy_and_financial_balances(self):
        result = self.calculate(
            zonneproductie=3500,
            jaarverbruik=4200,
            teruglevering=2200,
            pE=0.35,
            pT=0.12,
            bat_kWh=10.6,
            battery_price=6290,
            terugleverkosten_value=0.10,
            terugleverkosten_unit="kWh",
            dynamic_contract=True,
        )

        # The report's 1,300 kWh direct use + 2,900 kWh import requires
        # 4,200 kWh annual demand; 2,200 kWh demand would not match it.
        self.assertEqual(result["sc_direct_kwh"], 1300)
        self.assertEqual(result["grid_import_without"], 2900)
        self.assertEqual(result["export_kwh_zonder"], 2200)
        self.assertGreater(result["sc_battery_kwh"], 0)
        self.assertLessEqual(result["sc_battery_kwh"], result["grid_import_without"])
        self.assertLessEqual(result["sc_battery_kwh"], result["export_kwh_zonder"] * 0.95)
        self.assertLessEqual(result["ems_total_cycles"], 380)
        self.assertAlmostEqual(
            result["battery_total_charge_kwh"] - result["battery_total_loss_kwh"],
            result["battery_throughput_kwh"],
            places=2,
        )
        self.assertAlmostEqual(
            result["net_annual_cost_without"] - result["net_annual_cost_with"],
            result["net_energy_saving_eur"],
            delta=0.02,
        )
        self.assertAlmostEqual(
            result["total_annual_low"],
            result["net_energy_saving_eur"] + result["smart_annual_low"],
            places=2,
        )
        self.assertAlmostEqual(
            result["total_annual_high"],
            result["net_energy_saving_eur"] + result["smart_annual_high"],
            places=2,
        )
        self.assertEqual(
            result["payback_low"],
            round(6290 / result["total_annual_high"], 1),
        )
        self.assertAlmostEqual(
            result["ten_year_net_low_eur"],
            round(result["total_annual_low"] * 10 - 6290, 2),
            delta=0.02,
        )

    def test_epex_value_requires_dynamic_tariff_and_shares_350_to_380_cycle_budget(self):
        fixed = self.calculate(dynamic_contract=False)
        dynamic_without_grid_import = self.calculate(
            zonneproductie=10000,
            jaarverbruik=1000,
            teruglevering=9000,
            dynamic_contract=True,
        )

        self.assertEqual(fixed["epex_throughput_kwh"], 0)
        self.assertEqual(fixed["ems_physics_low"], 0)
        self.assertEqual(fixed["smart_monthly_low"], 0)
        self.assertEqual(fixed["smart_monthly_high"], 0)
        self.assertEqual(dynamic_without_grid_import["grid_import_with"], 0)
        self.assertAlmostEqual(
            dynamic_without_grid_import["solar_equivalent_cycles"]
            + dynamic_without_grid_import["epex_equivalent_cycles_low"],
            350,
            places=2,
        )
        self.assertAlmostEqual(
            dynamic_without_grid_import["solar_equivalent_cycles"]
            + dynamic_without_grid_import["epex_equivalent_cycles_high"],
            380,
            places=2,
        )
        self.assertGreater(dynamic_without_grid_import["smart_annual_low"], 0)

        dynamic_with_import = self.calculate(
            zonneproductie=1000,
            jaarverbruik=4000,
            teruglevering=0,
            dynamic_contract=True,
        )
        self.assertAlmostEqual(
            dynamic_with_import["solar_equivalent_cycles"]
            + dynamic_with_import["epex_equivalent_cycles_low"],
            350,
            places=2,
        )
        self.assertAlmostEqual(
            dynamic_with_import["solar_equivalent_cycles"]
            + dynamic_with_import["epex_equivalent_cycles_high"],
            380,
            places=2,
        )
        self.assertGreater(dynamic_with_import["epex_throughput_kwh"], 0)
        self.assertGreater(dynamic_with_import["ems_physics_high"], 0)
        expected_annual_low = dynamic_with_import["epex_throughput_low_kwh"] * 0.24 * 0.75
        expected_annual_high = dynamic_with_import["epex_throughput_high_kwh"] * 0.26 * 0.75
        self.assertAlmostEqual(
            dynamic_with_import["smart_annual_low"],
            expected_annual_low,
            delta=1,
        )
        self.assertAlmostEqual(
            dynamic_with_import["smart_annual_high"],
            expected_annual_high,
            delta=1,
        )
        self.assertAlmostEqual(
            dynamic_with_import["smart_monthly_low"],
            dynamic_with_import["smart_annual_low"] / 12,
            delta=0.1,
        )
        self.assertAlmostEqual(
            dynamic_with_import["smart_monthly_high"],
            dynamic_with_import["smart_annual_high"] / 12,
            delta=0.1,
        )
        self.assertAlmostEqual(
            dynamic_with_import["total_annual_high"],
            round(dynamic_with_import["bill_savings_annual"])
            + dynamic_with_import["smart_annual_high"],
            delta=0.1,
        )
        self.assertAlmostEqual(
            dynamic_with_import["payback_low"],
            round(5000 / dynamic_with_import["total_annual_high"], 1),
        )
        self.assertLessEqual(
            dynamic_with_import["battery_throughput_kwh"],
            10 * 0.95 * 365 * 0.95,
        )

        annual_range_case = self.calculate(
            zonneproductie=0,
            jaarverbruik=1000,
            teruglevering=0,
            bat_kWh=1.9,
            dynamic_contract=True,
        )
        self.assertAlmostEqual(
            annual_range_case["smart_annual_low"],
            annual_range_case["epex_throughput_low_kwh"] * 0.24 * 0.75,
            delta=1,
        )
        self.assertAlmostEqual(
            annual_range_case["smart_annual_high"],
            annual_range_case["epex_throughput_high_kwh"] * 0.26 * 0.75,
            delta=1,
        )

    def test_epex_range_is_preserved_when_solar_savings_are_high(self):
        result = self.calculate(
            zonneproductie=1000,
            jaarverbruik=4000,
            teruglevering=900,
            pE=13,
            bat_kWh=10,
            dynamic_contract=True,
        )

        self.assertGreater(result["bill_savings_annual"], 10_000)
        self.assertAlmostEqual(
            result["smart_annual_low"],
            result["epex_throughput_low_kwh"] * 0.24 * 0.75,
            delta=1,
        )
        self.assertAlmostEqual(
            result["smart_annual_high"],
            result["epex_throughput_high_kwh"] * 0.26 * 0.75,
            delta=1,
        )
        self.assertAlmostEqual(
            result["total_annual_high"],
            round(result["bill_savings_annual"]) + result["smart_annual_high"],
            delta=0.1,
        )

    def test_10_6_kwh_epex_value_is_reduced_by_25_percent_without_changing_throughput(self):
        result = self.calculate(bat_kWh=10.6, dynamic_contract=True)

        annual_range = result["smart_annual_high"] - result["smart_annual_low"]
        self.assertLessEqual(result["ems_total_cycles"], 380)
        self.assertLessEqual(
            result["epex_throughput_high_kwh"],
            result["battery_usable_capacity_kwh"] * 380 * 0.95,
        )
        self.assertAlmostEqual(result["smart_annual_low"], result["epex_throughput_low_kwh"] * 0.24 * 0.75, delta=0.01)
        self.assertAlmostEqual(result["smart_annual_high"], result["epex_throughput_high_kwh"] * 0.26 * 0.75, delta=0.01)
        self.assertGreater(annual_range, 0)
        self.assertGreater(annual_range, 60)
        self.assertAlmostEqual(
            result["smart_monthly_low"],
            result["smart_annual_low"] / 12,
            delta=0.01,
        )
        self.assertAlmostEqual(
            result["smart_monthly_high"],
            result["smart_annual_high"] / 12,
            delta=0.01,
        )

    def test_dynamic_battery_saves_only_variable_fees_on_export_actually_avoided(self):
        no_fee_result = self.calculate(
            bat_kWh=10,
            dynamic_contract=True,
            terugleverkosten_value=0,
            terugleverkosten_unit="jaar",
        )

        for unit, value in (
            ("jaar", 300),
            ("kWh", 0.10),
        ):
            with self.subTest(unit=unit):
                result = self.calculate(
                    bat_kWh=10,
                    dynamic_contract=True,
                    terugleverkosten_value=value,
                    terugleverkosten_unit=unit,
                )

                self.assertEqual(result["terugleverkosten_jaar"], 300)
                expected_after = (
                    300.0
                    if unit == "jaar"
                    else round(0.10 * result["export_kwh_with"], 2)
                )
                expected_saved = round(
                    result["terugleverkosten_jaar"] - result["terugleverkosten_na"],
                    2,
                )
                self.assertAlmostEqual(
                    result["terugleverkosten_na"],
                    expected_after,
                    delta=0.1,
                )
                self.assertEqual(result["saved_terugleverkosten"], expected_saved)
                self.assertAlmostEqual(
                    result["bill_savings_annual"] - no_fee_result["bill_savings_annual"],
                    expected_saved,
                    delta=0.01,
                )

    def test_dynamic_current_contract_keeps_entered_per_kwh_fee_in_baseline(self):
        result = self.calculate(
            bat_kWh=0,
            dynamic_contract=True,
            terugleverkosten_value=0.10,
            terugleverkosten_unit="kWh",
        )

        self.assertEqual(result["terugleverkosten_jaar"], 300)
        self.assertEqual(result["saved_terugleverkosten"], 0)
        self.assertEqual(
            result["net_annual_cost_without"],
            result["net_annual_cost_with"],
        )

    def test_fixed_current_contract_uses_dynamic_battery_case_and_reports_switch_savings(self):
        payload = CalculationInput(
            zonneproductie=6000,
            jaarverbruik=4000,
            teruglevering=3000,
            prijsInkoop=0.30,
            prijsTeruglevering=0.07,
            terugleverkosten_value=0.10,
            terugleverkosten_unit="kWh",
            battery_kWh=10.6,
            battery_price=5000,
            dynamic_contract=False,
            epex_optimization_supported=True,
        )
        result = asyncio.run(calculate_endpoint(payload))
        fixed_comparison = self.calculate(
            bat_kWh=payload.battery_kWh,
            battery_price=payload.battery_price,
            dynamic_contract=False,
            terugleverkosten_value=payload.terugleverkosten_value,
            terugleverkosten_unit=payload.terugleverkosten_unit,
        )

        self.assertFalse(result.current_dynamic_contract)
        self.assertTrue(result.dynamic_contract)
        self.assertTrue(result.epex_optimization_supported)
        self.assertGreater(result.smart_annual_low, 0)
        self.assertAlmostEqual(
            result.smart_annual_low,
            result.epex_throughput_low_kwh * 0.24 * 0.75,
            delta=0.01,
        )
        self.assertAlmostEqual(
            result.smart_annual_high,
            result.epex_throughput_high_kwh * 0.26 * 0.75,
            delta=0.01,
        )
        self.assertAlmostEqual(
            result.total_annual_low,
            result.bill_savings_annual + result.smart_annual_low,
            delta=0.01,
        )
        self.assertAlmostEqual(
            result.payback_high,
            round(5000 / result.total_annual_low, 1),
        )
        self.assertEqual(fixed_comparison["smart_annual_low"], 0)
        self.assertEqual(fixed_comparison["smart_annual_high"], 0)
        self.assertGreater(
            result.total_annual_low,
            fixed_comparison["total_annual_low"],
        )
        self.assertEqual(result.terugleverkosten_jaar, 300)
        self.assertEqual(result.terugleverkosten_na, 0)
        self.assertEqual(result.saved_terugleverkosten, 300)
        self.assertTrue(result.current_fixed_feed_in_cost_removed)
        self.assertAlmostEqual(
            result.bill_savings_annual,
            result.net_annual_cost_without - result.net_annual_cost_with,
            delta=0.01,
        )
        self.assertAlmostEqual(
            result.switch_to_dynamic_annual_low,
            result.total_annual_low - fixed_comparison["total_annual_low"],
            delta=0.01,
        )
        self.assertAlmostEqual(
            result.switch_to_dynamic_annual_high,
            result.total_annual_high - fixed_comparison["total_annual_high"],
            delta=0.01,
        )
        self.assertAlmostEqual(
            result.switch_to_dynamic_monthly_low,
            result.switch_to_dynamic_annual_low / 12,
            delta=0.01,
        )
        self.assertAlmostEqual(
            result.switch_to_dynamic_monthly_high,
            result.switch_to_dynamic_annual_high / 12,
            delta=0.01,
        )

    def test_fixed_annual_feed_in_charge_is_removed_from_dynamic_after_case(self):
        payload = CalculationInput(
            zonneproductie=6000,
            jaarverbruik=4000,
            teruglevering=3000,
            prijsInkoop=0.30,
            prijsTeruglevering=0.07,
            terugleverkosten_value=240,
            terugleverkosten_unit="jaar",
            battery_kWh=10.6,
            battery_price=5000,
            dynamic_contract=False,
        )

        result = asyncio.run(calculate_endpoint(payload))

        self.assertEqual(result.terugleverkosten_jaar, 240)
        self.assertEqual(result.terugleverkosten_na, 0)
        self.assertEqual(result.saved_terugleverkosten, 240)
        self.assertTrue(result.current_fixed_feed_in_cost_removed)
        self.assertAlmostEqual(
            result.bill_savings_annual,
            result.net_annual_cost_without - result.net_annual_cost_with,
            delta=0.01,
        )

    def test_self_consumption_and_self_sufficiency_are_distinct_and_bounded(self):
        result = self.calculate(
            zonneproductie=6000,
            jaarverbruik=12000,
            teruglevering=3000,
            bat_kWh=0.1,
            dynamic_contract=False,
        )

        self.assertAlmostEqual(result["sc_pct_zonder"], 50.0, delta=0.1)
        self.assertAlmostEqual(result["self_sufficiency_before_pct"], 25.0, delta=0.1)
        self.assertLess(result["self_sufficiency_after_pct"], 100)
        self.assertLessEqual(result["self_sufficiency_after_pct"], 100)
        self.assertGreaterEqual(result["battery_utilization_pct"], 0)
        self.assertLessEqual(result["battery_utilization_pct"], 100)

    def test_entered_export_drives_annual_balance_without_artificial_cap(self):
        inputs = {
            "zonneproductie": 4000,
            "jaarverbruik": 4000,
            "teruglevering": 1,
            "pE": 0.30,
            "pT": 0.07,
            "battery_price": 5000,
        }
        baseline = self.calculate(**inputs, bat_kWh=0)

        self.assertEqual(baseline["sc_direct_kwh"], 3999)
        self.assertEqual(baseline["grid_import_without"], 1)
        self.assertEqual(baseline["self_sufficiency_before_pct"], 99.98)
        self.assertEqual(baseline["export_kwh_zonder"], 1)
        self.assertEqual(baseline["export_kwh_entered"], 1)
        self.assertFalse(baseline["export_input_adjusted"])
        self.assertEqual(
            baseline["sc_direct_kwh"] + baseline["grid_import_without"],
            4000,
        )
        self.assertEqual(
            baseline["sc_direct_kwh"] + baseline["export_kwh_zonder"],
            4000,
        )

        with_battery = self.calculate(**inputs, bat_kWh=10)
        self.assertLess(with_battery["grid_import_with"], baseline["grid_import_without"])
        self.assertLessEqual(with_battery["sc_battery_kwh"], 1)
        self.assertLess(with_battery["grid_import_with"], baseline["grid_import_without"])

    def test_battery_can_move_solar_self_consumption_from_27_percent_with_350_cycle_base(self):
        result = self.calculate(
            zonneproductie=6000,
            jaarverbruik=5000,
            teruglevering=4380,
            bat_kWh=7.6,
            dynamic_contract=False,
        )

        self.assertEqual(result["zelfverbruik_voor"], 27.0)
        self.assertAlmostEqual(result["zelfverbruik_na"], 63.0, delta=0.2)
        self.assertAlmostEqual(result["sc_battery_kwh"], 2159, delta=1)

    def test_home_delivery_increases_with_capacity_when_daily_storage_is_the_limit(self):
        # The daily-average seasonal profile has abundant solar export and
        # residual household demand here, so smaller batteries hit their
        # usable-capacity limit before the larger batteries do.
        outputs = []
        for capacity in (10.6, 15.9, 21.2, 26.5):
            result = self.calculate(
                zonneproductie=8000,
                jaarverbruik=12000,
                teruglevering=5000,
                bat_kWh=capacity,
                dynamic_contract=True,
                epex_optimization_supported=True,
            )
            outputs.append(result["battery_home_delivery_kwh"])
            self.assertLessEqual(result["battery_home_delivery_kwh"], 9000)
            self.assertLessEqual(
                result["battery_home_delivery_kwh"],
                result["solar_battery_charge_kwh"] * 0.95 + 0.02,
            )
            self.assertAlmostEqual(
                result["battery_actual_discharge_kwh"],
                result["battery_home_delivery_kwh"] + result["battery_trading_discharge_kwh"],
                delta=0.02,
            )
        self.assertTrue(all(a < b for a, b in zip(outputs, outputs[1:])))

    def test_flexible_airco_load_uses_epex_cycles_instead_of_double_counting_trade(self):
        base = self.calculate(
            zonneproductie=6000,
            jaarverbruik=4000,
            teruglevering=3000,
            bat_kWh=10.6,
            dynamic_contract=True,
            epex_optimization_supported=True,
        )
        with_airco = self.calculate(
            zonneproductie=6000,
            jaarverbruik=4900,
            teruglevering=3000,
            bat_kWh=10.6,
            dynamic_contract=True,
            epex_optimization_supported=True,
            epex_home_use_kwh=900,
            battery_cheap_charge_price_eur_per_kwh=0.15,
        )

        self.assertGreater(with_airco["epex_home_delivery_kwh"], 0)
        self.assertLessEqual(with_airco["epex_home_delivery_kwh"], 900)
        self.assertGreater(
            with_airco["battery_home_delivery_kwh"],
            base["battery_home_delivery_kwh"],
        )
        self.assertLess(
            with_airco["battery_trading_discharge_kwh"],
            base["battery_trading_discharge_kwh"],
        )
        self.assertAlmostEqual(
            with_airco["battery_actual_discharge_kwh"],
            with_airco["battery_home_delivery_kwh"] + with_airco["battery_trading_discharge_kwh"],
            places=2,
        )
        self.assertLessEqual(with_airco["ems_total_cycles"], 380)
        self.assertAlmostEqual(
            with_airco["epex_home_charge_cost_eur"],
            with_airco["epex_home_delivery_kwh"] / 0.95 * 0.15,
            places=2,
        )
        self.assertAlmostEqual(
            with_airco["total_annual_low"],
            with_airco["bill_savings_annual"] + with_airco["smart_annual_low"],
            places=2,
        )

    def test_flexible_home_load_cannot_use_epex_without_supported_dynamic_battery(self):
        result = self.calculate(
            dynamic_contract=False,
            epex_optimization_supported=False,
            epex_home_use_kwh=900,
        )
        self.assertEqual(result["epex_home_delivery_kwh"], 0)
        self.assertEqual(result["epex_throughput_kwh"], 0)

    def test_airco_dispatch_respects_cycle_budget_across_all_supported_battery_sizes(self):
        for capacity in (10.6, 15.9, 21.2, 26.5):
            with self.subTest(capacity=capacity):
                result = self.calculate(
                    zonneproductie=7000,
                    jaarverbruik=9000,
                    teruglevering=3500,
                    bat_kWh=capacity,
                    dynamic_contract=True,
                    epex_optimization_supported=True,
                    epex_home_use_kwh=1800,
                    battery_cheap_charge_price_eur_per_kwh=0.15,
                )
                self.assertLessEqual(result["epex_home_delivery_kwh"], 1800)
                self.assertLessEqual(result["ems_total_cycles"], 380.01)
                self.assertAlmostEqual(
                    result["battery_actual_discharge_kwh"],
                    result["battery_home_delivery_kwh"] + result["battery_trading_discharge_kwh"],
                    delta=0.02,
                )
                self.assertAlmostEqual(
                    result["battery_total_charge_kwh"] - result["battery_total_loss_kwh"],
                    result["battery_actual_discharge_kwh"],
                    delta=0.02,
                )

    def test_heat_pump_cheap_battery_supply_closes_energy_cost_and_cycle_budgets(self):
        result = self.calculate(
            zonneproductie=6000,
            jaarverbruik=6344,
            teruglevering=2766,
            bat_kWh=10.6,
            dynamic_contract=True,
            epex_optimization_supported=True,
            epex_home_use_kwh=2110,
            battery_cheap_charge_price_eur_per_kwh=0.15,
        )

        self.assertGreater(result["epex_home_delivery_kwh"], 0)
        self.assertLessEqual(result["epex_home_delivery_kwh"], 2110)
        self.assertAlmostEqual(
            result["epex_home_charge_kwh"] * 0.95,
            result["epex_home_delivery_kwh"],
            delta=0.02,
        )
        household_grid_import = result["grid_import_with"] - result["epex_home_charge_kwh"]
        self.assertAlmostEqual(
            result["sc_direct_kwh"]
            + result["sc_battery_kwh"]
            + result["epex_home_delivery_kwh"]
            + household_grid_import,
            result["v_input"],
            delta=0.02,
        )
        self.assertAlmostEqual(
            result["battery_actual_discharge_kwh"],
            result["battery_home_delivery_kwh"] + result["battery_trading_discharge_kwh"],
            delta=0.02,
        )
        self.assertAlmostEqual(
            result["battery_total_charge_kwh"] - result["battery_total_loss_kwh"],
            result["battery_actual_discharge_kwh"],
            delta=0.02,
        )
        self.assertAlmostEqual(
            result["solar_equivalent_cycles"] + result["ems_cycli"],
            result["ems_total_cycles"],
            places=1,
        )
        self.assertLessEqual(result["ems_total_cycles"], 380)
        self.assertAlmostEqual(
            result["net_annual_cost_without"] - result["net_annual_cost_with"],
            result["net_energy_saving_eur"],
            delta=0.02,
        )

    def test_hyxipower_sizes_obey_energy_and_combined_cycle_limits(self):
        for capacity in (10.6, 15.9, 21.2, 26.5):
            with self.subTest(capacity=capacity):
                result = self.calculate(
                    zonneproductie=3500,
                    jaarverbruik=3500,
                    teruglevering=600,
                    bat_kWh=capacity,
                    dynamic_contract=True,
                    epex_optimization_supported=False,
                )
                self.assertGreaterEqual(result["sc_battery_kwh"], 0)
                self.assertLessEqual(result["sc_battery_kwh"], 600 * 0.95)
                self.assertLessEqual(result["sc_battery_kwh"], 600)
                self.assertLessEqual(result["ems_total_cycles"], 380)
                self.assertEqual(result["epex_throughput_kwh"], 0)
                self.assertAlmostEqual(
                    result["battery_actual_discharge_kwh"],
                    result["battery_home_delivery_kwh"] + result["battery_trading_discharge_kwh"],
                    places=2,
                )
                self.assertAlmostEqual(
                    result["battery_total_charge_kwh"] - result["battery_total_loss_kwh"],
                    result["battery_actual_discharge_kwh"],
                    places=2,
                )
                self.assertAlmostEqual(
                    result["battery_potential_discharge_low_kwh"],
                    capacity * 0.95 * 350 * 0.95,
                    places=2,
                )
                self.assertAlmostEqual(
                    result["battery_potential_discharge_high_kwh"],
                    capacity * 0.95 * 380 * 0.95,
                    places=2,
                )

    def test_battery_flow_balance_closes_for_common_product_load_mixes(self):
        # Annual loads stand in for the additional heat-pump, airco and EV demand
        # already added by the frontend energy scenario.
        scenarios = (
            (6000, 4500, 3000),  # high export, evening demand
            (6000, 2800, 3500),  # high export, low demand
            (4500, 8000, 900),   # heat pump
            (5000, 5500, 1800),  # airco
            (6000, 6500, 1600),  # EV charging
            (6000, 10000, 1000), # combined added loads
        )
        for capacity in (10.6, 15.9, 21.2, 26.5):
            for pv, demand, export in scenarios:
                with self.subTest(capacity=capacity, pv=pv, demand=demand, export=export):
                    result = self.calculate(
                        zonneproductie=pv,
                        jaarverbruik=demand,
                        teruglevering=export,
                        bat_kWh=capacity,
                        dynamic_contract=True,
                        epex_optimization_supported=True,
                    )
                    self.assertAlmostEqual(
                        result["sc_direct_kwh"] + result["grid_import_without"],
                        result["v_input"],
                        delta=0.02,
                    )
                    self.assertAlmostEqual(
                        result["sc_direct_kwh"] + result["export_kwh_zonder"],
                        result["pv_input"],
                        delta=0.02,
                    )
                    self.assertAlmostEqual(
                        result["battery_actual_discharge_kwh"],
                        result["battery_home_delivery_kwh"] + result["battery_trading_discharge_kwh"],
                        delta=0.02,
                    )
                    self.assertAlmostEqual(
                        result["battery_total_charge_kwh"] - result["battery_total_loss_kwh"],
                        result["battery_actual_discharge_kwh"],
                        delta=0.02,
                    )
                    self.assertLessEqual(result["ems_total_cycles"], 380.01)
                    self.assertAlmostEqual(
                        result["total_annual_low"],
                        result["bill_savings_annual"] + result["smart_annual_low"],
                        delta=0.02,
                    )

    def test_reference_case_separates_home_solar_shift_and_epex_value(self):
        result = asyncio.run(calculate_endpoint(CalculationInput(
            zonneproductie=4500,
            jaarverbruik=2800,
            teruglevering=2200,
            prijsInkoop=0.28,
            prijsTeruglevering=0.07,
            battery_kWh=10.6,
            battery_price=6290,
            terugleververgoeding_value=0.07,
            terugleververgoeding_unit="kWh",
            terugleverkosten_value=0.11,
            terugleverkosten_unit="kWh",
            dynamic_contract=False,
            epex_optimization_supported=True,
        )))
        self.assertTrue(result.dynamic_contract)
        self.assertTrue(result.epex_optimization_supported)
        self.assertAlmostEqual(result.battery_actual_discharge_kwh, 3491.77, delta=0.02)
        self.assertAlmostEqual(result.grid_import_besparing_kwh, 489, delta=0.02)
        self.assertAlmostEqual(result.export_shift_kwh, 515.0, delta=0.02)
        self.assertAlmostEqual(result.bill_savings_annual, 342.95, delta=0.02)
        self.assertAlmostEqual(result.smart_annual_low, 514.62, delta=0.02)
        self.assertAlmostEqual(result.smart_annual_high, 613.46, delta=0.02)
        self.assertAlmostEqual(result.total_annual_low, 857.57, delta=0.02)
        self.assertAlmostEqual(result.total_annual_high, 956.41, delta=0.02)

    def test_epex_is_not_assumed_without_explicit_compatibility_confirmation(self):
        result = asyncio.run(calculate_endpoint(CalculationInput(
            zonneproductie=4500,
            jaarverbruik=2800,
            teruglevering=2200,
            prijsInkoop=0.28,
            prijsTeruglevering=0.07,
            battery_kWh=10.6,
            battery_price=6290,
            dynamic_contract=True,
            epex_optimization_supported=False,
        )))
        self.assertFalse(result.epex_optimization_supported)
        self.assertEqual(result.epex_throughput_kwh, 0)
        self.assertEqual(result.smart_annual_low, 0)
        self.assertEqual(result.smart_annual_high, 0)

    def test_self_consumption_is_calculated_from_flows_not_a_battery_size_ceiling(self):
        result = self.calculate(
            zonneproductie=2500,
            jaarverbruik=2500,
            teruglevering=500,
            bat_kWh=5,
            dynamic_contract=False,
        )
        self.assertAlmostEqual(result["sc_direct_kwh"], 2000, delta=0.01)
        self.assertLessEqual(result["sc_battery_kwh"], 500 * 0.95)
        self.assertLess(result["sc_pct_met"], 100.0)
        self.assertAlmostEqual(result["sc_total_kwh"] + result["grid_import_with"], 2500, delta=1)
        self.assertEqual(result["export_kwh_with"], 133.0)

    def test_larger_battery_does_not_win_on_total_savings_alone(self):
        calculation = CalculationInput(
            zonneproductie=6000,
            jaarverbruik=4000,
            teruglevering=3000,
            prijsInkoop=0.30,
            prijsTeruglevering=0.07,
            battery_kWh=10,
            battery_price=5000,
            dynamic_contract=True,
        )
        def modeled_result(_input_data, capacity, _price):
            if capacity == 0:
                return {"self_sufficiency_before_pct": 40.0}
            if capacity == 5:
                return {
                    "total_annual_low": 1000.0,
                    "total_annual_high": 1000.0,
                    "battery_utilization_pct": 90.0,
                    "self_sufficiency_after_pct": 40.0,
                }
            return {
                "total_annual_low": 1500.0,
                "total_annual_high": 1500.0,
                "battery_utilization_pct": 80.0,
                "self_sufficiency_after_pct": 50.0,
            }

        with patch("server._calculate_for_battery", side_effect=modeled_result):
            ranked = rank_battery_candidates(calculation, [
                BatteryCandidate(product_id="small", battery_kWh=5, battery_price=1000),
                BatteryCandidate(product_id="large", battery_kWh=10, battery_price=2000),
            ])

        small = next(row for row in ranked if row["product_id"] == "small")
        large = next(row for row in ranked if row["product_id"] == "large")
        self.assertGreater(large["annual_savings_mid_eur"], small["annual_savings_mid_eur"])
        self.assertEqual(large["incremental_roi_pct"], 50.0)
        self.assertEqual(small["incremental_roi_pct"], 100.0)
        self.assertEqual(small["rank"], 1)
        self.assertTrue(small["recommended"])
        self.assertFalse(large["recommended"])
        self.assertTrue(large["more_independent"])
        self.assertTrue(large["maximum_storage"])
        self.assertEqual(large["ten_year_net_value_eur"], 13000.0)

    def test_balanced_fit_uses_smallest_capacity_near_max_self_sufficiency(self):
        calculation = CalculationInput(
            zonneproductie=6000,
            jaarverbruik=6500,
            teruglevering=2800,
            prijsInkoop=0.30,
            prijsTeruglevering=0.07,
            battery_kWh=10,
            battery_price=5000,
            dynamic_contract=True,
        )

        def modeled_result(_input_data, capacity, _price):
            if capacity == 0:
                return {"self_sufficiency_before_pct": 40.0}
            modeled = {
                5: (500.0, 90.0, 46.0),
                10: (900.0, 85.0, 55.0),
                15: (910.0, 70.0, 56.0),
            }
            annual, utilization, self_sufficiency = modeled[capacity]
            return {
                "total_annual_low": annual,
                "total_annual_high": annual,
                "battery_utilization_pct": utilization,
                "self_sufficiency_after_pct": self_sufficiency,
            }

        with patch("server._calculate_for_battery", side_effect=modeled_result):
            ranked = rank_battery_candidates(calculation, [
                BatteryCandidate(product_id="small", battery_kWh=5, battery_price=1000),
                BatteryCandidate(product_id="balanced", battery_kWh=10, battery_price=1800),
                BatteryCandidate(product_id="large", battery_kWh=15, battery_price=3000),
            ])

        fit = next(row for row in ranked if row["product_id"] == "balanced")
        small = next(row for row in ranked if row["product_id"] == "small")
        large = next(row for row in ranked if row["product_id"] == "large")
        self.assertTrue(fit["balanced_fit"])
        self.assertEqual(fit["balanced_fit_target_self_sufficiency_pct"], 54.4)
        self.assertAlmostEqual(fit["balanced_fit_max_gain_pct"], 16.0)
        self.assertFalse(small["balanced_fit"])
        self.assertFalse(large["balanced_fit"])
        self.assertTrue(large["more_independent"])
        self.assertTrue(large["maximum_storage"])

    def test_sufficiency_never_exceeds_100_percent_when_use_exceeds_solar(self):
        for capacity in (1, 10, 30):
            result = self.calculate(
                zonneproductie=2500,
                jaarverbruik=5000,
                teruglevering=0,
                bat_kWh=capacity,
                dynamic_contract=True,
            )
            self.assertLess(result["self_sufficiency_after_pct"], 100)
            self.assertLessEqual(result["sc_total_kwh"], result["v_input"])
            self.assertGreaterEqual(result["grid_import_with"], 0)

    def test_api_input_and_result_keep_legacy_shape_with_optional_additions(self):
        result = self.calculate(dynamic_contract=True)
        parsed_result = CalculationResult(**result)
        self.assertEqual(parsed_result.self_sufficiency_after_pct, result["self_sufficiency_after_pct"])
        self.assertEqual(parsed_result.epex_throughput_kwh, result["epex_throughput_kwh"])
        self.assertEqual(parsed_result.epex_throughput_low_kwh, result["epex_throughput_low_kwh"])
        self.assertEqual(parsed_result.epex_throughput_high_kwh, result["epex_throughput_high_kwh"])
        self.assertEqual(parsed_result.smart_monthly_low, result["smart_monthly_low"])

    def test_battery_energy_and_cost_balances_hold_across_household_scenarios(self):
        scenarios = [
            (0, 4000, 0),
            (6000, 4000, 3000),
            (3000, 7000, 0),
            (9000, 2500, 6500),
        ]
        for solar, use, export in scenarios:
            for capacity in (0, 5, 10.6, 21.2):
                for dynamic in (False, True):
                    with self.subTest(solar=solar, use=use, export=export, capacity=capacity, dynamic=dynamic):
                        result = self.calculate(
                            zonneproductie=solar,
                            jaarverbruik=use,
                            teruglevering=export,
                            bat_kWh=capacity,
                            dynamic_contract=dynamic,
                        )
                        self.assertAlmostEqual(
                            result["sc_direct_kwh"] + result["export_kwh_zonder"],
                            result["pv_input"],
                            delta=2,
                        )
                        self.assertAlmostEqual(
                            result["sc_direct_kwh"] + result["grid_import_without"],
                            result["v_input"],
                            delta=2,
                        )
                        self.assertAlmostEqual(
                            result["sc_total_kwh"] + result["grid_import_with"],
                            result["v_input"],
                            delta=2,
                        )
                        self.assertGreaterEqual(result["export_kwh_with"], 0)
                        self.assertLessEqual(result["sc_total_kwh"], result["v_input"] + 1)
                        self.assertAlmostEqual(
                            result["net_annual_cost_without"] - result["net_annual_cost_with"],
                            result["net_energy_saving_eur"],
                            delta=2,
                        )
                        self.assertEqual(result["smart_annual_low"] > 0, dynamic and capacity > 0)


if __name__ == "__main__":
    unittest.main()