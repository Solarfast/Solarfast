# VOLTRAX batterijbesparingscalculator — volledige formule

Dit document beschrijft de huidige backend-berekening stap voor stap. De
formules hieronder zijn bedoeld om het model buiten de website opnieuw te
gebruiken.

## 0. Invoer

| Variabele | Betekenis | Eenheid |
|---|---|---:|
| `zonneproductie` | jaarlijkse zonne-opwek | kWh/jaar |
| `jaarverbruik` | jaarlijks totaal elektriciteitsverbruik | kWh/jaar |
| `teruglevering` | door de gebruiker gemeten jaarlijkse teruglevering | kWh/jaar |
| `pE` | prijs voor inkoop van het net | €/kWh |
| `pT` | waarde/prijs van teruggeleverde elektriciteit | €/kWh |
| `battery_kWh` | nominale batterijcapaciteit | kWh |
| `battery_price` | totale investering inclusief installatie en btw | € |
| `terugleververgoeding_value` | vergoeding voor teruglevering, per kWh of per jaar | € |
| `terugleververgoeding_unit` | `"kWh"` of `"jaar"` | — |
| `terugleverkosten_value` | terugleverkosten, per kWh of per jaar | € |
| `terugleverkosten_unit` | `"kWh"` of `"jaar"` | — |
| `dynamic_contract` | of een dynamisch contract actief is | boolean |

### Normalisatie van invoer

```text
PV = max(zonneproductie, 1.0)
V  = max(jaarverbruik, 1.0)
T  = clamp(teruglevering, 0.0, PV × 0.97)
```

De functie `clamp(x, minimum, maximum)` is:

```text
clamp(x, minimum, maximum) = max(minimum, min(maximum, x))
```

De gebruikte vaste parameters zijn:

```text
BATT_EFF          = 0.95     # roundtrip-rendement
SOLAR_MAX         = 200      # maximaal gemodelleerde zonne-opslagcycli per jaar
EPEX_CYCLES_LOW   = 300      # jaarlijkse extra EPEX-cycli bij een dynamisch contract
EPEX_CYCLES_HIGH  = 360
EPEX_RATE_LOW     = 0.24     # gemodelleerde EPEX-waarde per ontladen kWh
EPEX_RATE_HIGH    = 0.26
EPEX_VALUE_FACTOR = 0.75     # EPEX-geldwaarde 25% lager; fysieke doorvoer blijft gelijk
DAYTIME_LOAD_FRAC = 0.45     # aandeel van verbruik dat met zon overlapt
RESIDUAL_FRAC     = 0.15     # minimaal aandeel oorspronkelijke netinkoop dat blijft
SALD_AVG_FACTOR   = 0.75     # gemiddelde factor voor salderingsbescherming
ESCALATION_RATE   = 0.05     # informatieve jaarlijkse prijsstijging
HORIZON           = 10       # informatieve prognosehorizon in jaren
```

> `pE` en `pT` worden door de calculator uit de invoer gehaald. Als de
> frontend geen inkoopprijs meestuurt, is de frontend-default `pE = 0.28`.
> Als de frontend geen terugleverprijs meestuurt, is de default `pT = 0.07`.

---

## Stap 1 — huidige situatie zonder batterij

### 1.1 Direct zelfverbruik

Eerst wordt bepaald hoeveel zonne-energie direct op het moment van opwek in
de woning wordt gebruikt.

```text
sc_overlap_cap      = min(PV, V)
sc_direct_realistic = min(PV, DAYTIME_LOAD_FRAC × V)
```

De gemeten teruglevering `T` is leidend als de gebruiker een waarde groter dan
nul heeft ingevuld:

```text
als T > 0:
    sc_direct_kwh = clamp(PV − T, 0, sc_overlap_cap)
anders:
    sc_direct_kwh = clamp(sc_direct_realistic, 0, sc_overlap_cap)
```

Daaruit volgt de sluitende energiebalans:

```text
grid_import_without = max(0, V − sc_direct_kwh)
export_kwh_zonder    = max(0, PV − sc_direct_kwh)
sc_pct_zonder        = 100 × sc_direct_kwh / PV
```

De balans sluit altijd:

```text
PV = sc_direct_kwh + export_kwh_zonder
V  = sc_direct_kwh + grid_import_without
```

Daarom geldt ook:

```text
export_kwh_zonder − grid_import_without = PV − V
```

### 1.2 Terugleverkosten en terugleververgoeding

