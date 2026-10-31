import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Info,
  PanelsTopLeft,
  Sun,
  Wind,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import {
  calculateAircoElectricityUse,
  calculateProductSavings,
} from '../../lib/productSavings.js'
import { estimateSolarDirectSelfUse } from '../../lib/solarEstimate.js'
import {
  AIRCO_CAPACITY_GUIDANCE_SOURCE,
  AIRCO_AVERAGE_EFFICIENCY,
  calculateAircoCapacity,
  estimateAircoAnnualElectricity,
  getSmallestSingleSplitOptions,
  getSuitableMultiSplitPackages,
} from '../../lib/aircoSizing.js'
import { trackEvent } from '../../lib/analytics.js'
import './ProductSavingsEstimator.css'

const PRODUCT_TYPES = ['solar', 'insulation', 'airco']
const PART_TYPES = ['wall', 'floor', 'roof', 'glazing']

const createEmptyForm = (initialPart) => ({
  part: PART_TYPES.includes(initialPart) ? initialPart : '',
  investmentEur: '',
  annualMaintenanceEur: '',
  subsidyConfirmed: false,
  confirmedSubsidyEur: '',
  annualProductionKwh: '',
  annualConsumptionKwh: '',
  daytimePresence: 'mixed',
  directSelfUseKwh: '',
  electricityPriceEurPerKwh: '',
  exportPriceEurPerKwh: '',
  annualFeedInCostsEur: '',
  panelCount: '',
  areaM2: '',
  uValueBefore: '',
  uValueAfter: '',
  heatingDegreeDays18C: '',
  annualSpaceHeatDemandKwh: '',
  heatingSystem: '',
  gasEnergyKwhPerM3: '',
  boilerEfficiencyPct: '',
  scop: '',
  gasPricePerM3: '',
  annualHeatDeliveredKwh: '',
  annualCoolingDeliveredKwh: '',
  aircoRooms: [{ areaM2: '', insulationLevel: '' }],
  aircoGoal: '',
  heatingScop: String(AIRCO_AVERAGE_EFFICIENCY.scop),
  coolingSeer: String(AIRCO_AVERAGE_EFFICIENCY.seer),
  existingHeatingSystem: '',
  annualGasUseM3: '',
  directHeaterEfficiency: '1',
  scenarioRates: {
    cautious: {
      electricityPriceEurPerKwh: '',
      exportPriceEurPerKwh: '',
      gasPricePerM3: '',
    },
    favorable: {
      electricityPriceEurPerKwh: '',
      exportPriceEurPerKwh: '',
      gasPricePerM3: '',
    },
  },
})

