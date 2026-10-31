from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
import logging
import math
import os
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

app = FastAPI()
api_router = APIRouter(prefix="/api")

class CalculationInput(BaseModel):
    zonneproductie: float = Field(ge=0)
    jaarverbruik: float = Field(ge=0)
    teruglevering: float = Field(ge=0)
    prijsInkoop: float = Field(gt=0)
    prijsTeruglevering: float = Field(ge=0)
    battery_kWh: float = Field(ge=0)
    battery_price: float = Field(ge=0)
    terugleververgoeding_value: Optional[float] = Field(default=None, ge=0)
    terugleververgoeding_unit: Optional[Literal["kWh", "jaar"]] = "kWh"
    terugleverkosten_value: Optional[float] = Field(default=0, ge=0)
    terugleverkosten_unit: Optional[Literal["kWh", "jaar"]] = "jaar"
    dynamic_contract: Optional[bool] = False
    epex_optimization_supported: bool = False
    epex_home_use_kwh: float = Field(default=0, ge=0)
    battery_cheap_charge_price_eur_per_kwh: float = Field(default=0.15, ge=0)


class BatteryCandidate(BaseModel):
    product_id: str
    battery_kWh: float = Field(gt=0)
    battery_price: float = Field(ge=0)


class BatteryRecommendationInput(BaseModel):
    calculation: CalculationInput
    candidates: List[BatteryCandidate]