De ingevoerde terugleverkosten zijn de actuele kosten van de leverancier en
worden zowel bij vaste als dynamische contracten meegenomen. Bij dynamische
batterijoptimalisatie wordt dezezelfde jaarbasis gebruikt voor de 90% besparing.

De jaarlijkse bedragen zijn:

```text
als terugleverkosten_unit = "kWh":
    tk_jaar = terugleverkosten_value × export_kwh_zonder
anders:
    tk_jaar = terugleverkosten_value
```

```text
als terugleververgoeding_unit = "kWh":
    tv_jaar = terugleververgoeding_value × export_kwh_zonder
anders:
    tv_jaar = terugleververgoeding_value
```

De jaarlijkse kosten zonder batterij zijn:

```text
grid_cost_without       = grid_import_without × pE
export_revenue_without  = tv_jaar
net_annual_cost_without =
    grid_cost_without
    − export_revenue_without
    + tk_jaar
```

---

## Stap 2 — energieflow met batterij

De batterij gebruikt eerst het beschikbare zonnestroomoverschot en levert die
energie later terug om netinkoop te vermijden.

### 2.1 Maximale batterij-doorzet

```text
battery_throughput = battery_kWh × SOLAR_MAX × BATT_EFF
max_shiftable      = grid_import_without × (1 − RESIDUAL_FRAC)
```

De werkelijk door de batterij geleverde energie is de kleinste van drie
grenzen:

```text
battery_used = max(
    0,
    min(
        battery_throughput,
        max_shiftable,
        export_kwh_zonder × BATT_EFF
    )
)
```

`battery_used` is de energie die daadwerkelijk uit de batterij komt en in de
woning wordt gebruikt. De benodigde laadenergie is:

```text
battery_charge = min(
    battery_used / BATT_EFF,
    export_kwh_zonder
)
```

Daarna wordt `battery_used` opnieuw op rendement gebaseerd:

```text
battery_used = battery_charge × BATT_EFF
```

Het aantal zonne-laadcycli voor weergave is:

```text
solar_cycli = clamp(
    battery_charge / max(battery_kWh, 1.0),
    0,
    SOLAR_MAX
)
```

### 2.2 Situatie met batterij

```text
grid_import_with = max(
    0,
    grid_import_without − battery_used
)

export_kwh_with = max(
    0,
    export_kwh_zonder − battery_charge
)

sc_battery_kwh = battery_used
sc_total_kwh   = sc_direct_kwh + sc_battery_kwh
```

### 2.3 Maximale zelfconsumptie-cap

De maximale zelfconsumptie wordt afhankelijk van de batterijgrootte begrensd:

```text
SC_MAX = clamp(
    92 + (battery_kWh / 9.3) × 0.5,
    92,
    96
)

sc_cap_kwh = min(
    PV × SC_MAX / 100,
    V
)
```

Als de voorlopige totale zelfconsumptie boven deze cap uitkomt:

```text
als sc_total_kwh > sc_cap_kwh:
    sc_total_kwh   = max(sc_direct_kwh, sc_cap_kwh)
    sc_battery_kwh = max(0, sc_total_kwh − sc_direct_kwh)
    battery_used   = sc_battery_kwh
    battery_charge = min(
        export_kwh_zonder,
        battery_used / BATT_EFF
    )
    grid_import_with = max(
        0,
        grid_import_without − battery_used
    )
    export_kwh_with = max(
        0,
        export_kwh_zonder − battery_charge
    )
```

De zelfconsumptie na plaatsing van de batterij:

```text
sc_pct_met = clamp(
    100 × sc_total_kwh / PV,
    0,
    100
)
```

---

## Stap 3 — financiële waarde van extra zelfconsumptie

De batterij verlaagt de netinkoop, maar veroorzaakt ook minder exportopbrengst.
Die twee effecten horen bij hetzelfde verschoven kWh-blok en mogen niet
dubbel worden opgeteld.

### 3.1 Verschoven energie

```text
grid_besparing_kwh = max(
    0,
    grid_import_without − grid_import_with
)

export_shift_kwh = max(
    0,
    export_kwh_zonder − export_kwh_with
)
```

Het aandeel van de oorspronkelijke export dat wordt verschoven:

```text
shift_ratio = clamp(
    battery_charge / max(export_kwh_zonder, 1.0),
    0,
    1
)
```

### 3.2 Vermeden terugleverkosten en gemiste vergoeding

```text
als dynamic_contract = waar en battery_kWh > 0:
    saved_tk = tk_jaar × 0.90
anders:
    saved_tk = tk_jaar × shift_ratio

lost_tv = tv_jaar × shift_ratio
```