const COPY = {
  nl: {
    back: 'Terug naar aanbod',
    topTag: 'Indicatieve berekening',
    eyebrow: 'SolarFast · helder over de basis',
    title: 'Een nuchtere schatting, op uw gegevens.',
    intro: 'Vul alleen waarden in die u kent uit een scan, offerte, meter of energiecontract. We vullen geen technische of financiële aannames voor u in.',
    scopeTitle: 'Wat deze berekening wel en niet doet',
    scopeIntro: 'Dit zijn losse productindicaties; tel ze niet zelf op bij andere producten. Wilt u zonnepanelen én een batterij, kies dan beide in de gecombineerde batterijberekening. Die vergelijkt de totale energiekosten van de woning.',
    scopeItems: [
      'Tarieven blijven gelijk gedurende de projectie.',
      'Vervanging, degradatie, belastingen en niet ingevulde onderhouds- of terugleverkosten zijn uitgesloten.',
      'Isolatie schat alleen transmissiewarmteverlies; het is geen volledige gebouw- of energiescan.',
      'Zonnepanelen bevatten geen batterijwaarde. CO₂ wordt niet berekend zonder goedgekeurde emissiefactor.',
      'Subsidie wordt alleen afgetrokken als u deze als bevestigd aanvinkt.',
    ],
    product: 'Maatregel',
    solar: 'Zonnepanelen',
    solarSub: 'Opwek en teruglevering',
    insulation: 'Isolatie',
    insulationSub: 'Wand, vloer, dak of glas',
    airco: 'Airco',
    aircoSub: 'Verwarmen en koelen',
    details: 'Uw invoer',
    detailsSolar: 'Zonnepanelen invoeren',
    detailsInsulation: 'Isolatie invoeren',
    detailsAirco: 'Airco invoeren',
    formHelp: 'Gebruik gegevens voor deze maatregel alleen; deze indicatie is niet optelbaar bij een batterij- of warmtepompberekening.',
    aircoIntro: 'Voor koelen tonen we een grove koelvermogensindicatie. Verwarmen en koelen worden apart beoordeeld; de jaarlijkse kosten- en besparingsberekening is optioneel.',
    aircoFormHelp: 'Vul het aantal ruimtes, de m² en isolatie in. Daarna adviseren we single-split of een passende multi-split uit uw assortiment.',
    aircoSizingTitle: 'Hoeveel ruimtes wilt u koelen?',
    aircoSizingHelp: 'We berekenen per kamer een richtwaarde. Zo kiezen we geen multi-split op basis van één samengevoegd oppervlak.',
    aircoRoomCount: 'Aantal aparte ruimtes',
    aircoRoomCountOptions: { '1': '1 ruimte · single-split', '2': '2 ruimtes · multi-split', '3': '3 ruimtes · multi-split', '4': '4 ruimtes · multi-split' },
    aircoRoomTitle: (number) => `Ruimte ${number}`,
    aircoAreaLabel: 'Oppervlakte',
    aircoAreaPlaceholder: 'bijv. 25',
    aircoInsulation: 'Isolatiegraad',
    aircoInsulationOptions: { good: 'Goed', average: 'Gemiddeld', poor: 'Matig / slecht', unknown: 'Onbekend' },
    aircoGoal: 'Wat moet de airco doen?',
    aircoGoalOptions: { cooling: 'Alleen koelen', 'cooling-heating': 'Koelen én verwarmen' },
    insulationQuestionPlaceholder: 'Kies een antwoord',
    aircoRule: 'Richtlijn voor koeling: 80 W/m² bij goede, 100 W/m² bij gemiddelde of onbekende en 130 W/m² bij matige isolatie.',
    aircoSourceLabel: 'Bron voor deze richtlijn: AircoKenner.nl',
    aircoAreaWarning: 'Dit is een snelle richtwaarde op basis van m² en isolatie, geen volledige koelbelastingberekening. Zon, plafondhoogte en ramen kunnen de uitkomst veranderen; laat afwijkende ruimtes controleren.',
    aircoHeatingWarning: 'De modelkeuze hierboven is op koeling berekend. Verwarmingscapaciteit hangt af van het model en de buitentemperatuur; controleer die apart op het productblad.',
    aircoSystemSingle: 'Indicatieve kandidaat: single-split',
    aircoSystemMulti: 'Indicatieve kandidaat: multi-split',
    aircoModelOptionsTitle: 'Passende modellen uit uw assortiment',
    aircoModelOptionsHelp: 'Dit is een eerste selectie op nominaal koelvermogen, geen kWh-efficiëntieranglijst. Vergelijk voor het laagste verbruik de SEER (koelen), SCOP (verwarmen) en het modulatiebereik op het energielabel of productblad.',
    aircoBestMultiTitle: 'Voorlopige multi-splitkandidaat',
    aircoAnnualUseNeedsInputs: 'Jaarverbruik is een gemiddelde scenarioberekening; het werkelijke verbruik hangt af van woning, gebruik en model.',
    aircoAnnualUseTitle: 'Berekend stroomverbruik per jaar',
    aircoAnnualEstimateTitle: 'Geschat stroomverbruik per jaar',
    aircoAnnualEstimateHeating: 'Verwarmen',
    aircoAnnualEstimateCooling: 'Koelen',
    aircoAnnualEstimateBasis: (seer, scop) => `Gemiddelde aanname: SEER ${seer} · SCOP ${scop}; koelen rekent met 200 vollasturen per jaar (gemiddeld 17 uur per maand). Verwarmen gebruikt 35/50/70 kWh warmte per m² per jaar (goed/gemiddeld/matig geïsoleerd). Geen productspecificatie; werkelijk verbruik varieert.`,
    aircoAnnualHeatingKwh: 'Verwarmen · warmteafgifte ÷ SCOP',
    aircoAnnualCoolingKwh: 'Koelen · koudeafgifte ÷ SEER',
    aircoAnnualTotalKwh: 'Totaal aircoverbruik',
    aircoAnnualUsePreviewHelp: 'Deze aparte berekening gebruikt uw ingevulde jaarbehoefte en de zichtbare gemiddelde SEER/SCOP-aannames.',
    aircoPhotoAlt: 'Wandmodel-binnenunit uit de meegestuurde aircofoto',
    aircoOutdoorPhotoAlt: 'Illustratie van een buitenunit voor een split-airco',
    aircoIndoorCaption: (count) => count > 1 ? `Binnenunits · ${count} ruimtes` : 'Binnenunit',
    aircoOutdoorCaption: 'Buitenunit · illustratie',
    aircoRecommendationTitle: 'Voorlopige kandidaat uit uw assortiment',
    aircoRecommendationReason: 'Voorlopige kandidaat op basis van nominaal koelvermogen. Controleer capaciteit, fabrikantcombinatie, SEER en SCOP op het productblad vóór offerte of installatie.',
    aircoRecommendationPhotoNote: 'Voorbeeldbeelden; niet de exacte uitvoering van het aanbevolen model.',
    aircoRecommendedCoolingCapacity: 'Koelvermogen',
    aircoRecommendedIndoorUnits: 'Binnenunits',
    aircoRecommendedOutdoorUnit: 'Buitenunit',
    aircoProductLines: 'Haier Pearl Premium · Haier Revive Plus · LG Standard Plus',
    aircoNoSingleModel: 'Geen van de opgegeven single-splitmodellen dekt deze richtwaarde. Laat de ruimte of combinatie professioneel berekenen.',
    aircoNoMultiPackage: 'Geen set voldoet aan de richtwaarde per binnenunit. Laat de volledige fabrikantcombinatie technisch controleren.',
    aircoUnknownSizingWarning: 'De isolatie is onbekend. De richtwaarde gebruikt 100 W/m², maar daarom tonen we geen definitieve modelkeuze. Laat de koelbelasting controleren.',
    aircoLargeLoad: 'Deze ruimte valt buiten de snelle richtlijn. Laat het koelvermogen professioneel berekenen.',
    aircoFillRequired: 'Vul per ruimte de m² en isolatiegraad in en kies het gebruik om de setkeuze te zien.',
    aircoCapacityByRoom: (load, classKw) => `Richtwaarde ${load} kW · kies minimaal de ${classKw} kW-klasse`,
    aircoTotalArea: 'Totaal oppervlak',
    aircoTotalCoolingLoad: 'Totaal indicatief koelvermogen',
    aircoOptionalSavingsTitle: 'Ook jaarlijkse energiekosten en besparing berekenen (optioneel)',
    aircoOptionalSavingsHelp: 'Deze aparte vergelijking gebruikt nuttige warmte- en koudeafgifte in kWh, SCOP/SEER, uw huidige verwarmingsbron en energietarieven. Bij alleen koelen kan de uitkomst extra kosten tonen in plaats van besparing.',
    aircoSavingsHelp: 'Vul geleverde warmte en/of koeling in als thermische energie (kWh warmte/koude), niet als stroomverbruik. Laat een functie leeg of vul 0 in als u die niet gebruikt. Voor verwarmen vergelijken we alleen met gas of directe elektrische verwarming.',
    errorAtLeastOneArea: 'Vul bij verwarmen of koelen een oppervlakte groter dan 0 in.',
    investmentTitle: 'Kosten en subsidie',
    investmentHint: 'Gebruik uw offerte of een eigen kostenraming. Zonder bedrag wordt geen uitkomst getoond.',
    investment: 'Totale investering inclusief installatie',
    maintenance: 'Jaarlijks onderhoud',
    optional: 'optioneel',
    subsidyCheck: 'Ik heb een subsidiebedrag bevestigd',
    subsidyHelp: 'Een niet-bevestigde subsidie wordt nooit in mindering gebracht.',
    confirmedSubsidy: 'Bevestigd subsidiebedrag',
    energyTitleSolar: 'Opbrengst en energietarieven',
    energyTitleInsulation: 'Woningdeel en warmteverlies',
    energyTitleAirco: 'Jaarlijkse warmte-/koelbehoefte en huidige verwarming',
    rateTitle: 'Uw tarieven',
    scenarioTitle: 'Optionele tarieven vergelijken',
    scenarioIntro: 'Voorzichtige en gunstige tariefscenario’s verschijnen alleen als u alle relevante tarieven invult. De fysieke energiestromen blijven gelijk aan de hoofdberekening; alleen de ingevoerde tarieven veranderen. Dit zijn geen automatische onzekerheidsmarges.',
    cautious: 'Tariefscenario · voorzichtig',
    favorable: 'Tariefscenario · gunstig',
    calculate: 'Bereken indicatie',
    submitHint: 'De uitkomst verschijnt pas wanneer alle verplichte waarden geldig zijn.',
    solarProduction: 'Jaarlijkse zonneproductie',
    solarProductionHelp: 'Gebruik de jaaropbrengst van uw omvormer of een echte offerte/prognose.',
    annualConsumption: 'Jaarlijks stroomverbruik van uw woning',
    daytimePresence: 'Bent u overdag meestal thuis?',
    daytimePresenceOptions: { often: 'Vaak thuis', mixed: 'Soms thuis / wisselend', away: 'Meestal niet thuis' },
    solarEstimateHint: 'Geschatte teruglevering op basis van uw jaarverbruik en aanwezigheid overdag.',
    solarProfileAssumption: 'Schatting: 60% / 45% / 30% van uw jaarverbruik valt samen met zonne-opwek bij vaak thuis / wisselend / meestal weg. Geen uurmeting.',
    directSelfUse: 'Direct zelfverbruik per jaar',
    directSelfUseHelp: 'Zonnestroom die u op hetzelfde moment in huis gebruikt.',
    electricityPrice: 'Elektriciteitsprijs',
    exportPrice: 'Terugleverprijs',
    feedInCosts: 'Jaarlijkse terugleverkosten',
    panelCount: 'Aantal panelen',
    panelCountHelp: 'Alleen gebruikt om capaciteit te tonen: 485 Wp LONGi per paneel. Dit bepaalt de jaaropbrengst niet.',
    part: 'Woningdeel',
    choosePart: 'Kies een woningdeel',
    wall: 'Wand',
    floor: 'Vloer',
    roof: 'Dak',
    glazing: 'Glas / beglazing',
    area: 'Te isoleren oppervlak',
    uBefore: 'U-waarde vóór maatregel',
    uAfter: 'U-waarde na maatregel',
    uHelp: 'Gebruik waarden uit een productspecificatie, advies of opname.',
    degreeDays: 'Graaddagen (basis 18 °C)',
    degreeDaysUnit: '°C·dagen',
    heatDemand: 'Jaarlijkse warmtevraag voor ruimteverwarming',
    heatDemandHelp: 'Vul nuttige warmte in kWh warmte in, niet het gasverbruik.',
    heatingSystem: 'Bestaand verwarmingssysteem',
    chooseHeating: 'Kies verwarmingssysteem',
    gas: 'Gasketel',
    heatPump: 'Warmtepomp',
    directElectric: 'Direct elektrisch',
    gasEnergy: 'Energie-inhoud gas',
    boilerEfficiency: 'Ketelrendement',
    annualGasUse: 'Gasverbruik woning per jaar',
    scop: 'Seizoensrendement SCOP',
    gasPrice: 'Gasprijs',
    annualHeat: 'Jaarlijks geleverde warmte (kWh warmte)',
    annualHeatHelp: 'Gebruik nuttige warmteafgifte uit een berekening of offerte; dit is niet het stroomverbruik. Laat leeg of vul 0 in als de airco niet verwarmt.',
    annualCooling: 'Jaarlijks geleverde koeling (kWh koude)',
    annualCoolingHelp: 'Gebruik nuttige koudeafgifte uit een berekening of offerte. Laat leeg of vul 0 in als de airco niet koelt.',
    heatingScop: 'SCOP voor verwarmen',
    heatingScopHelp: 'Gemiddelde aanname 4,0; vervang dit door de waarde van het gekozen model als die bekend is.',
    coolingSeer: 'SEER voor koelen',
    coolingSeerHelp: 'Gemiddelde aanname 6,5; vervang dit door de waarde van het gekozen model als die bekend is.',
    existingSystem: 'Huidige verwarmingsbron (alleen voor warmte)',
    directHeaterEfficiency: 'Rendement elektrische kachel (bijv. 1,0)',
    directHeaterEfficiencyHelp: 'Referentie voor directe elektrische verwarming: 1,0 = 100%. Pas aan als de bestaande verwarming een andere opgegeven efficiëntie heeft.',
    chooseExistingSystem: 'Kies huidige bron',
    tariffs: 'Tarieven voor berekening',
    required: 'verplicht',
    missingTitle: 'Nog geen geldige uitkomst',
    missingText: 'Controleer de gemarkeerde velden. Er wordt geen resultaat geschat wanneer verplichte invoer ontbreekt of ongeldig is.',
    resultTitle: 'Indicatie op basis van uw invoer',
    resultIntro: 'De onderstaande bedragen gebruiken uitsluitend uw ingevulde gegevens en de expliciete modelaannames.',
    realistic: 'Basistarieven · hoofdscenario',
    annualNet: 'Netto per jaar',
    resultCaption: 'Netto jaarlijkse besparing na ingevoerde jaarlijkse kosten.',
    resultCaptionAirco: 'Netto jaarlijks effect na stroom- en andere ingevoerde jaarlasten; bij alleen koelen kan dit een extra kostenpost zijn.',
    payback: 'Terugverdientijd',
    roi: 'Jaarlijkse ROI',
    investmentNet: 'Netto investering',
    scenarioCompare: 'Vergelijking van tariefscenario’s',
    scenarioComparisonHelp: 'De energiestromen en het gebruik blijven gelijk aan de hoofdberekening. Alleen de door u ingevulde tarieven verschillen; dit zijn geen automatische onzekerheidsmarges.',
    scenarioLabel: 'Scenario',
    annualSavings: 'Netto per jaar',
    paybackShort: 'Terugverdientijd',
    roiShort: 'ROI',
    notProvided: 'Niet ingevuld',
    financialTitle: 'Financiële opbouw · basistarieven',
    grossSavings: 'Bruto jaarlijkse besparing',
    extraCosts: 'Jaarlijkse extra kosten',
    grossInvestment: 'Bruto investering',
    subsidy: 'Bevestigde subsidie',
    energyTitle: 'Energie in deze schatting',
    projectionsTitle: 'Netto financieel resultaat per horizon',
    projectionsHelp: 'Cumulatieve operationele besparing minus netto investering; zonder tariefwijziging.',
    projectionYears: (years) => `Na ${years} jaar`,
    netResult: 'Netto resultaat',
    assumptionsTitle: 'Aannames en grenzen van deze uitkomst',
    noPayback: 'Niet bereikt in dit model',
    noRoi: 'Niet beschikbaar',
    noCapacity: 'Niet opgegeven',
    perYear: '/ jaar',
    perYearEur: '€/jaar',
    perKwh: '€/kWh',
    perM3: '€/m³',
    m2: 'm²',
    kwh: 'kWh',
    panel: 'panelen',
    kwp: 'kWp',
    watts: 'Wp',
    degrees: '°C',
    percent: '%',
    backOffer: 'Terug naar aanbod',
    existingCalc: 'Batterij- en warmtepompcalculator',
    goLink: 'Open calculator',
    unsupported: 'Deze maatregel wordt niet ondersteund.',
    errorRequired: 'Vul dit veld in.',
    errorInvalid: 'Voer een geldig getal in.',
    errorRange: 'De waarde valt buiten het toegestane bereik.',
    errorExceedsProduction: 'Direct zelfverbruik kan niet hoger zijn dan de jaarproductie.',
    errorUValue: 'De U-waarde na de maatregel moet lager zijn dan de waarde ervoor.',
    errorSubsidy: 'Subsidie kan niet hoger zijn dan de totale investering.',
    errorPanel: 'Vul een geheel aantal panelen van minimaal 1 in.',
    errorAircoUse: 'Vul een jaarwaarde groter dan 0 in voor verwarmen of koelen.',
    errorGeneric: 'Controleer deze waarde.',
    assumptionMaintenance: 'Jaarlijks onderhoud is niet ingevuld en daarom niet meegerekend.',
    assumptionUnconfirmed: 'Een opgegeven maar niet bevestigde subsidie is buiten de berekening gehouden.',
    assumptionFeedIn: 'Terugleverkosten zijn niet ingevuld en daarom niet meegerekend.',
    assumptionTariffs: 'Uw ingevoerde energietarieven zijn gedurende de hele projectie constant gehouden.',
    assumptionDegradation: 'Vervanging, degradatie en niet ingevuld onderhoud zijn niet meegenomen.',
    assumptionSolar: 'Dit is alleen de terugverdienindicatie voor zonnepanelen; ze is niet opgeteld bij andere producten.',
    assumptionSolarUse: 'Direct eigen gebruik en teruglevering zijn geschat met uw keuze voor aanwezigheid overdag; er zijn geen uurmetingen gebruikt.',
    assumptionTransmission: 'De isolatie-uitkomst schat alleen transmissiewarmteverlies en is geen volledige gebouwbeoordeling.',
    assumptionStandalone: 'Deze maatregel staat op zichzelf en is niet opgeteld bij een warmtepomp- of batterijberekening.',
    assumptionAirco: 'De jaarlijkse warmte- en koudeafgifte komt uit uw invoer; stroomgebruik is berekend als warmte/SCOP en koeling/SEER. Verwarming wordt alleen vergeleken met gas of directe elektrische verwarming.',
    flowProduction: 'Jaarlijkse zonneproductie',
    flowSelfUse: 'Direct zelfverbruik',
    flowExport: 'Teruggeleverd aan het net',
    flowCapacity: 'Panelenvermogen op basis van LONGi 485 Wp',
    flowArea: 'Oppervlak',
    flowHeatLoss: 'Theoretische afname warmteverlies',
    flowUsefulHeat: 'Berekende nuttige warmtereductie',
    flowGasAvoided: 'Vermeden gasverbruik',
    flowElectricAvoided: 'Vermeden elektriciteit',
    flowHeatDelivered: 'Nuttige warmteafgifte',
    flowCoolingDelivered: 'Nuttige koudeafgifte',
    flowHeatPumpElectricity: 'Geschat aircoverbruik voor verwarmen',
    flowCoolingElectricity: 'Geschat aircoverbruik voor koelen',
    flowHeatingElectricityCost: 'Stroomkosten airco · verwarmen',
    flowCoolingElectricityCost: 'Stroomkosten airco · koelen',
    flowTotalElectricityCost: 'Totale stroomkosten airco',
    noResultFlows: 'Energiedoorstromen zijn niet beschikbaar.',
    fieldPart: 'Woningdeel',
    fieldHeatingSystem: 'Verwarmingssysteem',
    fieldExistingSystem: 'Huidige verwarmingsbron',
    standaloneHeading: 'Deze schatting staat op zichzelf',
  },
  en: {
    back: 'Back to offers',
    topTag: 'Indicative estimate',
    eyebrow: 'SolarFast · clear about the basis',
    title: 'A grounded estimate, based on your inputs.',
    intro: 'Enter only values you know from a roof scan, quote, meter or energy contract. We do not fill in technical or financial assumptions for you.',
    scopeTitle: 'What this estimate does and does not do',
    scopeIntro: 'These are standalone product estimates; do not add them to other products yourself. To select solar panels and a battery together, choose both in the combined battery calculator. It compares total household energy costs.',
    scopeItems: [
      'Tariffs are held constant throughout the projection.',
      'Replacement, degradation, taxes and unentered maintenance or feed-in fees are excluded.',
      'Insulation estimates transmission heat loss only; it is not a full building or energy assessment.',
      'Solar excludes battery value. CO₂ is not calculated without an approved emissions factor.',
      'Subsidy is deducted only when you confirm it.',
    ],
    product: 'Measure',
    solar: 'Solar panels',
    solarSub: 'Generation and export',
    insulation: 'Insulation',
    insulationSub: 'Wall, floor, roof or glazing',
    airco: 'Air conditioning',
    aircoSub: 'Heating and cooling',
    details: 'Your inputs',
    detailsSolar: 'Enter solar details',
    detailsInsulation: 'Enter insulation details',
    detailsAirco: 'Enter air-conditioning details',
    formHelp: 'Use data for this measure only; this estimate cannot be added to a battery or heat-pump calculation.',
    aircoIntro: 'We show a rough cooling-capacity estimate first. Heating and cooling are assessed separately; the annual cost and savings estimate is optional.',
    aircoFormHelp: 'Enter the number of rooms, their areas and insulation. We then recommend single-split or a suitable multi-split from your range.',
    aircoSizingTitle: 'How many separate rooms do you want to cool?',
    aircoSizingHelp: 'We estimate each room separately, so we do not choose a multi-split from one combined area.',
    aircoRoomCount: 'Number of separate rooms',
    aircoRoomCountOptions: { '1': '1 room · single-split', '2': '2 rooms · multi-split', '3': '3 rooms · multi-split', '4': '4 rooms · multi-split' },
    aircoRoomTitle: (number) => `Room ${number}`,
    aircoAreaLabel: 'Area',
    aircoAreaPlaceholder: 'e.g. 25',
    aircoInsulation: 'Insulation level',
    aircoInsulationOptions: { good: 'Good', average: 'Average', poor: 'Limited / poor', unknown: 'Unknown' },
    aircoGoal: 'What should the air conditioner do?',
    aircoGoalOptions: { cooling: 'Cooling only', 'cooling-heating': 'Cooling and heating' },
    insulationQuestionPlaceholder: 'Choose an answer',
    aircoRule: 'Cooling guide: 80 W/m² with good, 100 W/m² with average or unknown, and 130 W/m² with limited insulation.',
    aircoSourceLabel: 'Guideline source: AircoKenner.nl',
    aircoAreaWarning: 'This is a quick guide based on area and insulation, not a full cooling-load calculation. Sun, ceiling height and windows can change the result; have unusual rooms checked.',
    aircoHeatingWarning: 'The model choice above is based on cooling. Heating capacity depends on the model and outdoor temperature; check it separately in the datasheet.',
    aircoSystemSingle: 'Indicative candidate: single-split',
    aircoSystemMulti: 'Indicative candidate: multi-split',
    aircoModelOptionsTitle: 'Suitable models in your range',
    aircoModelOptionsHelp: 'This is an initial match by nominal cooling capacity, not a kWh-efficiency ranking. To compare energy use, check SEER (cooling), SCOP (heating) and modulation range on the energy label or datasheet.',
    aircoBestMultiTitle: 'Preliminary multi-split candidate',
    aircoAnnualUseNeedsInputs: 'Annual use is an average scenario estimate; actual use depends on the home, usage and model.',
    aircoAnnualUseTitle: 'Calculated annual electricity use',
    aircoAnnualEstimateTitle: 'Estimated annual electricity use',
    aircoAnnualEstimateHeating: 'Heating',
    aircoAnnualEstimateCooling: 'Cooling',
    aircoAnnualEstimateBasis: (seer, scop) => `Average assumption: SEER ${seer} · SCOP ${scop}; cooling uses 200 equivalent full-load hours/year (17 hours/month annual average). Heating uses 35/50/70 kWh thermal per m²/year (good/average/poor insulation). Not a product specification; actual use varies.`,
    aircoAnnualHeatingKwh: 'Heating · useful heat ÷ SCOP',
    aircoAnnualCoolingKwh: 'Cooling · useful cooling ÷ SEER',
    aircoAnnualTotalKwh: 'Total air-conditioner use',
    aircoAnnualUsePreviewHelp: 'This separate calculation uses your entered annual demand and the visible average SEER/SCOP assumptions.',
    aircoPhotoAlt: 'Wall-mounted indoor unit from the supplied air-conditioner photo',
    aircoOutdoorPhotoAlt: 'Illustration of an outdoor unit for a split air conditioner',
    aircoIndoorCaption: (count) => count > 1 ? `Indoor units · ${count} rooms` : 'Indoor unit',
    aircoOutdoorCaption: 'Outdoor unit · illustration',
    aircoRecommendationTitle: 'Preliminary candidate from your range',
    aircoRecommendationReason: 'Provisional candidate based on nominal cooling capacity. Verify capacity, manufacturer combination, SEER and SCOP on the datasheet before quoting or installing.',
    aircoRecommendationPhotoNote: 'Illustrative images; not the exact version of the recommended model.',
    aircoRecommendedCoolingCapacity: 'Cooling capacity',
    aircoRecommendedIndoorUnits: 'Indoor units',
    aircoRecommendedOutdoorUnit: 'Outdoor unit',
    aircoProductLines: 'Haier Pearl Premium · Haier Revive Plus · LG Standard Plus',
    aircoNoSingleModel: 'None of the listed single-split models meets this guide value. Have the room or combination sized professionally.',
    aircoNoMultiPackage: 'No set meets the guide value for each indoor unit. Have the full manufacturer combination checked.',
    aircoUnknownSizingWarning: 'Insulation is unknown. The guide uses 100 W/m², so no definitive model is recommended. Have the cooling load checked.',
    aircoLargeLoad: 'This room is outside the quick-sizing guide. Have its cooling capacity calculated professionally.',
    aircoFillRequired: 'Enter the area and insulation level for each room, then choose the intended use to see a set recommendation.',
    aircoCapacityByRoom: (load, classKw) => `Guide value ${load} kW · choose at least the ${classKw} kW class`,
    aircoTotalArea: 'Total area',
    aircoTotalCoolingLoad: 'Total indicative cooling load',
    aircoOptionalSavingsTitle: 'Also estimate annual energy costs and savings (optional)',
    aircoOptionalSavingsHelp: 'This separate comparison uses useful heat and cooling output in kWh, SCOP/SEER, your current heating source and energy rates. Cooling only may result in added costs rather than savings.',
    aircoSavingsHelp: 'Enter delivered heat and/or cooling as thermal energy (kWh of heat/cooling), not electricity use. Leave a function blank or enter 0 if unused. Heating is compared only with gas or direct-electric heating.',
    errorAtLeastOneArea: 'Enter an area greater than 0 for heating or cooling.',
    investmentTitle: 'Cost and subsidy',
    investmentHint: 'Use a quote or your own cost estimate. No result is shown without an investment amount.',
    investment: 'Total investment including installation',
    maintenance: 'Annual maintenance',
    optional: 'optional',
    subsidyCheck: 'I have a confirmed subsidy amount',
    subsidyHelp: 'An unconfirmed subsidy is never deducted.',
    confirmedSubsidy: 'Confirmed subsidy amount',
    energyTitleSolar: 'Generation and energy tariffs',
    energyTitleInsulation: 'Building element and heat loss',
    energyTitleAirco: 'Annual heating/cooling demand and current heating',
    rateTitle: 'Your tariffs',
    scenarioTitle: 'Compare optional tariffs',
    scenarioIntro: 'Cautious and favorable tariff scenarios appear only when all relevant rates are entered. Physical energy flows remain the same as the main calculation; only the entered tariffs change. These are not automatic uncertainty bounds.',
    cautious: 'Tariff scenario · cautious',
    favorable: 'Tariff scenario · favorable',
    calculate: 'Calculate estimate',
    submitHint: 'Results appear only after all required values are valid.',
    solarProduction: 'Annual solar production',
    solarProductionHelp: 'Use annual output from your inverter or a real quote/forecast.',
    annualConsumption: 'Annual household electricity use',
    daytimePresence: 'Are you usually at home during the day?',
    daytimePresenceOptions: { often: 'Often at home', mixed: 'Sometimes / varies', away: 'Usually away' },
    solarEstimateHint: 'Estimated export based on your annual use and daytime presence.',
    solarProfileAssumption: 'Estimate: 60% / 45% / 30% of annual household use overlaps with solar generation when often home / variable / usually away. No hourly data.',
    directSelfUse: 'Annual direct self-use',
    directSelfUseHelp: 'Solar electricity used in the home at the time it is generated.',
    electricityPrice: 'Electricity price',
    exportPrice: 'Export price',
    feedInCosts: 'Annual feed-in costs',
    panelCount: 'Panel count',
    panelCountHelp: 'Used only to show capacity: 485 Wp LONGi per panel. It does not determine annual output.',
    part: 'Building element',
    choosePart: 'Choose a building element',
    wall: 'Wall',
    floor: 'Floor',
    roof: 'Roof',
    glazing: 'Glazing',
    area: 'Area to insulate',
    uBefore: 'U-value before measure',
    uAfter: 'U-value after measure',
    uHelp: 'Use values from a product specification, assessment or quote.',
    degreeDays: 'Degree days (18 °C base)',
    degreeDaysUnit: '°C·days',
    heatDemand: 'Annual space-heating demand',
    heatDemandHelp: 'Enter useful heat in kWh thermal, not gas consumption.',
    heatingSystem: 'Existing heating system',
    chooseHeating: 'Choose heating system',
    gas: 'Gas boiler',
    heatPump: 'Heat pump',
    directElectric: 'Direct electric',
    gasEnergy: 'Gas energy content',
    boilerEfficiency: 'Boiler efficiency',
    annualGasUse: 'Home gas use per year',
    scop: 'Seasonal efficiency SCOP',
    gasPrice: 'Gas price',
    annualHeat: 'Annual heat delivered (kWh heat)',
    annualHeatHelp: 'Use useful heat output from an assessment or quote; this is not electricity use. Leave blank or enter 0 if the unit will not heat.',
    annualCooling: 'Annual cooling delivered (kWh cooling)',
    annualCoolingHelp: 'Use useful cooling output from an assessment or quote. Leave blank or enter 0 if the unit will not cool.',
    heatingScop: 'Heating SCOP',
    heatingScopHelp: 'Average assumption 4.0; replace with the selected model’s value when known.',
    coolingSeer: 'Cooling SEER',
    coolingSeerHelp: 'Average assumption 6.5; replace with the selected model’s value when known.',
    existingSystem: 'Current heating source (for heating only)',
    directHeaterEfficiency: 'Direct-electric heater efficiency (e.g. 1.0)',
    directHeaterEfficiencyHelp: 'Reference for direct-electric heating: 1.0 = 100%. Change this if the existing heater has a different stated efficiency.',
    chooseExistingSystem: 'Choose current source',
    tariffs: 'Calculation tariffs',
    required: 'required',
    missingTitle: 'No valid result yet',
    missingText: 'Check the marked fields. No estimate is shown while required inputs are missing or invalid.',
    resultTitle: 'Estimate based on your inputs',
    resultIntro: 'The amounts below use only your entered data and the model assumptions shown.',
    realistic: 'Base tariffs · main scenario',
    annualNet: 'Net per year',
    resultCaption: 'Net annual savings after entered annual costs.',
    resultCaptionAirco: 'Net annual effect after electricity and other entered annual costs; cooling only may result in an added cost.',
    payback: 'Payback period',
    roi: 'Annual ROI',
    investmentNet: 'Net investment',
    scenarioCompare: 'Tariff scenario comparison',
    scenarioComparisonHelp: 'Energy flows and usage stay the same as in the main calculation. Only the tariffs you enter differ; these are not automatic uncertainty bounds.',
    scenarioLabel: 'Scenario',
    annualSavings: 'Net per year',
    paybackShort: 'Payback',
    roiShort: 'ROI',
    notProvided: 'Not entered',
    financialTitle: 'Financial breakdown · base tariffs',
    grossSavings: 'Gross annual savings',
    extraCosts: 'Annual extra costs',
    grossInvestment: 'Gross investment',
    subsidy: 'Confirmed subsidy',
    energyTitle: 'Energy in this estimate',
    projectionsTitle: 'Net financial result by horizon',
    projectionsHelp: 'Cumulative operating savings minus net investment; tariffs do not change.',
    projectionYears: (years) => `After ${years} years`,
    netResult: 'Net result',
    assumptionsTitle: 'Assumptions and limits of this estimate',
    noPayback: 'Not reached in this model',
    noRoi: 'Not available',
    noCapacity: 'Not provided',
    perYear: '/ year',
    perYearEur: '€/year',
    perKwh: '€/kWh',
    perM3: '€/m³',
    m2: 'm²',
    kwh: 'kWh',
    panel: 'panels',
    kwp: 'kWp',
    watts: 'Wp',
    degrees: '°C',
    percent: '%',
    backOffer: 'Back to offers',
    existingCalc: 'Battery and heat-pump calculator',
    goLink: 'Open calculator',
    unsupported: 'This measure is not supported.',
    errorRequired: 'Enter a value for this field.',
    errorInvalid: 'Enter a valid number.',
    errorRange: 'This value is outside the allowed range.',
    errorExceedsProduction: 'Direct self-use cannot exceed annual production.',
    errorUValue: 'The U-value after the measure must be lower than before.',
    errorSubsidy: 'Subsidy cannot exceed the total investment.',
    errorPanel: 'Enter a whole panel count of at least 1.',
    errorAircoUse: 'Enter an annual value greater than 0 for heating or cooling.',
    errorGeneric: 'Check this value.',
    assumptionMaintenance: 'Annual maintenance was not entered and is therefore excluded.',
    assumptionUnconfirmed: 'An entered but unconfirmed subsidy was excluded.',
    assumptionFeedIn: 'Feed-in costs were not entered and are therefore excluded.',
    assumptionTariffs: 'Your entered energy tariffs are held constant throughout the projection.',
    assumptionDegradation: 'Replacement, degradation and unentered maintenance are not included.',
    assumptionSolar: 'This is the solar-only payback estimate; it is not added to other products.',
    assumptionSolarUse: 'Direct self-use and export are estimated from your daytime-presence choice; hourly meter data is not used.',
    assumptionTransmission: 'The insulation result estimates transmission heat loss only; it is not a full building assessment.',
    assumptionStandalone: 'This measure is standalone and is not added to a heat-pump or battery calculation.',
    assumptionAirco: 'Annual useful heat and cooling output comes from your inputs; electricity use is calculated as heat/SCOP and cooling/SEER. Heating is compared only with gas or direct-electric heating.',
    flowProduction: 'Annual solar production',
    flowSelfUse: 'Direct self-use',
    flowExport: 'Exported to the grid',
    flowCapacity: 'Panel capacity based on LONGi 485 Wp',
    flowArea: 'Area',
    flowHeatLoss: 'Theoretical heat-loss reduction',
    flowUsefulHeat: 'Estimated useful heat reduction',
    flowGasAvoided: 'Avoided gas use',
    flowElectricAvoided: 'Avoided electricity',
    flowHeatDelivered: 'Useful heat delivered',
    flowCoolingDelivered: 'Useful cooling delivered',
    flowHeatPumpElectricity: 'Estimated air-conditioner electricity for heating',
    flowCoolingElectricity: 'Estimated air-conditioner electricity for cooling',
    flowHeatingElectricityCost: 'Air-conditioner electricity cost · heating',
    flowCoolingElectricityCost: 'Air-conditioner electricity cost · cooling',
    flowTotalElectricityCost: 'Total air-conditioner electricity cost',
    noResultFlows: 'Energy flows are not available.',
    fieldPart: 'Building element',
    fieldHeatingSystem: 'Heating system',
    fieldExistingSystem: 'Current heating source',
    standaloneHeading: 'This estimate is standalone',
  },
}

