import React from 'react'

export default function SafetySources({ lang }) {
  const nl = lang === 'nl'
  return <aside className="mt-5 rounded-2xl border border-[#111]/10 bg-[#fbfaf7] p-5 text-xs leading-relaxed text-[#444]">
    <h3 className="mb-2 text-sm font-bold text-[#111]">{nl ? 'Veilig installeren' : 'Safe installation'}</h3>
    <p>
      {nl
        ? 'Controleer voor de warmtepomp of het installatiebedrijf voor warmtepompinstallaties is erkend in het InstallQ-register. InstallQ beschrijft eisen voor ontwerp, installatie, inspectie en onderhoud; een erkenning van SolarFast zelf is hier niet geverifieerd.'
        : 'Before installation, check whether the installer is recognised for heat pumps in the InstallQ register. InstallQ sets requirements for design, installation, inspection and maintenance; SolarFast’s own recognition has not been verified here.'}
      {' '}<a className="font-semibold underline underline-offset-2" target="_blank" rel="noreferrer" href="https://installq.nl/warmtepomp-installaties">InstallQ</a>
    </p>
    <p className="mt-2">
      {nl
        ? 'Bij een thuisbatterij adviseert de Brandweer een erkende installateur, een koele geventileerde plek, een rookmelder, een onbrandbare ondergrond en geen plaatsing in de vluchtroute.'
        : 'For home batteries, the Dutch fire service advises a recognised installer, a cool ventilated location, a smoke alarm, a non-combustible mounting surface and no placement on an escape route.'}
      {' '}<a className="font-semibold underline underline-offset-2" target="_blank" rel="noreferrer" href="https://www.brandweer.nl/onderwerpen/een-veilige-thuisbatterij">Brandweer.nl</a>
    </p>
  </aside>
}