Daarom blijven in het dynamisch geoptimaliseerde batterijschema 10% van de
oorspronkelijke terugleverkosten over:

```text
terugleverkosten_met_batterij = tk_jaar − saved_tk
                             = tk_jaar × 0.10
```

### 3.3 Netto jaarlijkse energiebesparing

```text
export_loss_eur = lost_tv

net_sc_saving =
    battery_used × pE
    − lost_tv
    + saved_tk
```

Dit is de kernformule voor de besparing op de energiestroom:

```text
net_energy_saving = net_sc_saving
```

De controle op de kosten vóór en na de batterij is:

```text
net_annual_cost_with =
    grid_cost_with
    − export_revenue_with
    + tk_jaar
    − saved_tk

net_annual_cost_without − net_annual_cost_with
    = net_energy_saving
```

De uitkomst mag negatief zijn: een verlieslatende batterij wordt niet op nul
afgekapt. In dat geval is de terugverdientijd niet beschikbaar.

Ter vergelijking: de bruto waarde van alleen vermeden netimport is:

```text
grid_besparing_eur = grid_besparing_kwh × pE
```

`grid_besparing_eur` is een informatieve bruto-waarde. Voor de echte
financiële basislijn moet `net_energy_saving` worden gebruikt, omdat die ook
de gemiste exportopbrengst en de wijziging in terugleverkosten/vergoeding
verwerkt.

---

## Stap 4 — jaarlijkse handel op de energiemarkt (EMS/EPEX)

EPEX is alleen van toepassing op een dynamisch contract. Het model gaat uit van
300–360 extra EPEX-cycli per jaar, naast de zonne-opslagcycli. EPEX-handel wordt
als afzonderlijke energiestroom gemodelleerd; die cyclusruimte wordt dus niet
afgetrokken van zonne-opslag en niet beperkt door resterende huishoudelijke
netinkoop.

```text
epex_throughput_low  = battery_kWh × 300 × BATT_EFF
epex_throughput_high = battery_kWh × 360 × BATT_EFF

ems_annual_low  = epex_throughput_low  × €0.24/kWh × 0.75
ems_annual_high = epex_throughput_high × €0.26/kWh × 0.75
```

Een vaste-tariefvergelijking of een batterij zonder capaciteit levert €0 EPEX
op. In de calculator-API wordt een batterijscenario echter altijd op dynamisch
doorgerekend; een vast contract is de huidige situatie en wordt als aparte
vergelijking gebruikt. De 300–360 cycli zijn een modelaanname, geen opbrengst-, markt- of
levensduurgarantie. EPEX-doorvoer en zonne-opslagdoorvoer zijn aparte stromen;
EPEX-opbrengst wordt niet dubbel geboekt als zonnebesparing.
Voor een batterij van 10,6 kWh is de EPEX-bandbreedte met deze aannames circa
€163 per jaar (ongeveer €544–€707/jaar). De bandbreedte groeit mee met de
batterijcapaciteit; dit is geen vaste bovengrens voor elk formaat.

### Contractkeuze en overstapvergelijking in de API

De gekozen contractstatus blijft de huidige situatie (`current_dynamic_contract`).
Zodra een batterij is geselecteerd, wordt het batterijscenario met een dynamisch
contract doorgerekend (`dynamic_contract = true`), ook als de huidige situatie
een vast contract heeft. Bij een huidige vaste contractstatus berekent de API
ook dezelfde batterij op vast tarief als vergelijking:

```text
switch_to_dynamic_annual_low  = dynamic_total_low  − fixed_total_low
switch_to_dynamic_annual_high = dynamic_total_high − fixed_total_high
switch_to_dynamic_monthly_*   = switch_to_dynamic_annual_* / 12
```

Deze overstapbesparing is het verschil tussen twee scenario's met dezelfde
batterij. De dynamische batterij-uitkomst bevat dit voordeel al; tel de
vergelijkingsvelden niet nogmaals op bij het jaarlijkse totaal.

`epex_throughput_low/high` zijn jaarlijkse kWh en worden niet vermenigvuldigd
met 12. Eventuele maand- en dagbedragen zijn alleen weergaven van het jaarbedrag:

```text
ems_monthly = ems_annual / 12
ems_daily = ems_annual / 365
```

De velden `spread_low`, `spread_high` en `ems_cycli` zijn niet de grondslag
voor de geldwaarde. `ems_cycli` toont de middenaanname van 330 EPEX-cycli.