function isNumericPositive(value) {
  const number = Number(String(value ?? '').trim().replace(',', '.'))
  return value !== '' && value != null && Number.isFinite(number) && number > 0
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  unit,
  help,
  optional = false,
  error,
  inputMode = 'decimal',
  placeholder,
  testId,
}) {
  const errorId = `${id}-error`
  const helpId = `${id}-help`
  return (
    <label className="pse-field" htmlFor={id}>
      <span className="pse-field-label">
        <span>{label}</span>
        {optional && <span className="pse-field-optional">{optional}</span>}
      </span>
      <span className="pse-control-wrap">
        <input
          id={id}
          name={name}
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete="off"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className={unit ? 'pse-has-unit' : ''}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[help ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
          data-testid={testId}
        />
        {unit && <span className="pse-input-unit" aria-hidden="true">{unit}</span>}
      </span>
      {help && <span id={helpId} className="pse-field-help">{help}</span>}
      {error && <span id={errorId} className="pse-field-error">{error}</span>}
    </label>
  )
}

function SelectField({ id, label, value, options, onChange, placeholder, error, testId }) {
  const errorId = `${id}-error`
  return (
    <label className="pse-field" htmlFor={id}>
      <span className="pse-field-label"><span>{label}</span></span>
      <span className="pse-control-wrap">
        <select
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          data-testid={testId}
        >
          <option value="">{placeholder}</option>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>{optionLabel}</option>
          ))}
        </select>
      </span>
      {error && <span id={errorId} className="pse-field-error">{error}</span>}
    </label>
  )
}