class CalculationResult(BaseModel):
    smart_daily_low: float
    smart_daily_high: float
    smart_monthly_low: float
    smart_monthly_high: float
    smart_annual_low: float
    smart_annual_high: float
    bill_savings_annual: float
    bill_savings_monthly: float
    total_annual_low: float
    total_annual_high: float
    total_daily_low: float
    total_daily_high: float
    ten_year_net_low_eur: Optional[float] = None
    ten_year_net_high_eur: Optional[float] = None
    payback_low: Optional[float] = None
    payback_high: Optional[float] = None
    zelfverbruik_voor: float
    zelfverbruik_na: float
    netonafhankelijkheid: float
    teruglevering_voor: float
    teruglevering_na: float
    bat_shift_kwh: float
    saved_terugleverkosten: float
    terugleverkosten_jaar: Optional[float] = None
    lost_terugleververgoeding: float
    grid_import_without: float
    grid_cost_without: float
    export_revenue_without: float
    net_annual_cost_without: float
    grid_cost_with: float
    export_revenue_with: Optional[float] = None
    net_annual_cost_with: Optional[float] = None
    export_kwh_with: float
    sc_direct_kwh: float
    sc_battery_kwh: float
    sc_total_kwh: float
    sc_pct_zonder: float
    sc_pct_met: float
    grid_import_with: float
    grid_import_besparing_kwh: float
    grid_import_besparing_eur: float
    export_kwh_zonder: float
    export_shift_kwh: float
    export_kwh_entered: Optional[float] = None
    export_input_adjusted: Optional[bool] = None
    export_revenue_loss_eur: float
    battery_arbitrage_eur: float
    net_energy_saving_eur: float
    pE_used: float
    pT_used: float
    pv_input: float
    v_input: float
    t_input: float
    batterySelfConsumption: float
    totalSelfConsumption: float
    ems_solar_cycles: Optional[float] = None
    ems_total_cycles: Optional[float] = None
    ems_cycli: Optional[float] = None
    spread_low: Optional[float] = None
    spread_high: Optional[float] = None
    dynamic_contract: Optional[bool] = None
    current_dynamic_contract: Optional[bool] = None
    current_fixed_feed_in_cost_removed: Optional[bool] = None
    switch_to_dynamic_annual_low: Optional[float] = None
    switch_to_dynamic_annual_high: Optional[float] = None
    switch_to_dynamic_monthly_low: Optional[float] = None
    switch_to_dynamic_monthly_high: Optional[float] = None
    garantie_bonus: Optional[float] = None
    escalation_eur_low: Optional[float] = None
    escalation_eur_high: Optional[float] = None
    sald_protection_eur: Optional[float] = None
    ems_physics_low: Optional[float] = None
    ems_physics_high: Optional[float] = None
    ems_model_uncertainty_factor: Optional[float] = None
    battery_charge_kwh: Optional[float] = None
    shift_pct: Optional[float] = None
    net_voor_pct: Optional[float] = None
    net_na_pct: Optional[float] = None
    self_sufficiency_before_pct: Optional[float] = None
    self_sufficiency_after_pct: Optional[float] = None
    battery_throughput_kwh: Optional[float] = None
    battery_utilization_pct: Optional[float] = None
    epex_throughput_kwh: Optional[float] = None
    epex_throughput_low_kwh: Optional[float] = None
    epex_throughput_high_kwh: Optional[float] = None
    solar_battery_charge_kwh: Optional[float] = None
    solar_battery_loss_kwh: Optional[float] = None
    epex_grid_charge_kwh: Optional[float] = None
    epex_home_charge_kwh: Optional[float] = None
    epex_conversion_loss_kwh: Optional[float] = None
    battery_total_charge_kwh: Optional[float] = None
    battery_total_loss_kwh: Optional[float] = None
    terugleverkosten_na: Optional[float] = None
    battery_usable_capacity_kwh: Optional[float] = None
    battery_potential_discharge_low_kwh: Optional[float] = None
    battery_potential_discharge_high_kwh: Optional[float] = None
    battery_actual_discharge_kwh: Optional[float] = None
    battery_home_delivery_kwh: Optional[float] = None
    battery_trading_discharge_kwh: Optional[float] = None
    battery_unused_potential_low_kwh: Optional[float] = None
    battery_unused_potential_high_kwh: Optional[float] = None
    battery_capacity_assumption: Optional[str] = None
    battery_max_cycles_per_day: Optional[float] = None
    solar_equivalent_cycles: Optional[float] = None
    epex_equivalent_cycles_low: Optional[float] = None
    epex_equivalent_cycles_high: Optional[float] = None
    battery_cycle_limit_per_year: Optional[float] = None
    epex_optimization_supported: Optional[bool] = None
    epex_home_delivery_kwh: Optional[float] = None
    epex_home_charge_cost_eur: Optional[float] = None
    battery_cheap_charge_price_eur_per_kwh: Optional[float] = None


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def calculate_battery_savings(
    zonneproductie: float,
    jaarverbruik: float,
    teruglevering: float,
    pE: float,
    pT: float,
    bat_kWh: float,
    battery_price: float,
    terugleververgoeding_value: Optional[float] = None,
    terugleververgoeding_unit: str = "kWh",
    terugleverkosten_value: float = 0,
    terugleverkosten_unit: str = "jaar",
    dynamic_contract: bool = False,
    epex_optimization_supported: bool = False,
    epex_home_use_kwh: float = 0.0,
    battery_cheap_charge_price_eur_per_kwh: float = 0.15,
) -> dict:
    """
    Battery savings from physically bounded energy flows.

    Component 1: Solar self-consumption (battery-delivered energy × import tariff,
                 less export compensation and feed-in costs)
    Component 2: Optional day-ahead EPEX value, only when the request confirms
                 compatible trading control; it shares the annual cycle budget.
    Component 3: Escalatie            (CBS 5%/jr, 10-jaar horizon, factor 1.3207) — informatief
    Component 4: Salderings-bescherming (export-shift × prijsverschil × 0.75) — informatief

    Market value is not counted by default. When enabled, it remains an
    estimate, shares the cycle budget with solar shifting, and is not a
    guaranteed market return or balancing-market payout.
    """

    PV = max(zonneproductie, 0.0)
    V  = max(jaarverbruik,   0.0)
    T  = clamp(teruglevering, 0.0, PV * 0.97)

    BATT_EFF  = 0.95
    USABLE_CAPACITY_FRAC = 0.95  # explicit assumption; confirm against the selected HYXi datasheet
    SOLAR_BASE_EQUIVALENT_CYCLES = 350.0
    MAX_EQUIVALENT_CYCLES_PER_YEAR = 380.0
    MAX_EQUIVALENT_CYCLES_PER_DAY = MAX_EQUIVALENT_CYCLES_PER_YEAR / 365.0

    # Market-spread values are model assumptions, not verified HYXiPower
    # payouts. Keep them out of the customer result unless compatible trading
    # control is explicitly confirmed.
    SPREAD_FACTOR_LOW  = 0.60
    SPREAD_FACTOR_HIGH = 0.72

    spread_low  = max(0.10, pE * SPREAD_FACTOR_LOW)
    spread_high = max(0.18, pE * SPREAD_FACTOR_HIGH)

    if dynamic_contract:
        spread_low  *= 1.22
        spread_high *= 1.28

    # Escalatie-factor (CBS 5%/jr gemiddelde, 10-jaar horizon)
    ESCALATION_RATE   = 0.05
    HORIZON           = 10
    _r, _n            = ESCALATION_RATE, HORIZON
    escalation_factor = (1 + _r) * ((1 + _r) ** _n - 1) / (_n * _r)

    # Salderingsafbouw 2027–2031: 10-jaar gemiddelde factor = 0.75
    SALD_AVG_FACTOR = 0.75

    # ================================================================
    # STAP 1 — SITUATIE ZONDER BATTERIJ  (sluitende energiebalans)
    #
    # Direct zelfverbruik is een schatting van zon die gelijktijdig met de vraag
    # wordt gebruikt. Zonder exportinvoer gebruiken we 45% van de jaarvraag.
    # Met exportinvoer rekenen we opwek minus export, begrensd door opwek en vraag.
    # Beide energiebalansen blijven sluitend:
    #     opwek    = direct zelfverbruik + export
    #     verbruik = direct zelfverbruik + netinkoop
    #     export   − netinkoop = opwek − verbruik
    # ================================================================
    DAYTIME_LOAD_FRAC = 0.45       # standaard overlap met verbruik overdag
    sc_overlap_cap = min(PV, V)
    sc_direct_realistic = min(PV, DAYTIME_LOAD_FRAC * V)

    # Positieve export uit de jaarrekening stuurt de berekening: direct gebruik
    # = opwek − export, begrensd door opwek en totaal verbruik. Zonder exportinvoer
    # gebruiken we de overlap-aanname (45% van de jaarvraag).
    # Zo sluiten beide energiebalansen nog steeds:
    # opwek = direct gebruik + teruglevering; verbruik = direct gebruik + netinkoop.
    if T > 0.0:
        sc_direct_kwh = clamp(PV - T, 0.0, sc_overlap_cap)
    else:
        sc_direct_kwh = clamp(sc_direct_realistic, 0.0, sc_overlap_cap)

    grid_import_without = max(0.0, V - sc_direct_kwh)
    export_kwh_zonder = max(T, PV - sc_direct_kwh) if T > 0.0 else max(0.0, PV - sc_direct_kwh)
    export_input_adjusted = T > 0.0 and export_kwh_zonder > T + 0.5
    sc_pct_zonder       = sc_direct_kwh / PV * 100.0 if PV > 0 else 0.0

    # "kWh" means a linear charge on each exported kWh. "jaar" is a fixed
    # annual contract cost: it does not fall merely because export falls.
    if terugleverkosten_unit == "kWh":
        tk_jaar = terugleverkosten_value * export_kwh_zonder
    else:
        tk_jaar = terugleverkosten_value
    # Een vergoeding is de primaire bron zodra expliciet meegestuurd (ook 0).
    # Oudere clients die het veld weglaten blijven de legacy pT gebruiken.
    if terugleververgoeding_value is not None:
        if terugleververgoeding_unit == "jaar":
            tv_jaar = terugleververgoeding_value
        else:
            tv_jaar = terugleververgoeding_value * export_kwh_zonder
    else:
        tv_jaar = pT * export_kwh_zonder

    # Houd een effectieve €/kWh-waarde voor bestaande rapportagevelden en
    # salderingsberekening. Bij een jaarvergoeding is dit de baseline-opbrengst
    # gedeeld door de baseline-export; de jaarvergoeding blijft leidend.
    effective_pT = tv_jaar / export_kwh_zonder if export_kwh_zonder > 0 else 0.0

    grid_cost_without       = grid_import_without * pE
    export_revenue_without  = tv_jaar
    net_annual_cost_without = grid_cost_without - export_revenue_without + tk_jaar

    # ================================================================
    # STAP 2 — ZONNE-OPSLAG NAAR DE WONING
    # Jaarcijfers bevatten geen uur-/kwartierdata. Verdeel daarom export en
    # netafname over een transparant seizoensprofiel en reken per dag met de
    # gemiddelde daghoeveelheid. Dagelijkse thuislevering kan nooit hoger zijn
    # dan de beschikbare zonne-export, resterende netvraag, bruikbare capaciteit
    # of één equivalente laadcyclus. Zo kan een grotere batterij meer leveren
    # wanneer de kleinere opslag op een zonnige dag vol zou zitten, maar niet
    # wanneer aanbod of resterende huishoudvraag de beperkende factor is.
    # ================================================================
    PV_MONTH_SHARES = (0.025, 0.040, 0.080, 0.115, 0.140, 0.145, 0.140, 0.120, 0.090, 0.055, 0.030, 0.020)
    IMPORT_MONTH_SHARES = (0.090, 0.085, 0.085, 0.080, 0.080, 0.075, 0.075, 0.075, 0.075, 0.085, 0.090, 0.105)
    DAYS_PER_MONTH = (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
    usable_capacity_kwh = bat_kWh * USABLE_CAPACITY_FRAC
    cycle_budget_kwh = usable_capacity_kwh * MAX_EQUIVALENT_CYCLES_PER_DAY * 365.0 * BATT_EFF
    battery_charge = 0.0
    battery_used = 0.0
    for pv_share, import_share, days in zip(PV_MONTH_SHARES, IMPORT_MONTH_SHARES, DAYS_PER_MONTH):
        daily_surplus = export_kwh_zonder * pv_share / days
        daily_import = grid_import_without * import_share / days
        daily_capacity_output = (
            usable_capacity_kwh
            * min(1.0, MAX_EQUIVALENT_CYCLES_PER_DAY)
            * BATT_EFF
        )
        daily_output = max(
            0.0,
            min(daily_surplus * BATT_EFF, daily_import, daily_capacity_output),
        )
        battery_used += daily_output * days
        battery_charge += daily_output / BATT_EFF * days
    solar_base_budget_kwh = usable_capacity_kwh * SOLAR_BASE_EQUIVALENT_CYCLES * BATT_EFF
    battery_charge = min(battery_charge, export_kwh_zonder, solar_base_budget_kwh / BATT_EFF)
    battery_used = battery_charge * BATT_EFF
    solar_cycli = battery_charge / max(usable_capacity_kwh, 1.0)

    grid_import_with = max(0.0, grid_import_without - battery_used)
    export_kwh_with  = max(0.0, export_kwh_zonder - battery_charge)
    sc_battery_kwh   = battery_used
    sc_total_kwh     = sc_direct_kwh + sc_battery_kwh

    # Do not impose a capacity-based self-consumption percentage ceiling.
    # The percentage must be derived from the physical annual energy flows,
    # not forced into a 92–96% band based on battery size.
    sc_pct_met = clamp(sc_total_kwh / PV * 100.0, 0.0, 100.0) if PV > 0 else 0.0

    # ================================================================
    # STAP 3 — ZELFCONSUMPTIE-BESPARING (correcte fysica, geen dubbeloptelling)
    #
    # Batterij verlaagt ZOWEL netimport ALS zonne-export tegelijkertijd.
    # Interactie-effect: één kWh-blok wordt verschoven van lage exportprijs
    # naar hoge zelfverbruikwaarde. De twee componenten zijn hetzelfde kWh-blok:
    #
    #   Besparing = battery_used × pE  (vermeden netimport tegen inkooprijs)
    #   Kost      = lost_tv (gemiste geselecteerde vergoeding, geen tweede pT)
    #   Netto     = besparing − kost    (roundtrip-verlies is impliciet: used < charge)
    #
    # Uitgesplitst voor transparantie (maar niet dubbel opgeteld):
    #   Vermeden import:  battery_used × pE
    #   Gemiste exportvergoeding: lost_tv (aftrekpost)
    #   Roundtrip-verlies = battery_charge × (1−BATT_EFF) kWh → impliciet in het verschil
    # ================================================================
    grid_besparing_kwh  = max(0.0, grid_import_without - grid_import_with)
    export_shift_kwh_   = max(0.0, export_kwh_zonder - export_kwh_with)

    # Terugleverkosten / terugleververgoeding aanpassing
    shift_ratio = clamp(battery_charge / max(export_kwh_zonder, 1.0), 0.0, 1.0)
    saved_tk = tk_jaar * shift_ratio if terugleverkosten_unit == "kWh" else 0.0
    tk_na = max(0.0, tk_jaar - saved_tk)
    lost_tv     = tv_jaar * shift_ratio

    # Netto zelfconsumptie-besparing — correcte tweetermige formule
    export_loss_eur = lost_tv  # gemiste gekozen vergoeding (legacy pT óf expliciete vergoeding)
    net_sc_saving = battery_used * pE - lost_tv + saved_tk

    net_energy_saving = net_sc_saving
    grid_besparing_eur = grid_besparing_kwh * pE
    export_revenue_with = max(0.0, tv_jaar - lost_tv)
    grid_cost_with = grid_import_with * pE
    net_annual_cost_with = grid_cost_with - export_revenue_with + tk_na

    # Model day-ahead EPEX arbitrage separately from solar-to-home energy.
    # Total solar + market cycles share the owner-specified 380-cycle ceiling.
    EPEX_RATE_LOW = 0.24
    EPEX_RATE_HIGH = 0.26
    EPEX_VALUE_FACTOR = 0.75  # Apply a 25% reduction to value, not throughput.
    # User-reported 350–380 cycles are the combined annual total, including
    # solar shifting; market trading only uses the remaining cycle allowance.
    EPEX_TOTAL_CYCLES_LOW_TARGET = 350
    EPEX_TOTAL_CYCLES_HIGH_TARGET = MAX_EQUIVALENT_CYCLES_PER_YEAR
    EPEX_MONTHS_PER_YEAR = 12.0
    epex_cycle_budget = max(0.0, MAX_EQUIVALENT_CYCLES_PER_YEAR - solar_cycli)
    epex_cycles_low = 0.0
    epex_cycles_high = 0.0
    epex_throughput_low = 0.0
    epex_throughput_high = 0.0
    epex_throughput = 0.0
    epex_grid_charge = 0.0
    epex_conversion_loss = 0.0
    ems_lo = 0.0
    ems_hi = 0.0
    if dynamic_contract and epex_optimization_supported and bat_kWh > 0:
        epex_cycles_low = min(
            max(0.0, EPEX_TOTAL_CYCLES_LOW_TARGET - solar_cycli),
            epex_cycle_budget,
        )
        epex_cycles_high = min(
            max(0.0, EPEX_TOTAL_CYCLES_HIGH_TARGET - solar_cycli),
            epex_cycle_budget,
        )
        epex_throughput_low = usable_capacity_kwh * epex_cycles_low * BATT_EFF
        epex_throughput_high = usable_capacity_kwh * epex_cycles_high * BATT_EFF
        epex_throughput = (epex_throughput_low + epex_throughput_high) / 2.0
        # EPEX throughput is battery output, not household consumption.
        epex_grid_charge = epex_throughput / BATT_EFF
        epex_conversion_loss = epex_grid_charge - epex_throughput
        # Value annual modeled EPEX throughput directly; monthly figures below
        # are display-only averages and never multiplied back into annual value.
        ems_lo = epex_throughput_low * EPEX_RATE_LOW * EPEX_VALUE_FACTOR
        ems_hi = epex_throughput_high * EPEX_RATE_HIGH * EPEX_VALUE_FACTOR

    # A requested appliance load may use some of the cycles that would otherwise
    # be traded. Allocate the lower/safer EPEX
    # cycle budget to the home first, then value only the remaining cycles as
    # EPEX trade. This prevents one discharge kWh being counted twice.
    epex_potential_low = epex_throughput_low
    epex_potential_high = epex_throughput_high
    epex_home_delivery = min(
        max(0.0, epex_home_use_kwh),
        grid_import_with,
        epex_potential_low,
    )
    epex_home_grid_charge = epex_home_delivery / BATT_EFF if epex_home_delivery > 0 else 0.0
    epex_home_charge_cost = (
        epex_home_grid_charge * max(0.0, battery_cheap_charge_price_eur_per_kwh)
    )
    epex_throughput_low = max(0.0, epex_potential_low - epex_home_delivery)
    epex_throughput_high = max(0.0, epex_potential_high - epex_home_delivery)
    epex_throughput = (epex_throughput_low + epex_throughput_high) / 2.0
    epex_grid_charge = (
        epex_throughput + epex_home_delivery
    ) / BATT_EFF if epex_throughput + epex_home_delivery > 0 else 0.0
    epex_conversion_loss = epex_grid_charge - epex_throughput - epex_home_delivery
    ems_lo = epex_throughput_low * EPEX_RATE_LOW * EPEX_VALUE_FACTOR
    ems_hi = epex_throughput_high * EPEX_RATE_HIGH * EPEX_VALUE_FACTOR

    # Grid-charged energy used at home is priced at the supplied average
    # all-in low-price tariff. Its charging cost is included in the bill;
    # only the remaining cycle throughput earns modeled EPEX trade value.
    household_import_after_storage = max(0.0, grid_import_with - epex_home_delivery)
    # Report actual grid kWh bought for household use plus the energy used to
    # charge the battery for that household use. The cheap-charge portion is
    # costed separately below, not again at the normal import tariff.
    grid_import_with = household_import_after_storage + epex_home_grid_charge
    grid_besparing_kwh = max(0.0, grid_import_without - grid_import_with)
    net_sc_saving = (
        battery_used * pE - lost_tv + saved_tk
        + epex_home_delivery * pE - epex_home_charge_cost
    )
    net_energy_saving = net_sc_saving
    grid_cost_with = household_import_after_storage * pE + epex_home_charge_cost
    net_annual_cost_with = grid_cost_with - export_revenue_with + tk_na
    grid_besparing_eur = max(0.0, grid_cost_without - grid_cost_with)

    # ================================================================
    # STAP 5 — BASISLIJN: zelfconsumptie (stap 1) + EPEX-arbitrage (stap 2)
    # raw = net self-consumption savings + throughput-priced annual EPEX value.
    # Escalatie (stap 3) en saldering (stap 4) worden hieronder apart berekend
    # als INFORMATIEVE prognoses en tellen NIET mee in het jaartotaal.
    # ================================================================
    raw_low  = net_sc_saving + ems_lo
    raw_high = net_sc_saving + ems_hi

    _export_shift      = max(0.0, export_kwh_zonder - export_kwh_with)
    _sald_spread       = max(0.0, pE - effective_pT)
    sald_protection_eur = round(_export_shift * _sald_spread * SALD_AVG_FACTOR)

    escalation_eur_low  = round(raw_low  * (escalation_factor - 1))
    escalation_eur_high = round(raw_high * (escalation_factor - 1))

    # Defensieve normalisatie van de volgorde (laag ≤ hoog).
    if raw_low > raw_high:
        raw_low, raw_high = raw_high, raw_low
        ems_lo, ems_hi = ems_hi, ems_lo
        escalation_eur_low, escalation_eur_high = escalation_eur_high, escalation_eur_low

    ems_display_low  = round(ems_lo, 2)
    ems_display_high = round(ems_hi, 2)

    bill_savings_annual  = net_energy_saving
    bill_savings_monthly = bill_savings_annual / 12.0

    # ================================================================
    # BASISLIJN-TOTAAL = STAP 1 (zelfconsumptie) + STAP 2 (EPEX-arbitrage).
    # Stap 3 (energieprijsstijging) en stap 4 (salderingsbescherming) zijn
    # INFORMATIEVE prognoses: ze worden apart teruggegeven maar NIET opgeteld
    # in total_annual, de terugverdientijd of het netto-resultaat na 10 jaar.
    # ================================================================
    total_annual_low_unrounded = bill_savings_annual + ems_lo
    total_annual_high_unrounded = bill_savings_annual + ems_hi
    total_annual_low  = round(total_annual_low_unrounded, 2)
    total_annual_high = round(total_annual_high_unrounded, 2)

    total_daily_low  = total_annual_low  / 365.0
    total_daily_high = total_annual_high / 365.0

    # ================================================================
    # STAP 6 — TERUGVERDIENTIJD
    # ================================================================
    payback_low  = battery_price / total_annual_high_unrounded if total_annual_high_unrounded > 0 else None
    payback_high = battery_price / total_annual_low_unrounded  if total_annual_low_unrounded > 0 else None

    # ================================================================
    # DISPLAY METRICS
    # ================================================================
    teruglevering_pct_voor = export_kwh_zonder / PV * 100.0 if PV > 0 else 0.0
    teruglevering_pct_na   = export_kwh_with   / PV * 100.0 if PV > 0 else 0.0
    net_voor_pct           = grid_import_without / V * 100.0 if V > 0 else 0.0
    net_na_pct             = grid_import_with    / V * 100.0 if V > 0 else 0.0
    netonafhankelijkheid   = clamp(
        ((net_voor_pct - net_na_pct) / max(net_voor_pct, 1.0)) * 100.0,
        0.0, 100.0
    )

    epex_cycles = (
        (epex_throughput + epex_home_delivery)
        / max(usable_capacity_kwh * BATT_EFF, 1.0)
        if bat_kWh > 0
        else 0.0
    )
    total_cycli = solar_cycli + epex_cycles
    battery_total_throughput = battery_used + epex_home_delivery + epex_throughput
    annual_throughput_budget = cycle_budget_kwh
    battery_utilization_pct = clamp(
        battery_total_throughput / max(annual_throughput_budget, 1.0) * 100.0,
        0.0,
        100.0,
    )
    self_sufficiency_before_pct = clamp(sc_direct_kwh / V * 100.0, 0.0, 100.0) if V > 0 else 0.0
    self_sufficiency_after_pct = clamp(sc_total_kwh / V * 100.0, 0.0, 100.0) if V > 0 else 0.0

    return {
        "smart_daily_low":             round(ems_display_low  / 365.0,   2),
        "smart_daily_high":            round(ems_display_high / 365.0,   2),
        "smart_monthly_low":           round(ems_display_low  / EPEX_MONTHS_PER_YEAR, 2),
        "smart_monthly_high":          round(ems_display_high / EPEX_MONTHS_PER_YEAR, 2),
        "smart_annual_low":            ems_display_low,
        "smart_annual_high":           ems_display_high,
        "bill_savings_annual":         round(bill_savings_annual,         2),
        "bill_savings_monthly":        round(bill_savings_monthly,        2),
        "total_annual_low":            float(total_annual_low),
        "total_annual_high":           float(total_annual_high),
        "total_daily_low":             round(total_daily_low,             2),
        "total_daily_high":            round(total_daily_high,            2),
        "ten_year_net_low_eur":        round(total_annual_low_unrounded * 10 - battery_price, 2),
        "ten_year_net_high_eur":       round(total_annual_high_unrounded * 10 - battery_price, 2),
        "payback_low":                 round(payback_low, 1) if payback_low is not None else None,
        "payback_high":                round(payback_high, 1) if payback_high is not None else None,
        "zelfverbruik_voor":           round(sc_pct_zonder,               1),
        "zelfverbruik_na":             round(sc_pct_met,                  1),
        "netonafhankelijkheid":        round(netonafhankelijkheid,         1),
        "self_sufficiency_before_pct": round(self_sufficiency_before_pct,  2),
        "self_sufficiency_after_pct":  round(self_sufficiency_after_pct,   2),
        "teruglevering_voor":          round(teruglevering_pct_voor,      1),
        "teruglevering_na":            round(teruglevering_pct_na,        1),
        "bat_shift_kwh":               round(sc_battery_kwh,              0),
        "saved_terugleverkosten":      round(saved_tk,                    2),
        "terugleverkosten_jaar":       round(tk_jaar,                     2),
        "lost_terugleververgoeding":   round(lost_tv,                     2),
        "grid_import_without":         round(grid_import_without,         2),
        "grid_cost_without":           round(grid_cost_without,           2),
        "export_revenue_without":      round(export_revenue_without,      2),
        "net_annual_cost_without":     round(net_annual_cost_without,     2),
        "grid_cost_with":              round(grid_cost_with,              2),
        "export_revenue_with":         round(export_revenue_with,         2),
        "net_annual_cost_with":        round(net_annual_cost_with,        2),
        "export_kwh_with":             round(export_kwh_with,             0),
        "sc_direct_kwh":               round(sc_direct_kwh,               2),
        "sc_battery_kwh":              round(sc_battery_kwh,              2),
        "sc_total_kwh":                round(sc_total_kwh,                0),
        "sc_pct_zonder":               round(sc_pct_zonder,               1),
        "sc_pct_met":                  round(sc_pct_met,                  1),
        "grid_import_with":            round(grid_import_with,            2),
        "grid_import_besparing_kwh":   round(grid_besparing_kwh,          0),
        "grid_import_besparing_eur":   round(grid_besparing_eur,          0),
        "export_kwh_zonder":           round(export_kwh_zonder,           0),
        "export_shift_kwh":            round(export_shift_kwh_,           0),
        "export_kwh_entered":          round(T,                            0),
        "export_input_adjusted":       export_input_adjusted,
        "export_revenue_loss_eur":     round(export_loss_eur,             2),
        "battery_charge_kwh":          round(battery_charge,              0),
        "shift_pct":                   round(shift_ratio * 100.0,         0),
        "battery_arbitrage_eur":       round((ems_lo + ems_hi) / 2,       0),
        "net_energy_saving_eur":       round(net_energy_saving,           2),
        "pE_used":                     round(pE,                          4),
        "pT_used":                     round(effective_pT,                 4),
        "pv_input":                    round(PV,                          0),
        "v_input":                     round(V,                           0),
        "t_input":                     round(export_kwh_zonder,           0),
        "batterySelfConsumption":      round(sc_battery_kwh,              0),
        "totalSelfConsumption":        round(sc_total_kwh,                0),
        "ems_solar_cycles":            round(solar_cycli,                 0),
        "ems_total_cycles":            round(total_cycli,                 1),
        "ems_cycli":                   round(epex_cycles,                 1),
        "epex_throughput_kwh":         round(epex_throughput,              2),
        "epex_throughput_low_kwh":     round(epex_throughput_low,          2),
        "epex_throughput_high_kwh":    round(epex_throughput_high,         2),
        "battery_throughput_kwh":      round(battery_total_throughput,     2),
        "solar_battery_charge_kwh":    round(battery_charge,              2),
        "solar_battery_loss_kwh":      round(max(0.0, battery_charge - battery_used), 2),
        "epex_grid_charge_kwh":        round(epex_grid_charge,             2),
        "epex_home_charge_kwh":        round(epex_home_grid_charge,        2),
        "epex_conversion_loss_kwh":    round(epex_conversion_loss,         2),
        "battery_total_charge_kwh":   round(battery_charge + epex_grid_charge, 2),
        "battery_total_loss_kwh":     round(max(0.0, battery_charge - battery_used) + epex_conversion_loss, 2),
        "battery_usable_capacity_kwh": round(usable_capacity_kwh, 2),
        "battery_potential_discharge_low_kwh": round(
            usable_capacity_kwh * SOLAR_BASE_EQUIVALENT_CYCLES * BATT_EFF, 2
        ),
        "battery_potential_discharge_high_kwh": round(
            usable_capacity_kwh * MAX_EQUIVALENT_CYCLES_PER_YEAR * BATT_EFF, 2
        ),
        "battery_actual_discharge_kwh": round(battery_total_throughput, 2),
        "battery_home_delivery_kwh": round(sc_battery_kwh + epex_home_delivery, 2),
        "battery_trading_discharge_kwh": round(epex_throughput, 2),
        "epex_home_delivery_kwh": round(epex_home_delivery, 2),
        "epex_home_charge_cost_eur": round(epex_home_charge_cost, 2),
        "battery_cheap_charge_price_eur_per_kwh": round(
            max(0.0, battery_cheap_charge_price_eur_per_kwh), 4
        ),
        "battery_unused_potential_low_kwh": round(max(
            0.0, usable_capacity_kwh * SOLAR_BASE_EQUIVALENT_CYCLES * BATT_EFF - battery_total_throughput
        ), 2),
        "battery_unused_potential_high_kwh": round(max(
            0.0, usable_capacity_kwh * MAX_EQUIVALENT_CYCLES_PER_YEAR * BATT_EFF - battery_total_throughput
        ), 2),
        "battery_capacity_assumption": "95% usable-capacity assumption; verify against the selected HYXiPower datasheet",
        "battery_max_cycles_per_day":  MAX_EQUIVALENT_CYCLES_PER_DAY,
        "solar_equivalent_cycles":     round(solar_cycli, 2),
        "epex_equivalent_cycles_low":  round(epex_cycles_low, 2),
        "epex_equivalent_cycles_high": round(epex_cycles_high, 2),
        "battery_cycle_limit_per_year": MAX_EQUIVALENT_CYCLES_PER_YEAR,
        "terugleverkosten_na":        round(tk_na,                        2),
        "battery_utilization_pct":     round(battery_utilization_pct,      1),
        "spread_low":                  round(spread_low,                  2),
        "spread_high":                 round(spread_high,                 2),
        "dynamic_contract":            dynamic_contract,
        "epex_optimization_supported": epex_optimization_supported,
        "escalation_eur_low":          float(escalation_eur_low),
        "escalation_eur_high":         float(escalation_eur_high),
        # Saldering-law effects are not part of ROI until a sourced post-2027
        # tariff profile is available; do not turn a guessed factor into euros.
        "sald_protection_eur":         None,
        "garantie_bonus":              0.0,
        "ems_physics_low":             round(ems_lo,                      0),
        "ems_physics_high":            round(ems_hi,                      0),
        "net_voor_pct":                round(clamp(net_voor_pct, 0.0, 100.0), 1),
        "net_na_pct":                  round(clamp(net_na_pct,   0.0, 100.0), 1),
    }


@api_router.get("/")
async def root():
    return {"message": "SolarFast API - HYXiPower Calculator"}


def _calculate_for_battery(input_data: CalculationInput, battery_kwh: float, price: float) -> dict:
    return calculate_battery_savings(
        zonneproductie=input_data.zonneproductie,
        jaarverbruik=input_data.jaarverbruik,
        teruglevering=input_data.teruglevering,
        pE=input_data.prijsInkoop,
        pT=input_data.prijsTeruglevering,
        bat_kWh=battery_kwh,
        battery_price=price,
        terugleververgoeding_value=input_data.terugleververgoeding_value,
        terugleververgoeding_unit=input_data.terugleververgoeding_unit or "kWh",
        terugleverkosten_value=input_data.terugleverkosten_value or 0,
        terugleverkosten_unit=input_data.terugleverkosten_unit or "jaar",
        dynamic_contract=input_data.dynamic_contract or False,
        epex_optimization_supported=input_data.epex_optimization_supported,
        epex_home_use_kwh=input_data.epex_home_use_kwh,
        battery_cheap_charge_price_eur_per_kwh=input_data.battery_cheap_charge_price_eur_per_kwh,
    )


def rank_battery_candidates(input_data: CalculationInput, candidates: List[BatteryCandidate]) -> list:
    # Battery recommendations model the planned dynamic tariff. The selected
    # contract is the household's current state; EPEX remains opt-in and must
    # be confirmed by the caller for the selected hardware/EMS and contract.
    battery_updates = {
        "dynamic_contract": True,
    }
    if not input_data.dynamic_contract:
        battery_updates["terugleverkosten_value"] = 0.0
    battery_input = input_data.model_copy(update=battery_updates)
    current_baseline = _calculate_for_battery(input_data, 0.0, 0.0)
    ranked = []
    for candidate in candidates:
        result = _calculate_for_battery(
            battery_input, candidate.battery_kWh, candidate.battery_price
        )
        if (
            "net_annual_cost_without" in current_baseline
            and "net_annual_cost_with" in result
            and "smart_annual_low" in result
            and "smart_annual_high" in result
        ):
            bill_savings = current_baseline["net_annual_cost_without"] - result["net_annual_cost_with"]
            annual_mid = bill_savings + (
                result["smart_annual_low"] + result["smart_annual_high"]
            ) / 2
        else:
            # Keep isolated ranking tests and legacy model adapters compatible.
            annual_mid = (result["total_annual_low"] + result["total_annual_high"]) / 2
        roi_pct = annual_mid / candidate.battery_price * 100 if candidate.battery_price > 0 else float("-inf")
        payback = candidate.battery_price / annual_mid if annual_mid > 0 else None
        ranked.append({
            "product_id": candidate.product_id,
            "battery_kWh": candidate.battery_kWh,
            "battery_price": candidate.battery_price,
            "annual_savings_mid_eur": round(annual_mid, 1),
            "roi_pct": round(roi_pct, 2) if math.isfinite(roi_pct) else None,
            "payback_years": round(payback, 2) if payback is not None else None,
            "utilization_pct": result["battery_utilization_pct"],
            "self_sufficiency_after_pct": result["self_sufficiency_after_pct"],
            "annual_mid_unrounded": annual_mid,
        })

    for row in ranked:
        # Compare an upgrade with the nearest lower-capacity, lower-price option.
        # If no such option exists (base size or an unusual catalog price), use
        # its own ROI/payback rather than inventing an incremental investment.
        smaller_options = [
            option for option in ranked
            if option["battery_kWh"] < row["battery_kWh"]
            and option["battery_price"] < row["battery_price"]
        ]
        comparator = max(
            smaller_options,
            key=lambda option: (
                option["battery_kWh"],
                option["roi_pct"] if option["roi_pct"] is not None else float("-inf"),
                -option["battery_price"],
            ),
            default=None,
        )
        if comparator is None:
            incremental_investment = row["battery_price"]
            incremental_annual = row["annual_mid_unrounded"]
            incremental_roi = row["roi_pct"]
            incremental_payback = row["payback_years"]
            comparison_product_id = None
        else:
            incremental_investment = row["battery_price"] - comparator["battery_price"]
            incremental_annual = row["annual_mid_unrounded"] - comparator["annual_mid_unrounded"]
            incremental_roi = (
                incremental_annual / incremental_investment * 100
                if incremental_investment > 0
                else None
            )
            incremental_payback = (
                incremental_investment / incremental_annual
                if incremental_annual > 0
                else None
            )
            comparison_product_id = comparator["product_id"]
        row.update({
            "incremental_investment_eur": round(incremental_investment, 1),
            "incremental_annual_savings_eur": round(incremental_annual, 1),
            "incremental_roi_pct": (
                round(incremental_roi, 2)
                if incremental_roi is not None and math.isfinite(incremental_roi)
                else None
            ),
            "incremental_payback_years": (
                round(incremental_payback, 2)
                if incremental_payback is not None and math.isfinite(incremental_payback)
                else None
            ),
            "comparison_product_id": comparison_product_id,
            # Use the calculator's existing 10-year comparison window as a
            # long-term value tiebreaker; it is not a product-life guarantee.
            "ten_year_net_value_eur": round(
                row["annual_mid_unrounded"] * 10 - row["battery_price"], 1
            ),
        })

    ranked.sort(key=lambda row: (
        -(row["incremental_roi_pct"] if row["incremental_roi_pct"] is not None else float("-inf")),
        row["incremental_payback_years"] if row["incremental_payback_years"] is not None else float("inf"),
        -row["utilization_pct"],
        -row["ten_year_net_value_eur"],
        -(row["roi_pct"] if row["roi_pct"] is not None else float("-inf")),
        -row["self_sufficiency_after_pct"],
        row["battery_price"],
    ))
    positive = next((
        row for row in ranked
        if (row["incremental_roi_pct"] or 0) > 0
    ), None)

    independence_baseline = _calculate_for_battery(battery_input, 0, 0)["self_sufficiency_before_pct"]
    independence_candidate = max(
        ranked,
        key=lambda row: (
            row["self_sufficiency_after_pct"],
            -row["battery_kWh"],
            -row["battery_price"],
        ),
        default=None,
    )
    if (
        independence_candidate is not None
        and independence_candidate["self_sufficiency_after_pct"] > independence_baseline + 0.05
    ):
        independence_candidate["more_independent"] = True

    maximum_sufficiency_gain = max(
        (
            row["self_sufficiency_after_pct"] - independence_baseline
            for row in ranked
        ),
        default=0.0,
    )
    balanced_fit_candidate = None
    if maximum_sufficiency_gain >= 0.1:
        balanced_target = independence_baseline + maximum_sufficiency_gain * 0.9
        balanced_fit_candidate = min(
            (
                row for row in ranked
                if row["self_sufficiency_after_pct"] >= balanced_target
            ),
            key=lambda row: (
                row["battery_kWh"],
                row["battery_price"],
                -(
                    row["incremental_roi_pct"]
                    if row["incremental_roi_pct"] is not None
                    else float("-inf")
                ),
            ),
            default=None,
        )
    if balanced_fit_candidate is not None:
        balanced_fit_candidate["balanced_fit"] = True
        balanced_fit_candidate["balanced_fit_target_self_sufficiency_pct"] = round(
            balanced_target, 1
        )
        balanced_fit_candidate["balanced_fit_max_gain_pct"] = round(
            maximum_sufficiency_gain, 1
        )

    maximum_storage_candidate = max(
        ranked,
        key=lambda row: (
            row["battery_kWh"],
            -row["battery_price"],
            row["incremental_roi_pct"] if row["incremental_roi_pct"] is not None else float("-inf"),
        ),
        default=None,
    )
    if maximum_storage_candidate is not None:
        maximum_storage_candidate["maximum_storage"] = True

    for rank, row in enumerate(ranked, start=1):
        row["rank"] = rank
        row["recommended"] = row is positive
        row.setdefault("more_independent", False)
        row.setdefault("balanced_fit", False)
        row.setdefault("maximum_storage", False)
        row.pop("annual_mid_unrounded", None)
    return ranked


@api_router.post("/recommend-batteries")
async def recommend_batteries(request: BatteryRecommendationInput):
    return {"recommendations": rank_battery_candidates(request.calculation, request.candidates)}


@api_router.post("/calculate", response_model=CalculationResult)
async def calculate(input_data: CalculationInput):
    current_dynamic_contract = bool(input_data.dynamic_contract)
    switching_from_fixed = input_data.battery_kWh > 0 and not current_dynamic_contract
    fixed_results = None
    if switching_from_fixed:
        fixed_results = _calculate_for_battery(
            input_data,
            input_data.battery_kWh,
            input_data.battery_price,
        )

    battery_updates = {
        "dynamic_contract": True if input_data.battery_kWh > 0 else current_dynamic_contract,
    }
    if switching_from_fixed:
        # The entered fee belongs to the customer's current fixed contract.
        # Do not carry it into the modeled dynamic contract as if it still applied.
        battery_updates["terugleverkosten_value"] = 0.0
    battery_input = input_data.model_copy(update=battery_updates)
    results = _calculate_for_battery(
        battery_input,
        input_data.battery_kWh,
        input_data.battery_price,
    )
    results["current_dynamic_contract"] = current_dynamic_contract
    results["current_fixed_feed_in_cost_removed"] = switching_from_fixed

    if switching_from_fixed:
        fixed_baseline = _calculate_for_battery(input_data, 0.0, 0.0)
        current_bill = fixed_baseline["net_annual_cost_without"]
        dynamic_bill = results["net_annual_cost_with"]
        bill_savings = current_bill - dynamic_bill
        total_low = bill_savings + results["smart_annual_low"]
        total_high = bill_savings + results["smart_annual_high"]
        current_feed_in_cost = fixed_baseline["terugleverkosten_jaar"]
        remaining_dynamic_fee = results["terugleverkosten_na"]
        results.update({
            # The "before" side is the actual current fixed contract. The
            # "after" side is the modeled dynamic contract with its old fee removed.
            "net_annual_cost_without": current_bill,
            "grid_cost_without": fixed_baseline["grid_cost_without"],
            "export_revenue_without": fixed_baseline["export_revenue_without"],
            "terugleverkosten_jaar": current_feed_in_cost,
            "saved_terugleverkosten": max(0.0, current_feed_in_cost - remaining_dynamic_fee),
            "bill_savings_annual": round(bill_savings, 2),
            "bill_savings_monthly": round(bill_savings / 12.0, 2),
            "net_energy_saving_eur": round(bill_savings, 2),
            "total_annual_low": round(total_low, 2),
            "total_annual_high": round(total_high, 2),
            "total_daily_low": round(total_low / 365.0, 2),
            "total_daily_high": round(total_high / 365.0, 2),
            "ten_year_net_low_eur": round(total_low * 10.0 - input_data.battery_price, 2),
            "ten_year_net_high_eur": round(total_high * 10.0 - input_data.battery_price, 2),
            "payback_low": round(input_data.battery_price / total_high, 1) if total_high > 0 else None,
            "payback_high": round(input_data.battery_price / total_low, 1) if total_low > 0 else None,
        })
        switch_low = results["total_annual_low"] - fixed_results["total_annual_low"]
        switch_high = results["total_annual_high"] - fixed_results["total_annual_high"]
        results.update({
            "switch_to_dynamic_annual_low": round(switch_low, 2),
            "switch_to_dynamic_annual_high": round(switch_high, 2),
            "switch_to_dynamic_monthly_low": round(switch_low / 12.0, 2),
            "switch_to_dynamic_monthly_high": round(switch_high / 12.0, 2),
        })

    return CalculationResult(**results)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DIST_DIR = os.path.join(os.path.dirname(__file__), "../frontend/dist")

if os.path.isdir(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path:
            candidate = os.path.join(DIST_DIR, full_path)
            if os.path.isfile(candidate):
                return FileResponse(candidate)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