---

## Stap 5 — basislijn en informatieve prognoses

### 5.1 Basislijn totaal

Alleen stap 3 (netto zelfconsumptie) en stap 4 (EMS) tellen mee in het
headline-jaartotaal:

```text
raw_low  = net_sc_saving + ems_annual_low
raw_high = net_sc_saving + ems_annual_high
```

Vervolgens:

```text
ems_display_low  = round(ems_annual_low)
ems_display_high = round(ems_annual_high)

total_annual_low  = round(net_energy_saving) + ems_display_low
total_annual_high = round(net_energy_saving) + ems_display_high
```

De dagelijkse waarden:

```text
total_daily_low  = total_annual_low  / 365
total_daily_high = total_annual_high / 365
```

### 5.2 Informatieve prijsstijging — niet in de basislijn

De 10-jaarsfactor voor een gelijkmatig jaarlijks stijgingspercentage is:

```text
escalation_factor =
    (1 + r) × ((1 + r)^n − 1) / (n × r)
```

Met:

```text
r = 0.05
n = 10
```

geeft dit ongeveer:

```text
escalation_factor ≈ 1.3207
```

De informatieve bedragen zijn:

```text
escalation_eur_low  = round(raw_low  × (escalation_factor − 1))
escalation_eur_high = round(raw_high × (escalation_factor − 1))
```

Deze bedragen worden getoond als prognose, maar worden **niet** toegevoegd aan
`total_annual`, `payback` of het nettoresultaat na 10 jaar.

### 5.3 Informatieve salderingsbescherming — niet in de basislijn

```text
export_shift      = max(0, export_kwh_zonder − export_kwh_with)
sald_spread       = max(0, pE − pT)
sald_protection_eur =
    round(export_shift × sald_spread × SALD_AVG_FACTOR)
```

Ook dit bedrag is informatief en wordt **niet** toegevoegd aan het
headline-jaartotaal of de terugverdientijd.

---

## Stap 6 — terugverdientijd

De lage terugverdientijd gebruikt het hoge jaarlijkse voordeel. De hoge
terugverdientijd gebruikt het lage jaarlijkse voordeel:

```text
als total_annual_high > 0:
    payback_low = battery_price / total_annual_high
anders:
    payback_low = None
```

```text
als total_annual_low > 0:
    payback_high = battery_price / total_annual_low
anders:
    payback_high = None
```

Positieve uitkomsten worden op één decimaal afgerond; er wordt geen maximum
terugverdientijd opgelegd.

De maandelijkse besparing:

```text
bill_savings_annual  = net_energy_saving
bill_savings_monthly = bill_savings_annual / 12
```

---

## Aanvullende weergavemetrics

Deze metrics zijn geen extra financiële waarde; ze beschrijven het energie-
effect van de batterij.

```text
teruglevering_pct_voor = 100 × export_kwh_zonder / PV
teruglevering_pct_na   = 100 × export_kwh_with   / PV

net_voor_pct = 100 × grid_import_without / V
net_na_pct   = 100 × grid_import_with    / V
```

Netonafhankelijkheid:

```text
netonafhankelijkheid = clamp(
    100 × (net_voor_pct − net_na_pct) / max(net_voor_pct, 1.0),
    0,
    95
)
```

---

## Compacte herbruikbare pseudocode