function formatNumber(value, lang, maximumFractionDigits = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(Number(value))
}

function formatCurrency(value, lang, fractionDigits = 0) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—'
  return new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value))
}

function ProductIcon({ productType }) {
  if (productType === 'solar') return <Sun size={19} aria-hidden="true" />
  if (productType === 'airco') return <Wind size={19} aria-hidden="true" />
  return <PanelsTopLeft size={19} aria-hidden="true" />
}

function errorMessage(code, copy) {
  const messages = {
    required: copy.errorRequired,
    invalid: copy.errorInvalid,
    'out-of-range': copy.errorRange,
    'at-least-one-airco-use': copy.errorAircoUse,
    'exceeds-production': copy.errorExceedsProduction,
    'must-be-lower-than-before': copy.errorUValue,
    'exceeds-investment': copy.errorSubsidy,
  }
  return messages[code] || copy.errorGeneric
}

function assumptionMessage(code, copy) {
  const messages = {
    'maintenance-excluded': copy.assumptionMaintenance,
    'unconfirmed-subsidy-excluded': copy.assumptionUnconfirmed,
    'feed-in-costs-excluded': copy.assumptionFeedIn,
    'current-tariffs-held-constant': copy.assumptionTariffs,
    'no-degradation-maintenance-or-replacement-unless-entered': copy.assumptionDegradation,
    'solar-standalone-not-additive-to-battery-calculation': copy.assumptionSolar,
    'solar-self-use-estimated-from-daytime-presence': copy.assumptionSolarUse,
    'transmission-only-estimate': copy.assumptionTransmission,
    'standalone-not-additive-to-heat-pump-or-battery': copy.assumptionStandalone,
    'user-entered-annual-heat-and-cooling-delivery': copy.assumptionAirco,
  }
  return messages[code] || code
}

