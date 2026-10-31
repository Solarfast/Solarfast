import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Battery, Car, ChevronDown, Cpu, Euro, Search, Shield, Wrench, Zap } from 'lucide-react'
import Nav from '../components/Nav.jsx'
import { useLanguage } from '../context/LanguageContext'
import './SolarFastMarketing.css'

const ease = [0.22, 1, 0.36, 1]

function FAQItem({ id, question, answer, open, onToggle, reduceMotion }) {
  const panelId = `faq-answer-${id}`
  return (
    <div className="border-b border-[#244b39]/10 last:border-0">
      <h3>
        <button
          id={`faq-question-${id}`}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-5 py-5 text-left"
        >
          <span className="font-semibold leading-snug text-[#23342b] transition-colors group-hover:text-[#244b39]">
            {question}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-[#718875] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>
      {open && (
        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={`faq-question-${id}`}
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease }}
          className="pb-5"
        >
          <p className="max-w-3xl text-base leading-7 text-[#68766c]">{answer}</p>
        </motion.div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const { lang } = useLanguage()
  const nl = lang === 'nl'
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [openItem, setOpenItem] = useState('0-0')
  const [faqSearch, setFaqSearch] = useState('')

  const sections = nl ? [
    {
      label: 'Thuisbatterij', icon: <Battery />,
      items: [
        ['Wat doet een thuisbatterij?', 'Een thuisbatterij slaat elektriciteit op om die op een later moment te gebruiken. Hoe een systeem uitpakt, hangt onder meer af van uw verbruik, opwek en gekozen instellingen.'],
        ['Welke capaciteiten zijn er voor HYXiPower All-in-One?', 'De beschikbare capaciteiten zijn 10,6, 15,9, 21,2 en 26,5 kWh. Welke variant bij uw situatie past, bespreken we aan de hand van uw verbruik en aansluiting.'],
        ['Heb ik zonnepanelen nodig?', 'Niet per se. De manier waarop een batterij wordt geladen en gebruikt, hangt af van uw energiecontract, installatie en verbruik. Laat uw situatie beoordelen voordat u een keuze maakt.'],
        ['Kan een thuisbatterij noodstroom leveren?', 'Back-upmogelijkheden hangen af van de gekozen configuratie en installatie. Vraag vooraf welke onderdelen en werkzaamheden voor uw situatie nodig zijn.'],
      ],
    },
    {
      label: 'HYXiPower & app', icon: <Cpu />,
      items: [
        ['Wat is HYXiPower?', 'HYXiPower is een partner van SolarFast. SolarFast levert en installeert onder meer de HYXiPower All-in-One thuisbatterij.'],
        ['Welke All-in-One capaciteiten zijn beschikbaar?', 'De beschikbare capaciteiten zijn 10,6, 15,9, 21,2 en 26,5 kWh. Dit zijn vier systeemvarianten; informeer naar de productspecificaties en configuratie die bij uw situatie passen.'],
        ['Werkt de batterij met mijn bestaande zonnepanelen of omvormer?', 'Compatibiliteit is afhankelijk van de bestaande installatie en de gekozen configuratie. Laat merk, model en aansluiting vooraf controleren.'],
        ['Wat kan ik zien in de app?', 'De mogelijkheden van de app hangen af van de uitvoering en softwareversie. Vraag bij uw voorstel welke functies en eventuele kosten op dat moment gelden.'],
      ],
    },
    {
      label: 'Warmtefonds', icon: <Euro />,
      items: [
        ['Waar vind ik de actuele voorwaarden van het Warmtefonds?', 'Leenbedragen, rente, maatregelen en voorwaarden kunnen wijzigen. Controleer de actuele informatie rechtstreeks bij het Nationaal Warmtefonds voordat u een financieringsbeslissing neemt.'],
        ['Komt een thuisbatterij in aanmerking voor financiering?', 'Dat hangt af van de actuele regeling en uw persoonlijke situatie. Controleer de voorwaarden bij het Warmtefonds; ga er niet van uit dat een product of aanvrager automatisch in aanmerking komt.'],
        ['Welke gegevens heb ik nodig voor een aanvraag?', 'De benodigde documenten en gegevens hangen af van de actuele regeling en uw situatie. Het Warmtefonds vermeldt welke informatie nodig is tijdens de aanvraag.'],
        ['Kan ik vooraf zien hoeveel ik kan lenen?', 'Gebruik de actuele rekentool en voorwaarden van het Warmtefonds. Een indicatie is geen definitieve beoordeling van uw aanvraag.'],
        ['Kan SolarFast mijn aanvraag goedkeuren?', 'Nee. SolarFast kan informatie over een maatregel geven, maar alleen het Warmtefonds beoordeelt en beslist over een financieringsaanvraag.'],
        ['Zijn rente en voorwaarden altijd hetzelfde?', 'Nee. Rente, looptijd en voorwaarden kunnen veranderen en kunnen afhangen van de regeling en aanvrager. Controleer altijd de actuele informatie bij het Warmtefonds.'],
        ['Kan SolarFast mij helpen met mijn vragen?', 'Neem contact op om uw plannen te bespreken. Voor een aanvraag, definitieve beoordeling of actuele voorwaarden is het Warmtefonds zelf de aangewezen bron.'],
      ],
    },
    {
      label: 'Kosten & berekening', icon: <Shield />,
      items: [
        ['Wat kost een thuisbatterij?', 'De prijs hangt af van onder meer de gekozen configuratie en de installatie. Vraag een voorstel aan voor een prijs die op uw situatie is gebaseerd.'],
        ['Wat laat de calculator zien?', 'De calculator maakt een indicatieve berekening op basis van de gegevens en aannames die u invoert. Uitkomsten zijn geen garantie op een bepaald rendement, besparing of terugverdientijd.'],
        ['Hoe lang duurt het voordat een batterij is terugverdiend?', 'Dat is afhankelijk van de aanschafprijs, energieprijzen, verbruik, instellingen en andere omstandigheden. Een berekening is een scenario, geen belofte over toekomstige resultaten.'],
      ],
    },
    {
      label: 'Installatie & service', icon: <Wrench />,
      items: [
        ['Wie voert de installatie uit?', 'Vraag vooraf welke installateur uw project uitvoert. Controleer in het InstallQ-register of die specifieke installateur voor het relevante vakgebied erkend is.'],
        ['Wat moet ik voorbereiden?', 'De benodigde voorbereiding verschilt per woning en installatie. Na inventarisatie kan worden besproken welke werkzaamheden en gegevens nodig zijn.'],
        ['Waar vind ik informatie over een erkenning?', 'Erkenning is gekoppeld aan de specifieke installateur en het relevante vakgebied. Controleer de uitvoerder zelf in het InstallQ-register.'],
      ],
    },
    {
      label: 'Laadpaal & integraties', icon: <Car />,
      items: [
        ['Kan een thuisbatterij samenwerken met een laadpaal of warmtepomp?', 'Dat hangt af van de apparatuur, aansluiting en gekozen instellingen. Laat de combinatie vooraf op compatibiliteit en benodigde werkzaamheden beoordelen.'],
        ['Werkt elk systeem met een dynamisch energiecontract?', 'Geschiktheid hangt af van productconfiguratie, software en contract. Vraag welke functionaliteit op dit moment beschikbaar is voor uw gekozen systeem.'],
        ['Kan ik bestaande apparatuur behouden?', 'Dat kan niet zonder controle worden bevestigd. Deel merk en model van uw huidige apparatuur zodat de combinatie kan worden beoordeeld.'],
      ],
    },
    {
      label: 'Stroom & energierekening', icon: <Zap />,
      items: [
        ['Wat is het verschil tussen kW en kWh?', 'kW is het vermogen op een bepaald moment. kWh is de hoeveelheid elektriciteit die over een periode is verbruikt of opgewekt. Batterijcapaciteit staat meestal in kWh; laad- en ontlaadvermogen in kW.'],
        ['Wat is het verschil tussen zelfverbruik en zelfvoorziening?', 'Zelfverbruik is het deel van uw zonnestroom dat u direct zelf gebruikt. Zelfvoorziening is het deel van uw totale stroomverbruik dat door eigen opwek wordt gedekt. Dit zijn verschillende percentages.'],
        ['Waarom wijkt mijn energierekening af van de calculator?', 'Een rekening bevat meer dan stroomverbruik: ook vaste kosten, belastingen, terugleververgoeding en eventuele terugleverkosten kunnen meetellen. De calculator gebruikt de waarden die u invult.'],
        ['Wat zijn terugleverkosten en terugleververgoeding?', 'De vergoeding is wat uw leverancier betaalt voor teruggeleverde stroom. Terugleverkosten zijn eventuele aparte kosten. Bedragen en voorwaarden verschillen per contract en leverancier.'],
        ['Hoe werkt een dynamisch energiecontract?', 'Bij een dynamisch contract verandert de stroomprijs per uur of kwartier, afhankelijk van leverancier en meter. Belastingen en andere kosten blijven van invloed; een lage marktprijs is niet automatisch uw totale stroomprijs.'],
        ['Wat betekent een negatieve stroomprijs?', 'Een negatieve marktprijs betekent niet automatisch dat u geld ontvangt voor verbruik of teruglevering. Leveranciersvoorwaarden, belastingen, opslagen en eventuele terugleverkosten bepalen wat u werkelijk betaalt of ontvangt.'],
        ['Welke gegevens van mijn energierekening heb ik nodig?', 'Gebruik jaarverbruik, zonnestroomopwek en teruglevering over dezelfde periode. Noteer ook uw stroomtarief, terugleververgoeding en terugleverkosten, met de juiste eenheid: per kWh of per jaar.'],
        ['Kan ik een jaarbedrag aan terugleverkosten invullen?', 'Ja, als uw leverancier een vast jaarbedrag rekent. Worden kosten per teruggeleverde kWh berekend, gebruik dan het tarief per kWh. Volg de eenheid op uw contract of rekening.'],
      ],
    },
    {
      label: 'Maatregelen combineren', icon: <Battery />,
      items: [
        ['Kan ik een thuisbatterij en warmtepomp samen laten berekenen?', 'Ja. De extra stroomvraag van de warmtepomp moet dan in de huishoudberekening worden meegenomen. Losse besparingen simpelweg optellen kan dezelfde energiestroom dubbel tellen.'],
        ['Kan ik na de berekening nog een maatregel toevoegen?', 'De benodigde gegevens hangen af van de maatregel. Voor een warmtepomp zijn woning- en verwarmingsgegevens nodig; voor een airco onder meer het aantal ruimtes, de oppervlakte en of u wilt koelen, verwarmen of beide.'],
        ['Waarom vraagt een combinatieberekening om andere gegevens?', 'Een extra apparaat verandert het stroomverbruik en kan invloed hebben op inkoop, teruglevering en batterijgebruik. Daarom vraagt een combinatieberekening aanvullende gegevens en rekent die het huishouden opnieuw door.'],
        ['Zijn de uitkomsten van een combinatie gegarandeerd?', 'Nee. Het is een schatting op basis van uw invoer en expliciete aannames. Werkelijke resultaten hangen onder meer af van gebruik, instellingen, weer, installatie en energiecontract.'],
      ],
    },
    {
      label: 'Zonnepanelen', icon: <Zap />,
      items: [
        ['Wat bepaalt de opbrengst van zonnepanelen?', 'Opbrengst hangt onder meer af van paneelvermogen, dakrichting, helling, schaduw, temperatuur en omvormer. Een installateur kan de verwachte opbrengst voor uw woning beoordelen.'],
        ['Waarom worden panelen op noord niet standaard meegeteld?', 'Een noordvlak levert doorgaans minder op dan geschikte zuid-, oost- of westvlakken. De scanner richt zich op bruikbare dakvlakken en kan details zoals schaduw of obstakels missen.'],
        ['Waarom verschilt mijn werkelijke opbrengst van de scan?', 'Weer, schaduw, oriëntatie, dakhelling, paneelkeuze, omvormer en systeeminstellingen beïnvloeden de opbrengst. Een schatting is geen productiegarantie.'],
        ['Kan ik zelf zien hoeveel panelen passen?', 'De scanner maakt een eerste paneelplan op basis van beschikbare dakinformatie. De definitieve indeling volgt pas na controle van dakmaten, obstakels, veiligheidsafstanden en montage.'],
      ],
    },
    {
      label: 'Warmtepomp & airco', icon: <Wrench />,
      items: [
        ['Wat is het verschil tussen kW en jaarlijks stroomverbruik?', 'kW beschrijft het vermogen op een moment; kWh per jaar beschrijft energiegebruik over een jaar. Een groter vermogen betekent niet automatisch dat een apparaat het hele jaar meer stroom gebruikt.'],
        ['Welke gegevens zijn belangrijk voor warmtepompadvies?', 'Woningtype, verwarmd oppervlak, isolatie, huidig gasverbruik, afgiftesysteem en gewenste aanvoertemperatuur helpen de warmtevraag en mogelijke systeemconfiguratie in te schatten.'],
        ['Kan een airco ook verwarmen?', 'Veel airco’s kunnen verwarmen met een warmtepompfunctie, maar dit is luchtverwarming. Geschiktheid en comfort hangen af van woning, ruimte-indeling, buitentemperatuur en het bestaande verwarmingssysteem.'],
        ['Wanneer heb ik een multi-split airco nodig?', 'Als u meerdere aparte ruimtes wilt koelen of verwarmen, kan een multi-split met meerdere binnenunits passend zijn. Elke ruimte moet apart worden beoordeeld; het totaalvermogen van de buitenunit is ook belangrijk.'],
        ['Hoe nauwkeurig is het geschatte aircoverbruik?', 'Het jaarverbruik is indicatief en gebruikt gemiddelde efficiëntie- en gebruiksaannames. Werkelijke uren, ingestelde temperatuur, ruimte, zoninstraling en toestelrendement kunnen de uitkomst sterk veranderen.'],
      ],
    },
  ] : [
    {
      label: 'Home battery', icon: <Battery />,
      items: [
        ['What does a home battery do?', 'A home battery stores electricity for use at a later time. How a system works in practice depends on your consumption, generation and chosen settings.'],
        ['Which HYXiPower All-in-One capacities are available?', 'The available capacities are 10.6, 15.9, 21.2 and 26.5 kWh. We can discuss which variant may fit your usage and electrical connection.'],
        ['Do I need solar panels?', 'Not necessarily. How a battery is charged and used depends on your energy contract, installation and consumption. Have your situation assessed before choosing.'],
        ['Can a home battery provide backup power?', 'Backup options depend on the selected configuration and installation. Ask in advance which components and work would be needed for your situation.'],
      ],
    },
    {
      label: 'HYXiPower & app', icon: <Cpu />,
      items: [
        ['What is HYXiPower?', 'HYXiPower is a partner of SolarFast. SolarFast supplies and installs, among other products, the HYXiPower All-in-One home battery.'],
        ['Which All-in-One capacities are available?', 'The available capacities are 10.6, 15.9, 21.2 and 26.5 kWh. These are four system variants; ask about the specifications and configuration that suit your situation.'],
        ['Will the battery work with my existing solar panels or inverter?', 'Compatibility depends on the existing installation and chosen configuration. Have the brand, model and connection checked in advance.'],
        ['What can I see in the app?', 'App features depend on the version and configuration. Ask which features and any associated costs currently apply to the system in your proposal.'],
      ],
    },
    {
      label: 'Warmtefonds', icon: <Euro />,
      items: [
        ['Where can I find the current Warmtefonds terms?', 'Loan amounts, interest, eligible measures and terms can change. Check current information directly with the National Warmtefonds before making a financing decision.'],
        ['Is a home battery eligible for financing?', 'This depends on the current scheme and your personal situation. Check the terms with the Warmtefonds; do not assume a product or applicant automatically qualifies.'],
        ['What information do I need to apply?', 'Required documents and information depend on the current scheme and your situation. The Warmtefonds explains what is needed during the application.'],
        ['Can I check how much I could borrow in advance?', 'Use the Warmtefonds’ current calculator and terms. An estimate is not a final assessment of your application.'],
        ['Can SolarFast approve my application?', 'No. SolarFast can provide information about a measure, but only the Warmtefonds assesses and decides on a financing application.'],
        ['Are interest rates and terms always the same?', 'No. Interest, repayment term and conditions can change and may depend on the scheme and applicant. Always check current information with the Warmtefonds.'],
        ['Can SolarFast help with my questions?', 'Contact us to discuss your plans. For an application, final decision or current terms, the Warmtefonds itself is the appropriate source.'],
      ],
    },
    {
      label: 'Costs & estimates', icon: <Shield />,
      items: [
        ['How much does a home battery cost?', 'The price depends on factors including the selected configuration and installation. Request a proposal based on your situation.'],
        ['What does the calculator show?', 'The calculator provides an indicative estimate based on the information and assumptions you enter. Results are not a guarantee of a specific return, saving or payback period.'],
        ['How long does it take to pay back a battery?', 'This depends on purchase price, energy prices, usage, settings and other conditions. A calculation is a scenario, not a promise about future results.'],
      ],
    },
    {
      label: 'Installation & service', icon: <Wrench />,
      items: [
        ['Who carries out the installation?', 'Ask in advance which installer will carry out your project. Check the InstallQ register to see whether that specific installer is recognised for the relevant trade.'],
        ['What should I prepare?', 'Preparation differs by home and installation. Once your situation has been assessed, the required work and information can be discussed.'],
        ['Where can I verify an installer’s recognition?', 'Recognition is tied to the specific installer and relevant trade. Check the installer carrying out your work in the InstallQ register.'],
      ],
    },
    {
      label: 'EV chargers & integrations', icon: <Car />,
      items: [
        ['Can a home battery work with an EV charger or heat pump?', 'This depends on the equipment, electrical connection and settings. Have the combination checked for compatibility and any required work.'],
        ['Will every system work with a dynamic energy contract?', 'Suitability depends on the product configuration, software and contract. Ask which functionality is currently available for your chosen system.'],
        ['Can I keep my existing equipment?', 'This cannot be confirmed without a compatibility check. Share the make and model of your existing equipment so the combination can be assessed.'],
      ],
    },
    {
      label: 'Electricity & energy bills', icon: <Zap />,
      items: [
        ['What is the difference between kW and kWh?', 'kW is power at a given moment. kWh is the amount of electricity used or generated over time. Battery capacity is usually stated in kWh; charge and discharge power in kW.'],
        ['What is the difference between self-consumption and self-sufficiency?', 'Self-consumption is the share of your solar generation that you use directly. Self-sufficiency is the share of your total electricity use covered by your own generation. They are different percentages.'],
        ['Why does my energy bill differ from the calculator?', 'A bill includes more than electricity use: fixed charges, taxes, export compensation and possible export fees can also matter. The calculator uses the values you enter.'],
        ['What are export fees and export compensation?', 'Compensation is what your supplier pays for exported electricity. Export fees are separate charges that may apply. Amounts and terms differ by supplier and contract.'],
        ['How does a dynamic energy contract work?', 'With a dynamic contract, the electricity price changes hourly or every quarter-hour, depending on the supplier and meter. Taxes and other charges still apply, so a low market price is not automatically your total price.'],
        ['What does a negative electricity price mean?', 'A negative market price does not automatically mean you are paid to consume or export electricity. Supplier terms, taxes, mark-ups and possible export fees determine what you actually pay or receive.'],
        ['Which figures do I need from my energy bill?', 'Use annual consumption, solar generation and exported electricity for the same period. Also note your import tariff, export compensation and any export fees, with the correct unit: per kWh or per year.'],
        ['Can I enter an annual export fee?', 'Yes, if your supplier charges a fixed annual amount. If the fee is charged per exported kWh, enter the per-kWh rate instead. Use the unit shown on your contract or bill.'],
      ],
    },
    {
      label: 'Combining measures', icon: <Battery />,
      items: [
        ['Can a home battery and heat pump be calculated together?', 'Yes. The heat pump’s extra electricity demand must be included in the household calculation. Simply adding standalone savings can count the same energy flow twice.'],
        ['Can I add another measure after the calculation?', 'The required information depends on the measure. A heat pump needs home and heating details; an air conditioner needs details such as room count, floor area and whether you want cooling, heating or both.'],
        ['Why does a combined estimate ask for different information?', 'An extra device changes total electricity use and can affect imports, exports and battery use. A combined estimate therefore needs additional information and recalculates the household scenario.'],
        ['Are combined results guaranteed?', 'No. They are estimates based on your inputs and stated assumptions. Actual results depend on usage, settings, weather, installation and your energy contract.'],
      ],
    },
    {
      label: 'Solar panels & roof scan', icon: <Zap />,
      items: [
        ['What affects solar panel generation?', 'Generation depends on panel output, roof direction, pitch, shade, temperature and inverter. A roof scan is an estimate; an installer must check the property in person.'],
        ['Why are north-facing roof areas not normally included?', 'A north-facing roof usually produces less than suitable south-, east- or west-facing areas. The scanner focuses on useful roof planes but may miss details such as shade or obstacles.'],
        ['Is a roof scan result final?', 'No. Aerial imagery and map data are indicative and may be out of date or imprecise. Roof structure, obstacles, cable routes and installation requirements still need to be checked.'],
        ['Why does actual generation differ from the scan?', 'Weather, shade, orientation, roof pitch, panel choice, inverter and system settings all affect generation. An estimate is not a production guarantee.'],
        ['Can I see how many panels will fit?', 'The scanner creates an initial layout from available roof information. The final plan follows a check of roof dimensions, obstacles, safety clearances and mounting requirements.'],
      ],
    },
    {
      label: 'Heat pumps & air conditioning', icon: <Wrench />,
      items: [
        ['What is the difference between kW and annual electricity use?', 'kW describes power at a moment; kWh per year describes energy used over a year. Higher power does not automatically mean a device uses more electricity throughout the year.'],
        ['Which details matter for heat pump advice?', 'Home type, heated floor area, insulation, current gas use, heat emitters and desired flow temperature help estimate heat demand and suitable system configuration.'],
        ['Can an air conditioner also heat?', 'Many air conditioners can heat using a heat-pump function, but they deliver warm air. Suitability and comfort depend on the home, room layout, outdoor temperature and existing heating system.'],
        ['When might I need a multi-split air conditioner?', 'If you want to heat or cool several separate rooms, a multi-split with multiple indoor units may fit. Each room needs its own assessment; the outdoor unit capacity also matters.'],
        ['How accurate is the estimated air-conditioner use?', 'Annual use is indicative and uses average efficiency and usage assumptions. Actual hours, set temperature, room, solar gain and equipment efficiency can change the result significantly.'],
      ],
    },
  ]

  const query = faqSearch.trim().toLocaleLowerCase(nl ? 'nl-NL' : 'en-US')
  const visibleSections = sections
    .map((section, sectionIndex) => ({
      ...section,
      sectionIndex,
      items: section.items
        .map(([question, answer], itemIndex) => ({ question, answer, itemIndex }))
        .filter(({ question, answer }) =>
          !query || `${question} ${answer}`.toLocaleLowerCase(nl ? 'nl-NL' : 'en-US').includes(query),
        ),
    }))
    .filter((section) => query ? section.items.length > 0 : section.sectionIndex === active)
  const resultCount = visibleSections.reduce((count, section) => count + section.items.length, 0)
  return (
    <main className="sf-brand-page min-h-[100dvh]">
      <Nav />
      <section className="relative overflow-hidden bg-[#e9eee5] px-6 pb-16 pt-36 sm:pb-24 sm:pt-44">
        <div className="container-max relative z-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease }}
            className="max-w-4xl"
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#244b39]/15 bg-[#fbfaf6] px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-[#526a56]">
              {nl ? 'Antwoorden zonder omwegen' : 'Clear answers, no detours'}
            </span>
            <h1 className="max-w-3xl text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              {nl ? 'Goed om te weten.' : 'Good to know.'}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#68766c] sm:text-lg">
              {nl
                ? 'Over producten, installatie en berekeningen. Waar voorwaarden kunnen veranderen, verwijzen we naar de bron.'
                : 'About products, installation and estimates. Where terms can change, we point you to the source.'}
            </p>
          </motion.div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-80 w-80 rounded-full border border-[#244b39]/10 sm:h-[30rem] sm:w-[30rem]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 top-0 h-64 w-64 rounded-full border border-[#244b39]/10 sm:h-96 sm:w-96" />
      </section>

      <section className="container-max grid gap-10 py-14 sm:py-20 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
        <nav aria-label={nl ? 'Veelgestelde vragen per onderwerp' : 'Frequently asked questions by topic'} className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {sections.map((section, index) => {
            const Icon = section.icon.type
            return (
              <button
                key={section.label}
                type="button"
                aria-current={active === index ? 'true' : undefined}
                onClick={() => { setActive(index); setFaqSearch(''); setOpenItem(`${index}-0`) }}
                className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-semibold transition-colors lg:w-full lg:rounded-xl ${
                  active === index
                    ? 'bg-[#244b39] text-[#fbfaf6]'
                    : 'bg-[#eeeee5] text-[#526257] hover:bg-[#dfe8dc]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {section.label}
              </button>
            )
          })}
          <a href="mailto:info@solarfast.nl" className="mt-4 hidden rounded-xl border border-[#244b39]/15 p-4 text-sm leading-6 text-[#68766c] hover:border-[#244b39]/35 lg:block">
            {nl ? 'Staat uw vraag er niet bij? Neem contact met ons op.' : 'Still have a question? Get in touch.'}
          </a>
        </nav>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease }}
          className="sf-page-card sf-page-card--static rounded-2xl px-5 sm:px-8"
        >
          <label className="flex items-center gap-3 border-b border-[#244b39]/10 py-5">
            <Search className="h-5 w-5 shrink-0 text-[#244b39]" aria-hidden="true" />
            <span className="sr-only">{nl ? 'Zoek in veelgestelde vragen' : 'Search frequently asked questions'}</span>
            <input
              type="search"
              value={faqSearch}
              onChange={(event) => setFaqSearch(event.target.value)}
              placeholder={nl ? 'Zoek op onderwerp of vraag…' : 'Search a topic or question…'}
              className="min-h-11 w-full bg-transparent text-sm text-[#23342b] outline-none placeholder:text-[#526257] focus-visible:ring-2 focus-visible:ring-[#244b39] focus-visible:ring-offset-2"
            />
          </label>
          {query && (
            <p className="py-4 text-sm font-semibold text-[#35483b]" role="status" aria-live="polite">
              {nl ? `${resultCount} ${resultCount === 1 ? 'vraag gevonden' : 'vragen gevonden'}` : `${resultCount} ${resultCount === 1 ? 'question found' : 'questions found'}`}
            </p>
          )}
          {!resultCount ? (
            <p className="py-8 text-sm text-[#35483b]">
              {nl ? 'Geen vragen gevonden. Probeer een ander zoekwoord.' : 'No questions found. Try another search term.'}
            </p>
          ) : visibleSections.map((section) => (
            <section key={section.label} aria-label={section.label}>
              {query && (
                <h2 className="border-b border-[#244b39]/10 py-4 text-lg font-bold text-[#23342b]">
                  {section.label}
                </h2>
              )}
              {!query && (
                <div className="border-b border-[#244b39]/10 py-5">
                  <span className="text-xs font-semibold uppercase tracking-[.14em] text-[#526a56]">
                    {nl ? 'Onderwerp' : 'Topic'}
                  </span>
                  <h2 className="mt-2 text-2xl">{section.label}</h2>
                </div>
              )}
              {section.items.map(({ question, answer, itemIndex }) => {
                const id = `${section.sectionIndex}-${itemIndex}`
                return (
                  <FAQItem
                    key={id}
                    id={id}
                    question={question}
                    answer={answer}
                    open={openItem === id}
                    onToggle={() => setOpenItem(openItem === id ? '' : id)}
                    reduceMotion={reduceMotion}
                  />
                )
              })}
            </section>
          ))}
        </motion.div>
      </section>
      <div className="container-max pb-16 lg:hidden">
        <a href="mailto:info@solarfast.nl" className="inline-flex rounded-full border border-[#244b39]/15 px-5 py-3 text-sm font-semibold text-[#244b39]">
          {nl ? 'Neem contact met ons op' : 'Contact us'}
        </a>
      </div>
    </main>
  )
}