```python
def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def epex_annual_value(throughput_kwh, dynamic_contract):
    if not dynamic_contract:
        return 0.0, 0.0
    throughput_kwh = max(throughput_kwh, 0.0)
    return throughput_kwh * 0.24 * 0.75, throughput_kwh * 0.26 * 0.75


def calculate(
    pv_input,
    annual_consumption,
    export_input,
    import_price,
    export_price,
    battery_kwh,
    battery_price,
    export_compensation=0.0,
    export_compensation_unit="kWh",
    feedin_cost=0.0,
    feedin_cost_unit="jaar",
    dynamic_contract=False,
):
    # Constants
    EFF = 0.95
    SOLAR_MAX = 200
    DAYTIME_LOAD_FRAC = 0.45
    RESIDUAL_FRAC = 0.15

    # Input normalization
    PV = max(pv_input, 1.0)
    V = max(annual_consumption, 1.0)
    T = clamp(export_input, 0.0, PV * 0.97)

    # Step 1: no battery
    overlap_cap = min(PV, V)
    realistic_direct = min(PV, DAYTIME_LOAD_FRAC * V)
    if T > 0.0:
        direct_sc = clamp(PV - T, 0.0, overlap_cap)
    else:
        direct_sc = clamp(realistic_direct, 0.0, overlap_cap)

    grid_without = max(0.0, V - direct_sc)
    export_without = max(0.0, PV - direct_sc)

    effective_feed_in_cost = feedin_cost
    if feedin_cost_unit == "kWh":
        feedin_cost_year = effective_feed_in_cost * export_without
    else:
        feedin_cost_year = feedin_cost

    if export_compensation_unit == "kWh":
        export_compensation_year = (
            export_compensation * export_without
        )
    else:
        export_compensation_year = export_compensation

    # Step 2: battery flow
    throughput = battery_kwh * SOLAR_MAX * EFF
    shiftable = grid_without * (1.0 - RESIDUAL_FRAC)
    battery_used = max(
        0.0,
        min(throughput, shiftable, export_without * EFF),
    )
    battery_charge = min(battery_used / EFF, export_without)
    battery_used = battery_charge * EFF

    grid_with = max(0.0, grid_without - battery_used)
    export_with = max(0.0, export_without - battery_charge)

    direct_plus_battery = direct_sc + battery_used
    sc_max = clamp(92.0 + (battery_kwh / 9.3) * 0.5, 92.0, 96.0)
    sc_cap = min(PV * sc_max / 100.0, V)

    if direct_plus_battery > sc_cap:
        total_sc = max(direct_sc, sc_cap)
        battery_used = max(0.0, total_sc - direct_sc)
        battery_charge = min(export_without, battery_used / EFF)
        grid_with = max(0.0, grid_without - battery_used)
        export_with = max(0.0, export_without - battery_charge)
    else:
        total_sc = direct_plus_battery

    # Step 3: net self-consumption value
    shift_ratio = clamp(
        battery_charge / max(export_without, 1.0),
        0.0,
        1.0,
    )
    saved_feed_in_cost = (
        feedin_cost_year * 0.90
        if dynamic_contract and battery_kwh > 0
        else feedin_cost_year * shift_ratio
    )
    lost_export_compensation = export_compensation_year * shift_ratio

    net_sc_saving = (
        battery_used * import_price
        - lost_export_compensation
        + saved_feed_in_cost
    )

    # Step 4: EPEX (dynamic contracts only; separate from solar shifting)
    epex_throughput_low = epex_throughput_high = 0.0
    if dynamic_contract and battery_kwh > 0:
        epex_throughput_low = battery_kwh * 300 * EFF
        epex_throughput_high = battery_kwh * 360 * EFF
    ems_low = epex_throughput_low * 0.24 * 0.75
    ems_high = epex_throughput_high * 0.26 * 0.75

    # Step 5: baseline
    raw_low = net_sc_saving + ems_low
    raw_high = net_sc_saving + ems_high

    ems_display_low = round(ems_low)
    ems_display_high = round(ems_high)
    total_low = round(net_sc_saving) + ems_display_low
    total_high = round(net_sc_saving) + ems_display_high

    # Step 6: payback
    payback_low = battery_price / total_high if total_high > 0 else None
    payback_high = battery_price / total_low if total_low > 0 else None

    return {
        "annual_energy_saving": round(net_sc_saving),
        "ems_annual_low": ems_display_low,
        "ems_annual_high": ems_display_high,
        "total_annual_low": total_low,
        "total_annual_high": total_high,
        "monthly_energy_saving": round(net_sc_saving / 12.0),
        "payback_low": round(payback_low, 1) if payback_low is not None else None,
        "payback_high": round(payback_high, 1) if payback_high is not None else None,
        "grid_import_without": round(grid_without),
        "grid_import_with": round(grid_with),
        "export_without": round(export_without),
        "export_with": round(export_with),
        "self_consumption_without": round(direct_sc),
        "self_consumption_with": round(total_sc),
    }
```

## Belangrijke implementatieregels

1. Gebruik `net_sc_saving`, niet alleen `grid_besparing_eur`, voor de
   financiële basislijn.
2. Tel `escalation_eur_*` en `sald_protection_eur` niet op bij het
   headline-jaartotaal; dit zijn informatieve prognoses.
3. Rond pas af voor de presentatie, niet tijdens de tussenberekeningen.
4. Houd de energiebalans gesloten:
   `PV = direct zelfverbruik + export` en
   `V = direct zelfverbruik + netinkoop`.
5. De teruglevering die de gebruiker invult is leidend zolang deze fysiek
   mogelijk is. Een exportwaarde wordt begrensd op maximaal `PV × 0.97`.