export default function ProductSavingsEstimator({
  initialProduct = 'solar',
  initialPart,
  initialSolarProduction,
  initialPanelCount,
}) {
  const languageContext = useLanguage()
  const lang = languageContext?.lang === 'en' ? 'en' : 'nl'
  const copy = COPY[lang]
  const [productType, setProductType] = useState(
    PRODUCT_TYPES.includes(initialProduct) ? initialProduct : 'solar',
  )
  const [formsByProduct, setFormsByProduct] = useState(() => {
    const forms = Object.fromEntries(
      PRODUCT_TYPES.map((type) => [type, createEmptyForm(type === initialProduct ? initialPart : undefined)]),
    )
    const production = Number(initialSolarProduction)
    const panelCount = Number(initialPanelCount)
    if (Number.isFinite(production) && production > 0) {
      forms.solar.annualProductionKwh = String(Math.round(production))
    }
    if (Number.isFinite(panelCount) && panelCount > 0) {
      forms.solar.panelCount = String(Math.round(panelCount))
    }
    return forms
  })
  const form = formsByProduct[productType]
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const update = (key, value) => {
    setFormsByProduct((current) => ({
      ...current,
      [productType]: { ...current[productType], [key]: value },
    }))
  }

  const updateAircoRoom = (index, key, value) => {
    update('aircoRooms', form.aircoRooms.map((room, roomIndex) => (
      roomIndex === index ? { ...room, [key]: value } : room
    )))
  }

  const updateScenarioRate = (scenario, key, value) => {
    setFormsByProduct((current) => ({
      ...current,
      [productType]: {
        ...current[productType],
        scenarioRates: {
          ...current[productType].scenarioRates,
          [scenario]: {
            ...current[productType].scenarioRates[scenario],
            [key]: value,
          },
        },
      },
    }))
  }

  const result = useMemo(() => {
    if (!hasSubmitted) return null
    return calculateProductSavings({ productType, ...form })
  }, [form, hasSubmitted, productType])
  const solarFlowEstimate = useMemo(() => (
    Number(form.annualProductionKwh) > 0 && Number(form.annualConsumptionKwh) > 0
      ? estimateSolarDirectSelfUse({
          annualProductionKwh: form.annualProductionKwh,
          annualConsumptionKwh: form.annualConsumptionKwh,
          daytimePresence: form.daytimePresence,
        })
      : null
  ), [form.annualProductionKwh, form.annualConsumptionKwh, form.daytimePresence])
  const aircoCapacity = useMemo(() => calculateAircoCapacity({
    rooms: form.aircoRooms,
    goal: form.aircoGoal,
  }), [form.aircoRooms, form.aircoGoal])
  const aircoAnnualEstimate = useMemo(
    () => estimateAircoAnnualElectricity(form.aircoRooms, form.aircoGoal),
    [form.aircoRooms, form.aircoGoal],
  )
  const aircoAnnualUsePreview = useMemo(() => {
    const {
      heatPumpElectricityKwh: heatingElectricityKwh,
      coolingElectricityKwh,
    } = calculateAircoElectricityUse(form)
    const values = [heatingElectricityKwh, coolingElectricityKwh].filter(Number.isFinite)
    return values.length
      ? {
          heatingElectricityKwh,
          coolingElectricityKwh,
          totalElectricityKwh: values.reduce((sum, value) => sum + value, 0),
          showTotal: values.length > 1,
        }
      : null
  }, [
    form.annualHeatDeliveredKwh,
    form.heatingScop,
    form.annualCoolingDeliveredKwh,
    form.coolingSeer,
  ])
  const aircoSingleSplitOptions = useMemo(() => (
    aircoCapacity.status === 'ready' && aircoCapacity.systemType === 'single-split'
      ? getSmallestSingleSplitOptions(aircoCapacity.rooms[0]?.recommendedCapacityKw)
      : []
  ), [aircoCapacity])
  const aircoMultiSplitOptions = useMemo(() => (
    aircoCapacity.status === 'ready' && aircoCapacity.systemType === 'multi-split'
      ? getSuitableMultiSplitPackages(aircoCapacity.rooms)
      : []
  ), [aircoCapacity])
  const aircoRecommendedModel = aircoCapacity.status !== 'ready' || aircoCapacity.hasUnknownInsulation
    ? null
    : aircoCapacity.systemType === 'single-split'
      ? aircoSingleSplitOptions[0] || null
      : aircoMultiSplitOptions[0] || null

  const effectiveResult = result?.status === 'ready' ? result : null
  const realistic = effectiveResult?.scenarios?.realistic
  const errors = result?.status === 'incomplete' ? result.errors || {} : {}
  const heatingInUse = isNumericPositive(form.annualHeatDeliveredKwh)
  const coolingInUse = isNumericPositive(form.annualCoolingDeliveredKwh)
  const showInsulationGasFields = form.heatingSystem === 'gas'
  const showInsulationElectricRate = form.heatingSystem === 'heat-pump' || form.heatingSystem === 'direct-electric'
  const showAircoGasFields = heatingInUse && form.existingHeatingSystem === 'gas'
  const hasAircoSizingInput = form.aircoRooms.some((room) => room.areaM2 !== '' || room.insulationLevel !== '') ||
    form.aircoGoal !== ''

  const formatError = (key) => errors[key] ? errorMessage(errors[key], copy) : undefined
  const formatCapacityError = (key) => {
    if (!hasAircoSizingInput || !aircoCapacity.errors?.[key]) return undefined
    const messages = {
      required: copy.errorRequired,
      invalid: copy.errorInvalid,
      'out-of-range': copy.errorRange,
      'at-least-one-area': copy.errorAtLeastOneArea,
      'requires-professional-sizing': copy.aircoLargeLoad,
    }
    return messages[aircoCapacity.errors[key]] || copy.errorGeneric
  }
  const fieldError = (key) => {
    if (key === 'panelCount' && errors[key]) return copy.errorPanel
    return formatError(key)
  }

  const renderScenarioRates = (rateKeys) => (
    <details className="pse-scenario-details" data-testid="scenario-rates-details">
      <summary>{copy.scenarioTitle}</summary>
      <div className="pse-scenario-inner">
        <p>{copy.scenarioIntro}</p>
        {['cautious', 'favorable'].map((scenario) => (
          <section className="pse-scenario-group" key={scenario}>
            <h4>{copy[scenario]}</h4>
            <div className="pse-fields-grid">
              {rateKeys.map((key) => {
                const labels = {
                  electricityPriceEurPerKwh: copy.electricityPrice,
                  exportPriceEurPerKwh: copy.exportPrice,
                  gasPricePerM3: copy.gasPrice,
                }
                const unit = key === 'gasPricePerM3' ? copy.perM3 : copy.perKwh
                const testId = `input-scenario-${scenario}-${key}`
                return (
                  <Field
                    key={`${scenario}-${key}`}
                    id={testId}
                    name={`${scenario}-${key}`}
                    label={labels[key]}
                    value={form.scenarioRates[scenario][key]}
                    onChange={(value) => updateScenarioRate(scenario, key, value)}
                    unit={unit}
                    testId={testId}
                  />
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </details>
  )

  const renderField = (key, label, unit, options = {}) => (
    <Field
      key={key}
      id={`pse-${key}`}
      name={key}
      label={label}
      value={form[key]}
      onChange={(value) => update(key, value)}
      unit={unit}
      help={options.help}
      optional={options.optional ? copy.optional : false}
      error={options.error ?? fieldError(key)}
      inputMode={options.inputMode || 'decimal'}
      placeholder={options.placeholder}
      testId={`input-${key}`}
    />
  )

  const renderRate = (key, label, unit) => renderField(key, label, unit)

  const flowItems = (scenario) => {
    const flows = scenario.energyFlows || {}
    if (productType === 'solar') {
      return [
        [copy.flowProduction, `${formatNumber(flows.annualProductionKwh, lang)} ${copy.kwh}`],
        [copy.flowSelfUse, `${formatNumber(flows.directSelfUseKwh, lang)} ${copy.kwh}`],
        [copy.flowExport, `${formatNumber(flows.exportedKwh, lang)} ${copy.kwh}`],
        [copy.flowCapacity, flows.installedCapacityKwp == null
          ? copy.noCapacity
          : `${formatNumber(flows.installedCapacityKwp, lang, 2)} ${copy.kwp} (${formatNumber(flows.panelWp, lang, 0)} ${copy.watts})`],
      ]
    }
    if (productType === 'insulation') {
      const partLabel = {
        wall: copy.wall,
        floor: copy.floor,
        roof: copy.roof,
        glazing: copy.glazing,
      }[flows.part] || flows.part || '—'
      return [
        [copy.fieldPart, partLabel],
        [copy.flowArea, `${formatNumber(flows.areaM2, lang)} ${copy.m2}`],
        [copy.flowHeatLoss, `${formatNumber(flows.theoreticalHeatLossReductionKwh, lang)} ${copy.kwh}`],
        [copy.flowUsefulHeat, `${formatNumber(flows.usefulHeatSavedKwh, lang)} ${copy.kwh}`],
        ...(flows.heatingSystem === 'gas'
          ? [[copy.flowGasAvoided, `${formatNumber(flows.gasAvoidedM3, lang)} m³`]]
          : [[copy.flowElectricAvoided, `${formatNumber(flows.electricityAvoidedKwh, lang)} ${copy.kwh}`]]),
      ]
    }
    return [
      [copy.flowHeatDelivered, `${formatNumber(flows.annualHeatDeliveredKwh, lang)} ${copy.kwh}`],
      [copy.flowCoolingDelivered, `${formatNumber(flows.annualCoolingDeliveredKwh, lang)} ${copy.kwh}`],
      [copy.flowHeatPumpElectricity, `${formatNumber(flows.heatPumpElectricityKwh, lang)} ${copy.kwh}`],
      [copy.flowCoolingElectricity, `${formatNumber(flows.coolingElectricityKwh, lang)} ${copy.kwh}`],
      [copy.flowHeatingElectricityCost, formatCurrency(flows.heatingElectricityCostEur, lang)],
      [copy.flowCoolingElectricityCost, formatCurrency(flows.coolingElectricityCostEur, lang)],
      [copy.flowTotalElectricityCost, formatCurrency(flows.totalElectricityCostEur, lang)],
      ...(flows.annualHeatDeliveredKwh > 0
        ? flows.existingHeatingSystem === 'gas'
          ? [[copy.flowGasAvoided, `${formatNumber(flows.avoidedGasM3, lang)} m³`]]
          : [[copy.flowElectricAvoided, `${formatNumber(flows.avoidedElectricityKwh, lang)} ${copy.kwh}`]]
        : []),
    ]
  }

  const scenarioRows = [
    ['cautious', copy.cautious, effectiveResult?.scenarios?.cautious],
    ['realistic', copy.realistic, effectiveResult?.scenarios?.realistic],
    ['favorable', copy.favorable, effectiveResult?.scenarios?.favorable],
  ]

  const titleByProduct = {
    solar: copy.detailsSolar,
    insulation: copy.detailsInsulation,
    airco: copy.detailsAirco,
  }

  let scenarioRateKeys = []
  if (productType === 'solar') scenarioRateKeys = ['electricityPriceEurPerKwh', 'exportPriceEurPerKwh']
  if (productType === 'insulation') {
    scenarioRateKeys = form.heatingSystem === 'gas'
      ? ['gasPricePerM3']
      : showInsulationElectricRate ? ['electricityPriceEurPerKwh'] : []
  }
  if (productType === 'airco') {
    scenarioRateKeys = showAircoGasFields
      ? ['gasPricePerM3', 'electricityPriceEurPerKwh']
      : heatingInUse || coolingInUse ? ['electricityPriceEurPerKwh'] : []
  }

  const onSubmit = (event) => {
    event.preventDefault()
    if (productType === 'airco' && !event.currentTarget.querySelector('[data-testid="airco-savings-details"]')?.open) {
      return
    }
    const submittedResult = calculateProductSavings({ productType, ...form })
    setHasSubmitted(true)
    if (submittedResult.status === 'ready') {
      trackEvent('product_estimate_completed', {
        product: productType,
        source: 'manual',
      })
    }
    window.requestAnimationFrame(() => {
      document.getElementById('pse-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="pse-page">
      <header className="pse-topbar">
        <div className="pse-topbar-inner">
          <Link to="/aanbod" className="pse-back" data-testid="link-back-offers">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{copy.back}</span>
          </Link>
          <Link to="/" className="pse-wordmark" aria-label="SolarFast" data-testid="link-solarfast-home">
            <img src="/assets/solarfast-brand/logo-black.svg" alt="SolarFast" />
          </Link>
          <span className="pse-topbar-tag">{copy.topTag}</span>
        </div>
      </header>

      <main className="pse-main">
        <section className="pse-intro" aria-labelledby="pse-title">
          <p className="pse-eyebrow">{copy.eyebrow}</p>
          <h1 className="pse-title" id="pse-title">{copy.title}</h1>
          <p className="pse-intro-copy">{productType === 'airco' ? copy.aircoIntro : copy.intro}</p>
        </section>

        {productType !== 'airco' && initialProduct !== 'airco' && (
          <aside className="pse-scope" aria-labelledby="pse-scope-title" data-testid="calculation-limits">
            <span className="pse-scope-icon"><Info size={18} aria-hidden="true" /></span>
            <div>
              <h2 id="pse-scope-title">{copy.scopeTitle}</h2>
              <p>{copy.scopeIntro}</p>
              <ul>
                {copy.scopeItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </aside>
        )}

        {productType !== 'airco' && initialProduct !== 'airco' && (
        <div className="pse-product-switcher" role="group" aria-label={copy.product} data-testid="product-selector">
          {PRODUCT_TYPES.map((type) => {
            const selected = productType === type
            const label = copy[type]
            return (
              <button
                key={type}
                type="button"
                className="pse-product-option"
                aria-pressed={selected}
                onClick={() => {
                  setProductType(type)
                  setHasSubmitted(false)
                }}
                data-testid={`button-product-${type}`}
              >
                <span className="pse-product-icon"><ProductIcon productType={type} /></span>
                <span>
                  <strong>{label}</strong>
                  <small>{copy[`${type}Sub`]}</small>
                </span>
              </button>
            )
          })}
        </div>
        )}

        <form className="pse-form-card" onSubmit={onSubmit} noValidate>
          <div className="pse-section-heading">
            <div>
              <h2>{titleByProduct[productType]}</h2>
              <p>{productType === 'airco' ? copy.aircoFormHelp : copy.formHelp}</p>
            </div>
            <span className="pse-step-number" aria-hidden="true">01</span>
          </div>

          <div className="pse-form-body">
            {productType === 'airco' && (
              <section
                className="pse-field-section pse-airco-sizing"
                aria-labelledby="pse-airco-sizing-title"
                data-testid="airco-capacity-estimator"
              >
                <div className="pse-airco-sizing-heading">
                  <h3 id="pse-airco-sizing-title">{copy.aircoSizingTitle}</h3>
                  <p className="pse-section-note">{copy.aircoSizingHelp}</p>
                </div>
                <div className="pse-fields-grid">
                  <SelectField
                    id="pse-airco-room-count"
                    label={copy.aircoRoomCount}
                    value={String(form.aircoRooms.length)}
                    onChange={(value) => {
                      const count = Number(value)
                      update('aircoRooms', Array.from({ length: count }, (_, index) => (
                        form.aircoRooms[index] || { areaM2: '', insulationLevel: '' }
                      )))
                    }}
                    placeholder={copy.insulationQuestionPlaceholder}
                    options={Object.entries(copy.aircoRoomCountOptions)}
                    testId="select-airco-room-count"
                  />
                  <SelectField
                    id="pse-airco-goal"
                    label={copy.aircoGoal}
                    value={form.aircoGoal}
                    onChange={(value) => update('aircoGoal', value)}
                    placeholder={copy.insulationQuestionPlaceholder}
                    options={Object.entries(copy.aircoGoalOptions)}
                    error={formatCapacityError('goal')}
                    testId="select-airco-goal"
                  />
                </div>
                {form.aircoRooms.map((room, index) => (
                  <div className="pse-airco-room-fields" key={index}>
                    <h4>{copy.aircoRoomTitle(index + 1)}</h4>
                    <div className="pse-fields-grid">
                      <Field
                        id={`pse-airco-room-${index + 1}-area`}
                        name={`airco-room-${index + 1}-area`}
                        label={copy.aircoAreaLabel}
                        value={room.areaM2}
                        onChange={(value) => updateAircoRoom(index, 'areaM2', value)}
                        unit={copy.m2}
                        placeholder={copy.aircoAreaPlaceholder}
                        inputMode="decimal"
                        error={formatCapacityError(`room${index + 1}Area`)}
                        testId={`input-airco-room-${index + 1}-area`}
                      />
                      <SelectField
                        id={`pse-airco-room-${index + 1}-insulation`}
                        label={copy.aircoInsulation}
                        value={room.insulationLevel}
                        onChange={(value) => updateAircoRoom(index, 'insulationLevel', value)}
                        placeholder={copy.insulationQuestionPlaceholder}
                        options={Object.entries(copy.aircoInsulationOptions)}
                        error={formatCapacityError(`room${index + 1}Insulation`)}
                        testId={`select-airco-room-${index + 1}-insulation`}
                      />
                    </div>
                  </div>
                ))}
                <div className="pse-airco-guideline">
                  <p>{copy.aircoRule}</p>
                  <a href={AIRCO_CAPACITY_GUIDANCE_SOURCE} target="_blank" rel="noopener noreferrer">
                    {copy.aircoSourceLabel} <ArrowRight size={13} aria-hidden="true" />
                  </a>
                </div>
                {aircoCapacity.status === 'ready' ? (
                  <>
                    <div className="pse-airco-result" data-testid="airco-capacity-result" aria-live="polite">
                      <div className="pse-airco-result-primary">
                        <span>{aircoCapacity.systemType === 'single-split' ? copy.aircoSystemSingle : copy.aircoSystemMulti}</span>
                        <strong data-testid="airco-recommended-kw">
                          {formatNumber(aircoCapacity.totalEstimatedCapacityKw, lang, 1)} kW
                        </strong>
                        <small>
                          {copy.aircoTotalCoolingLoad} · {copy.aircoTotalArea}: {formatNumber(aircoCapacity.totalAreaM2, lang, 1)} m²
                        </small>
                      </div>
                      <div className="pse-airco-result-split">
                        {aircoCapacity.rooms.map((room, index) => (
                          <div key={index}>
                            <span>
                              {copy.aircoRoomTitle(index + 1)} · {formatNumber(room.areaM2, lang, 1)} m²
                              {' · '}{copy.aircoInsulationOptions[room.insulationLevel]}
                              {' · '}{formatNumber(room.wattsPerM2, lang, 0)} W/m²
                            </span>
                            <strong>{copy.aircoCapacityByRoom(
                              formatNumber(room.estimatedCapacityKw, lang, 1),
                              formatNumber(room.recommendedCapacityKw, lang, 1),
                            )}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="pse-airco-disclaimer">{copy.aircoAreaWarning}</p>
                    {aircoAnnualEstimate && (
                      <div className="pse-airco-annual-use" data-testid="airco-average-annual-use">
                        <strong>{copy.aircoAnnualEstimateTitle}</strong>
                        <dl className="pse-detail-list">
                          {aircoAnnualEstimate.heatingElectricityKwh !== null && (
                            <div className="pse-detail-row">
                              <dt>
                                {copy.aircoAnnualEstimateHeating} · SCOP {formatNumber(aircoAnnualEstimate.scop, lang, 1)}
                              </dt>
                              <dd>
                                {formatNumber(aircoAnnualEstimate.heatingElectricityKwh, lang, 0)} {copy.kwh}/{lang === 'nl' ? 'jaar' : 'year'}
                                {' · ≈ '}{formatNumber(aircoAnnualEstimate.heatingElectricityKwh / 12, lang, 0)} {copy.kwh}/{lang === 'nl' ? 'gem. maand' : 'avg. month'}
                              </dd>
                            </div>
                          )}
                          {aircoAnnualEstimate.coolingElectricityKwh !== null && (
                            <div className="pse-detail-row">
                              <dt>
                                {copy.aircoAnnualEstimateCooling} · SEER {formatNumber(aircoAnnualEstimate.seer, lang, 1)}
                              </dt>
                              <dd>
                                {formatNumber(aircoAnnualEstimate.coolingElectricityKwh, lang, 0)} {copy.kwh}/{lang === 'nl' ? 'jaar' : 'year'}
                                {' · ≈ '}{formatNumber(aircoAnnualEstimate.coolingElectricityKwh / 12, lang, 0)} {copy.kwh}/{lang === 'nl' ? 'gem. maand' : 'avg. month'}
                              </dd>
                            </div>
                          )}
                        </dl>
                        <p>{copy.aircoAnnualEstimateBasis(
                          formatNumber(aircoAnnualEstimate.seer, lang, 1),
                          formatNumber(aircoAnnualEstimate.scop, lang, 1),
                        )}</p>
                      </div>
                    )}
                    {aircoCapacity.goal === 'cooling-heating' && (
                      <p className="pse-airco-disclaimer">{copy.aircoHeatingWarning}</p>
                    )}
                    {aircoCapacity.hasUnknownInsulation ? (
                      <p className="pse-airco-incomplete" role="status" data-testid="airco-unknown-sizing-warning">
                        {copy.aircoUnknownSizingWarning}
                      </p>
                    ) : aircoRecommendedModel ? (
                      <article className="pse-airco-recommendation" data-testid="airco-model-options">
                        <div className="pse-airco-recommendation-photo">
                          <div className="pse-airco-unit-pair">
                            {aircoRecommendedModel.brand === 'LG' ? (
                              <>
                                <figure>
                                  <img src="/assets/products/lg-standard-plus-indoor.png" alt="LG airco binnenunit" loading="lazy" />
                                  <figcaption>LG · binnenunit</figcaption>
                                </figure>
                                <figure>
                                  <img src="/assets/products/lg-standard-plus-outdoor.png" alt="LG airco buitenunit" loading="lazy" />
                                  <figcaption>LG · buitenunit</figcaption>
                                </figure>
                              </>
                            ) : (
                              <div className="pse-airco-photo-placeholder">Binnenunit · foto volgt</div>
                            )}
                            <div className="pse-airco-photo-placeholder">Buitenunit · foto volgt</div>
                          </div>
                        </div>
                        <div className="pse-airco-recommendation-content">
                          <span className="pse-airco-recommendation-kicker">{copy.aircoRecommendationTitle}</span>
                          <h3>{aircoRecommendedModel.brand} {aircoRecommendedModel.range}</h3>
                          {aircoCapacity.systemType === 'single-split' ? (
                            <>
                              <p>{aircoRecommendedModel.model || copy.aircoSystemSingle}</p>
                              <div className="pse-airco-recommendation-spec">
                                <span>{copy.aircoRecommendedCoolingCapacity}</span>
                                <strong>{formatNumber(aircoRecommendedModel.capacityKw, lang, 1)} kW</strong>
                              </div>
                            </>
                          ) : (
                            <div className="pse-airco-recommendation-specs">
                              <div>
                                <span>{copy.aircoRecommendedIndoorUnits}</span>
                                <strong>{aircoRecommendedModel.indoorCapacitiesKw.map((kw) => `${formatNumber(kw, lang, 1)} kW`).join(' + ')}</strong>
                              </div>
                              <div>
                                <span>{copy.aircoRecommendedOutdoorUnit}</span>
                                <strong>{formatNumber(aircoRecommendedModel.outdoorCapacityKw, lang, 1)} kW</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    ) : (
                      <p className="pse-airco-incomplete" role="status">
                        {aircoCapacity.systemType === 'single-split' ? copy.aircoNoSingleModel : copy.aircoNoMultiPackage}
                      </p>
                    )}
                  </>
                ) : (
                  hasAircoSizingInput && (
                    <p className="pse-airco-incomplete" role="status">
                      {copy.aircoFillRequired}
                    </p>
                  )
                )}
              </section>
            )}

            {productType === 'solar' && (
              <section className="pse-field-section" aria-labelledby="pse-solar-fields-title">
                <h3 id="pse-solar-fields-title">{copy.energyTitleSolar}</h3>
                <p className="pse-section-note">{copy.solarProductionHelp}</p>
                <div className="pse-fields-grid">
                  {renderField('annualProductionKwh', copy.solarProduction, copy.kwh, { help: copy.solarProductionHelp })}
                  {renderField('annualConsumptionKwh', copy.annualConsumption, copy.kwh)}
                  <SelectField
                    id="pse-daytime-presence"
                    label={copy.daytimePresence}
                    value={form.daytimePresence}
                    onChange={(value) => update('daytimePresence', value)}
                    options={Object.entries(copy.daytimePresenceOptions)}
                    testId="select-daytime-presence"
                  />
                  {renderRate('electricityPriceEurPerKwh', copy.electricityPrice, copy.perKwh)}
                  {renderRate('exportPriceEurPerKwh', copy.exportPrice, copy.perKwh)}
                  {renderField('annualFeedInCostsEur', copy.feedInCosts, copy.perYearEur, { optional: true })}
                  {renderField('panelCount', copy.panelCount, copy.panel, { help: copy.panelCountHelp, optional: true, inputMode: 'numeric' })}
                </div>
                <p className="pse-section-note">{copy.solarProfileAssumption}</p>
                {solarFlowEstimate && (
                  <div className="pse-solar-estimate" data-testid="solar-flow-estimate">
                    <strong>{copy.solarEstimateHint}</strong>
                    <span>{copy.flowSelfUse}: {formatNumber(solarFlowEstimate.estimatedDirectSelfUseKwh, lang)} {copy.kwh}</span>
                    <span>{copy.flowExport}: {formatNumber(solarFlowEstimate.estimatedExportKwh, lang)} {copy.kwh}</span>
                  </div>
                )}
                {scenarioRateKeys.length > 0 && renderScenarioRates(scenarioRateKeys)}
              </section>
            )}

            {productType === 'insulation' && (
              <section className="pse-field-section" aria-labelledby="pse-insulation-fields-title">
                <h3 id="pse-insulation-fields-title">{copy.energyTitleInsulation}</h3>
                <p className="pse-section-note">{copy.uHelp}</p>
                <div className="pse-fields-grid">
                  <SelectField
                    id="pse-part"
                    label={copy.part}
                    value={form.part}
                    onChange={(value) => update('part', value)}
                    placeholder={copy.choosePart}
                    options={PART_TYPES.map((part) => [part, copy[part]])}
                    error={fieldError('part')}
                    testId="select-part"
                  />
                  {renderField('areaM2', copy.area, copy.m2)}
                  {renderField('uValueBefore', copy.uBefore, 'W/m²K', { help: copy.uHelp })}
                  {renderField('uValueAfter', copy.uAfter, 'W/m²K', { help: copy.uHelp })}
                  {renderField('heatingDegreeDays18C', copy.degreeDays, copy.degreeDaysUnit)}
                  {renderField('annualSpaceHeatDemandKwh', copy.heatDemand, copy.kwh, { help: copy.heatDemandHelp })}
                  <SelectField
                    id="pse-heating-system"
                    label={copy.heatingSystem}
                    value={form.heatingSystem}
                    onChange={(value) => update('heatingSystem', value)}
                    placeholder={copy.chooseHeating}
                    options={[
                      ['gas', copy.gas],
                      ['heat-pump', copy.heatPump],
                      ['direct-electric', copy.directElectric],
                    ]}
                    error={fieldError('heatingSystem')}
                    testId="select-heating-system"
                  />
                  {showInsulationGasFields && (
                    <>
                      {renderField('gasEnergyKwhPerM3', copy.gasEnergy, `${copy.kwh}/m³`)}
                      {renderField('boilerEfficiencyPct', copy.boilerEfficiency, copy.percent)}
                      {renderRate('gasPricePerM3', copy.gasPrice, copy.perM3)}
                    </>
                  )}
                  {form.heatingSystem === 'heat-pump' && renderField('scop', copy.scop, '')}
                  {showInsulationElectricRate && renderRate('electricityPriceEurPerKwh', copy.electricityPrice, copy.perKwh)}
                </div>
                {scenarioRateKeys.length > 0 && renderScenarioRates(scenarioRateKeys)}
              </section>
            )}

            {productType === 'airco' && (
              <details className="pse-scenario-details pse-airco-financial-details" data-testid="airco-savings-details">
                <summary>{copy.aircoOptionalSavingsTitle}</summary>
                <p className="pse-airco-financial-note">{copy.aircoOptionalSavingsHelp}</p>
                <div className="pse-airco-financial-body">
                  <section className="pse-field-section" aria-labelledby="pse-airco-fields-title">
                    <h3 id="pse-airco-fields-title">{copy.energyTitleAirco}</h3>
                    <p className="pse-section-note">{copy.aircoSavingsHelp}</p>
                    <div className="pse-fields-grid">
                      {renderField('annualHeatDeliveredKwh', copy.annualHeat, copy.kwh, { help: copy.annualHeatHelp })}
                      {renderField('annualCoolingDeliveredKwh', copy.annualCooling, copy.kwh, { help: copy.annualCoolingHelp })}
                      {heatingInUse && renderField('heatingScop', copy.heatingScop, '', { help: copy.heatingScopHelp })}
                      {coolingInUse && renderField('coolingSeer', copy.coolingSeer, '', { help: copy.coolingSeerHelp })}
                      {heatingInUse && (
                        <SelectField
                          id="pse-existing-heating-system"
                          label={copy.existingSystem}
                          value={form.existingHeatingSystem}
                          onChange={(value) => update('existingHeatingSystem', value)}
                          placeholder={copy.chooseExistingSystem}
                          options={[
                            ['gas', copy.gas],
                            ['direct-electric', copy.directElectric],
                          ]}
                          error={fieldError('existingHeatingSystem')}
                          testId="select-existing-heating-system"
                        />
                      )}
                      {heatingInUse && form.existingHeatingSystem === 'direct-electric' &&
                        renderField('directHeaterEfficiency', copy.directHeaterEfficiency, '', {
                          help: copy.directHeaterEfficiencyHelp,
                        })}
                      {showAircoGasFields && (
                        <>
                          {renderField('annualGasUseM3', copy.annualGasUse, 'm³/jaar')}
                          {renderField('gasEnergyKwhPerM3', copy.gasEnergy, `${copy.kwh}/m³`)}
                          {renderField('boilerEfficiencyPct', copy.boilerEfficiency, copy.percent)}
                          {renderRate('gasPricePerM3', copy.gasPrice, copy.perM3)}
                        </>
                      )}
                      {(heatingInUse || coolingInUse) &&
                        renderRate('electricityPriceEurPerKwh', copy.electricityPrice, copy.perKwh)}
                    </div>
                    {aircoAnnualUsePreview && (
                      <div className="pse-airco-annual-use" aria-live="polite" data-testid="airco-annual-use-preview">
                        <strong>{copy.aircoAnnualUseTitle}</strong>
                        <dl className="pse-detail-list">
                          {aircoAnnualUsePreview.heatingElectricityKwh !== null && (
                            <div className="pse-detail-row">
                              <dt>{copy.aircoAnnualHeatingKwh}</dt>
                              <dd>{formatNumber(aircoAnnualUsePreview.heatingElectricityKwh, lang, 0)} {copy.kwh}/{lang === 'nl' ? 'jaar' : 'year'}</dd>
                            </div>
                          )}
                          {aircoAnnualUsePreview.coolingElectricityKwh !== null && (
                            <div className="pse-detail-row">
                              <dt>{copy.aircoAnnualCoolingKwh}</dt>
                              <dd>{formatNumber(aircoAnnualUsePreview.coolingElectricityKwh, lang, 0)} {copy.kwh}/{lang === 'nl' ? 'jaar' : 'year'}</dd>
                            </div>
                          )}
                          {aircoAnnualUsePreview.showTotal && (
                            <div className="pse-detail-row">
                              <dt>{copy.aircoAnnualTotalKwh}</dt>
                              <dd>{formatNumber(aircoAnnualUsePreview.totalElectricityKwh, lang, 0)} {copy.kwh}/{lang === 'nl' ? 'jaar' : 'year'}</dd>
                            </div>
                          )}
                        </dl>
                        <p>{copy.aircoAnnualUsePreviewHelp}</p>
                      </div>
                    )}
                    {scenarioRateKeys.length > 0 && renderScenarioRates(scenarioRateKeys)}
                  </section>

                  <section className="pse-field-section" aria-labelledby="pse-investment-title">
                    <h3 id="pse-investment-title">{copy.investmentTitle}</h3>
                    <p className="pse-section-note">{copy.investmentHint}</p>
                    <div className="pse-fields-grid">
                      {renderField('investmentEur', copy.investment, '€')}
                      {form.subsidyConfirmed && renderField('confirmedSubsidyEur', copy.confirmedSubsidy, '€')}
                    </div>
                    <div className="pse-check-panel">
                      <input
                        id="pse-subsidy-confirmed"
                        type="checkbox"
                        checked={form.subsidyConfirmed}
                        onChange={(event) => update('subsidyConfirmed', event.target.checked)}
                        data-testid="checkbox-subsidy-confirmed"
                      />
                      <div>
                        <label htmlFor="pse-subsidy-confirmed">{copy.subsidyCheck}</label>
                        <p>{copy.subsidyHelp}</p>
                      </div>
                    </div>
                  </section>

                  <div className="pse-submit-row">
                    <p className="pse-submit-note">{copy.submitHint}</p>
                    <button className="pse-submit" type="submit" data-testid="button-calculate-savings">
                      {copy.calculate}
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </details>
            )}

            {productType !== 'airco' && (
              <>
                <section className="pse-field-section" aria-labelledby="pse-investment-title">
                  <h3 id="pse-investment-title">{copy.investmentTitle}</h3>
                  <p className="pse-section-note">{copy.investmentHint}</p>
                  <div className="pse-fields-grid">
                    {renderField('investmentEur', copy.investment, '€')}
                    {renderField('annualMaintenanceEur', copy.maintenance, copy.perYearEur, { optional: true })}
                    {form.subsidyConfirmed && renderField('confirmedSubsidyEur', copy.confirmedSubsidy, '€')}
                  </div>
                  <div className="pse-check-panel">
                    <input
                      id="pse-subsidy-confirmed"
                      type="checkbox"
                      checked={form.subsidyConfirmed}
                      onChange={(event) => update('subsidyConfirmed', event.target.checked)}
                      data-testid="checkbox-subsidy-confirmed"
                    />
                    <div>
                      <label htmlFor="pse-subsidy-confirmed">{copy.subsidyCheck}</label>
                      <p>{copy.subsidyHelp}</p>
                    </div>
                  </div>
                </section>

                <div className="pse-submit-row">
                  <p className="pse-submit-note">{copy.submitHint}</p>
                  <button className="pse-submit" type="submit" data-testid="button-calculate-savings">
                    {copy.calculate}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>
        </form>

        {hasSubmitted && result?.status === 'incomplete' && (
          <section className="pse-incomplete" id="pse-result" role="alert" aria-live="assertive" data-testid="result-incomplete">
            <AlertCircle size={19} aria-hidden="true" />
            <div>
              <h2>{copy.missingTitle}</h2>
              <p>{copy.missingText}</p>
            </div>
          </section>
        )}

        {hasSubmitted && result?.status === 'unsupported' && (
          <section className="pse-incomplete" id="pse-result" role="alert" data-testid="result-unsupported">
            <AlertCircle size={19} aria-hidden="true" />
            <div><h2>{copy.missingTitle}</h2><p>{copy.unsupported}</p></div>
          </section>
        )}

        {effectiveResult && realistic && (
          <section className="pse-result-card" id="pse-result" aria-labelledby="pse-result-title" data-testid="result-ready">
            <header className="pse-result-header">
              <h2 id="pse-result-title">{copy.resultTitle}</h2>
              <p>{copy.resultIntro}</p>
            </header>
            <div className="pse-result-body">
              <div className="pse-realistic-panel" data-testid="result-realistic">
                <div>
                  <p className="pse-result-kicker">{copy.realistic} · {copy.annualNet}</p>
                  <p className="pse-main-value" data-testid="result-annual-net">
                    {formatCurrency(realistic.annualNetSavingsEur, lang, 0)}
                    <small>{copy.perYear}</small>
                  </p>
                  <p className="pse-realistic-caption">
                    {productType === 'airco' ? copy.resultCaptionAirco : copy.resultCaption}
                  </p>
                </div>
                <div className="pse-primary-metrics">
                  <div className="pse-primary-metric">
                    <span>{copy.payback}</span>
                    <strong data-testid="result-payback">
                      {realistic.paybackYears == null
                        ? copy.noPayback
                        : `${formatNumber(realistic.paybackYears, lang, 1)} ${lang === 'nl' ? 'jaar' : 'years'}`}
                    </strong>
                  </div>
                  <div className="pse-primary-metric">
                    <span>{copy.roi}</span>
                    <strong data-testid="result-roi">
                      {realistic.roiPct == null ? copy.noRoi : `${formatNumber(realistic.roiPct, lang)}${copy.percent}`}
                    </strong>
                  </div>
                </div>
              </div>

              <section className="pse-result-section" aria-labelledby="pse-scenarios-heading">
                <h3 id="pse-scenarios-heading">{copy.scenarioCompare}</h3>
                <p className="pse-scenario-result-note">{copy.scenarioComparisonHelp}</p>
                <div className="pse-comparison" role="table" aria-label={copy.scenarioCompare} data-testid="scenario-comparison">
                  <div className="pse-comparison-head" role="row">
                    <span role="columnheader">{copy.scenarioLabel}</span>
                    <span role="columnheader">{copy.annualSavings}</span>
                    <span role="columnheader">{copy.paybackShort}</span>
                    <span role="columnheader">{copy.roiShort}</span>
                  </div>
                  {scenarioRows.map(([id, label, scenario]) => (
                    <div className={`pse-comparison-row ${id === 'realistic' ? 'is-realistic' : ''}`} role="row" key={id}>
                      <strong role="rowheader">{label}</strong>
                      <span role="cell" data-label={copy.annualSavings} data-testid={`scenario-${id}-annual-net`}>
                        {scenario ? formatCurrency(scenario.annualNetSavingsEur, lang, 0) : <span className="pse-unavailable">{copy.notProvided}</span>}
                      </span>
                      <span role="cell" data-label={copy.paybackShort}>
                        {scenario?.paybackYears == null
                          ? scenario ? copy.noPayback : <span className="pse-unavailable">{copy.notProvided}</span>
                          : `${formatNumber(scenario.paybackYears, lang, 1)} ${lang === 'nl' ? 'jr' : 'yr'}`}
                      </span>
                      <span role="cell" data-label={copy.roiShort}>
                        {scenario
                          ? scenario.roiPct == null ? copy.noRoi : `${formatNumber(scenario.roiPct, lang)}${copy.percent}`
                          : <span className="pse-unavailable">{copy.notProvided}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="pse-detail-columns">
                <section className="pse-result-section" aria-labelledby="pse-financial-heading">
                  <h3 id="pse-financial-heading">{copy.financialTitle}</h3>
                  <dl className="pse-detail-list">
                    <div className="pse-detail-row"><dt>{copy.grossSavings}</dt><dd>{formatCurrency(realistic.annualGrossSavingsEur, lang)}</dd></div>
                    <div className="pse-detail-row"><dt>{copy.extraCosts}</dt><dd>{formatCurrency(realistic.annualExtraCostsEur, lang)}</dd></div>
                    <div className="pse-detail-row"><dt>{copy.grossInvestment}</dt><dd>{formatCurrency(realistic.grossInvestmentEur, lang)}</dd></div>
                    <div className="pse-detail-row"><dt>{copy.subsidy}</dt><dd>{formatCurrency(realistic.confirmedSubsidyEur, lang)}</dd></div>
                    <div className="pse-detail-row"><dt>{copy.investmentNet}</dt><dd data-testid="result-net-investment">{formatCurrency(realistic.netInvestmentEur, lang)}</dd></div>
                  </dl>
                </section>
                <section className="pse-result-section" aria-labelledby="pse-flow-heading">
                  <h3 id="pse-flow-heading">{copy.energyTitle}</h3>
                  <dl className="pse-detail-list">
                    {flowItems(realistic).map(([label, value]) => (
                      <div className="pse-detail-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>
                    ))}
                  </dl>
                </section>
              </div>

              <section className="pse-result-section" aria-labelledby="pse-projections-heading">
                <h3 id="pse-projections-heading">{copy.projectionsTitle}</h3>
                <div className="pse-projection-list" data-testid="result-projections">
                  {realistic.projections.map((projection) => (
                    <div className="pse-projection-item" key={projection.years}>
                      <span>{copy.projectionYears(projection.years)}</span>
                      <strong>{formatCurrency(projection.netFinancialResultEur, lang)}</strong>
                      <small>{copy.netResult}</small>
                    </div>
                  ))}
                </div>
                <p className="pse-section-note pse-projection-note">{copy.projectionsHelp}</p>
              </section>

              <section className="pse-assumptions" aria-labelledby="pse-assumptions-heading">
                <h3 id="pse-assumptions-heading">{copy.assumptionsTitle}</h3>
                <ul>
                  {effectiveResult.assumptions.map((assumption) => (
                    <li key={assumption}>{assumptionMessage(assumption, copy)}</li>
                  ))}
                  {form.subsidyConfirmed && realistic.confirmedSubsidyEur > 0 && (
                    <li>{lang === 'nl'
                      ? 'Het bevestigde subsidiebedrag is op uw netto-investering in mindering gebracht.'
                      : 'The confirmed subsidy amount has been deducted from your net investment.'}</li>
                  )}
                </ul>
              </section>
            </div>
          </section>
        )}

        <nav className="pse-footer-links" aria-label={lang === 'nl' ? 'Gerelateerde pagina’s' : 'Related pages'}>
          <Link to="/aanbod" className="pse-existing-link" data-testid="link-footer-offers">
            <ArrowLeft size={14} aria-hidden="true" /> {copy.backOffer}
          </Link>
          <Link to="/calculator" className="pse-existing-link" data-testid="link-existing-calculator">
            {copy.existingCalc} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      </main>
      <div className="pse-a11y-live" aria-live="polite">
        {effectiveResult ? copy.resultTitle : hasSubmitted && result?.status === 'incomplete' ? copy.missingTitle : ''}
      </div>
    </div>
  )
}
