/* ExportRev Data Portal — demo dataset
 * Structured to mirror the shape of real automotive data feeds
 * (parts catalogue / technical data / salvage listings) so that
 * swapping in a live provider is a data-source change, not a rebuild.
 */

/* deterministic PRNG so the demo looks identical on every load */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260809);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));

/* ------------------------------------------------------------------ */
/* 1. VEHICLE TREE  (manufacturer → model → type/engine)               */
/* ------------------------------------------------------------------ */

const VEHICLES = [
  {
    id: 'VW', name: 'Volkswagen', country: 'DE', models: [
      { id: 'VW-GOLF7', name: 'Golf VII (5G1, BQ1, BE1, BE2)', from: '2012-08', to: '2020-08', types: [
        { id: 101, name: '1.6 TDI', kw: 81, hp: 110, cc: 1598, engine: 'CLHA / CRKB', fuel: 'Diesel', body: 'Hatchback', from: '2012-08', to: '2020-08' },
        { id: 102, name: '2.0 TDI', kw: 110, hp: 150, cc: 1968, engine: 'CRBC / DFEA', fuel: 'Diesel', body: 'Hatchback', from: '2012-08', to: '2020-08' },
        { id: 103, name: '1.4 TSI', kw: 92, hp: 125, cc: 1395, engine: 'CZCA / CMBA', fuel: 'Petrol', body: 'Hatchback', from: '2012-08', to: '2019-03' },
        { id: 104, name: '2.0 GTI', kw: 162, hp: 220, cc: 1984, engine: 'CHHB', fuel: 'Petrol', body: 'Hatchback', from: '2013-04', to: '2020-08' }
      ]},
      { id: 'VW-PASSAT-B8', name: 'Passat B8 (3G2, CB2)', from: '2014-08', to: '2023-12', types: [
        { id: 111, name: '2.0 TDI', kw: 110, hp: 150, cc: 1968, engine: 'CRLB / DFGA', fuel: 'Diesel', body: 'Saloon', from: '2014-08', to: '2023-12' },
        { id: 112, name: '1.4 TSI', kw: 110, hp: 150, cc: 1395, engine: 'CZDA', fuel: 'Petrol', body: 'Saloon', from: '2014-08', to: '2020-12' }
      ]},
      { id: 'VW-POLO-6R', name: 'Polo V (6R1, 6C1)', from: '2009-03', to: '2017-10', types: [
        { id: 121, name: '1.2 TSI', kw: 66, hp: 90, cc: 1197, engine: 'CJZC', fuel: 'Petrol', body: 'Hatchback', from: '2014-02', to: '2017-10' },
        { id: 122, name: '1.4 TDI', kw: 55, hp: 75, cc: 1422, engine: 'CUSB', fuel: 'Diesel', body: 'Hatchback', from: '2014-05', to: '2017-10' }
      ]}
    ]
  },
  {
    id: 'BMW', name: 'BMW', country: 'DE', models: [
      { id: 'BMW-F30', name: '3 Series (F30, F80)', from: '2011-11', to: '2018-10', types: [
        { id: 201, name: '320 d', kw: 135, hp: 184, cc: 1995, engine: 'N47 D20 C / B47 D20 A', fuel: 'Diesel', body: 'Saloon', from: '2011-11', to: '2018-10' },
        { id: 202, name: '318 d', kw: 105, hp: 143, cc: 1995, engine: 'N47 D20 C', fuel: 'Diesel', body: 'Saloon', from: '2012-07', to: '2015-06' },
        { id: 203, name: '330 i', kw: 185, hp: 252, cc: 1998, engine: 'B48 B20 A', fuel: 'Petrol', body: 'Saloon', from: '2015-07', to: '2018-10' }
      ]},
      { id: 'BMW-F10', name: '5 Series (F10)', from: '2009-01', to: '2016-10', types: [
        { id: 211, name: '520 d', kw: 135, hp: 184, cc: 1995, engine: 'N47 D20 C', fuel: 'Diesel', body: 'Saloon', from: '2010-03', to: '2016-10' },
        { id: 212, name: '530 d', kw: 190, hp: 258, cc: 2993, engine: 'N57 D30 A', fuel: 'Diesel', body: 'Saloon', from: '2011-09', to: '2016-10' }
      ]},
      { id: 'BMW-X5-F15', name: 'X5 (F15, F85)', from: '2013-07', to: '2018-07', types: [
        { id: 221, name: 'xDrive 30 d', kw: 190, hp: 258, cc: 2993, engine: 'N57 D30 A', fuel: 'Diesel', body: 'SUV', from: '2013-08', to: '2018-07' }
      ]}
    ]
  },
  {
    id: 'MB', name: 'Mercedes-Benz', country: 'DE', models: [
      { id: 'MB-W205', name: 'C-Class (W205)', from: '2013-12', to: '2021-02', types: [
        { id: 301, name: 'C 220 d', kw: 125, hp: 170, cc: 2143, engine: 'OM 651.921', fuel: 'Diesel', body: 'Saloon', from: '2014-03', to: '2018-05' },
        { id: 302, name: 'C 200', kw: 135, hp: 184, cc: 1991, engine: 'M 274.920', fuel: 'Petrol', body: 'Saloon', from: '2014-03', to: '2018-05' }
      ]},
      { id: 'MB-SPRINTER', name: 'Sprinter 3,5-t Van (906)', from: '2006-06', to: '2018-12', types: [
        { id: 311, name: '313 CDI', kw: 95, hp: 129, cc: 2143, engine: 'OM 651.955', fuel: 'Diesel', body: 'Van', from: '2009-06', to: '2018-12' },
        { id: 312, name: '316 CDI', kw: 120, hp: 163, cc: 2143, engine: 'OM 651.956', fuel: 'Diesel', body: 'Van', from: '2009-06', to: '2018-12' }
      ]}
    ]
  },
  {
    id: 'AUDI', name: 'Audi', country: 'DE', models: [
      { id: 'AUDI-A4-B9', name: 'A4 (8W2, 8WC, B9)', from: '2015-05', to: '2024-12', types: [
        { id: 401, name: '2.0 TDI', kw: 110, hp: 150, cc: 1968, engine: 'DEUA / DETA', fuel: 'Diesel', body: 'Saloon', from: '2015-11', to: '2024-12' },
        { id: 402, name: '2.0 TFSI', kw: 140, hp: 190, cc: 1984, engine: 'DKNA', fuel: 'Petrol', body: 'Saloon', from: '2015-11', to: '2024-12' }
      ]},
      { id: 'AUDI-Q5-8R', name: 'Q5 (8RB)', from: '2008-11', to: '2017-12', types: [
        { id: 411, name: '2.0 TDI quattro', kw: 130, hp: 177, cc: 1968, engine: 'CGLC / CAHA', fuel: 'Diesel', body: 'SUV', from: '2008-11', to: '2017-12' }
      ]}
    ]
  },
  {
    id: 'RE', name: 'Renault', country: 'FR', models: [
      { id: 'RE-CLIO4', name: 'Clio IV (BH_)', from: '2012-11', to: '2019-12', types: [
        { id: 501, name: '1.5 dCi', kw: 66, hp: 90, cc: 1461, engine: 'K9K 608', fuel: 'Diesel', body: 'Hatchback', from: '2012-11', to: '2019-12' },
        { id: 502, name: '0.9 TCe', kw: 66, hp: 90, cc: 898, engine: 'H4B 400', fuel: 'Petrol', body: 'Hatchback', from: '2012-11', to: '2019-12' }
      ]},
      { id: 'RE-MASTER3', name: 'Master III Van (FV)', from: '2010-02', to: '2024-12', types: [
        { id: 511, name: '2.3 dCi 125', kw: 92, hp: 125, cc: 2298, engine: 'M9T 680', fuel: 'Diesel', body: 'Van', from: '2010-02', to: '2024-12' }
      ]}
    ]
  },
  {
    id: 'PE', name: 'Peugeot', country: 'FR', models: [
      { id: 'PE-308-T9', name: '308 II (LB_, LP_, LW_, LH_)', from: '2013-09', to: '2021-12', types: [
        { id: 601, name: '1.6 BlueHDi 120', kw: 88, hp: 120, cc: 1560, engine: 'DV6FC (BHZ)', fuel: 'Diesel', body: 'Hatchback', from: '2013-11', to: '2021-12' },
        { id: 602, name: '1.2 THP 130', kw: 96, hp: 130, cc: 1199, engine: 'EB2DTS (HNY)', fuel: 'Petrol', body: 'Hatchback', from: '2014-01', to: '2021-12' }
      ]},
      { id: 'PE-BOXER3', name: 'Boxer Van', from: '2006-04', to: '2024-12', types: [
        { id: 611, name: '2.2 HDi 130', kw: 96, hp: 131, cc: 2198, engine: '4HH (P22DTE)', fuel: 'Diesel', body: 'Van', from: '2011-07', to: '2024-12' }
      ]}
    ]
  },
  {
    id: 'TO', name: 'Toyota', country: 'JP', models: [
      { id: 'TO-COROLLA-E21', name: 'Corolla XII (E21)', from: '2018-06', to: '2025-12', types: [
        { id: 701, name: '1.8 Hybrid', kw: 90, hp: 122, cc: 1798, engine: '2ZR-FXE', fuel: 'Hybrid', body: 'Hatchback', from: '2018-11', to: '2025-12' },
        { id: 702, name: '2.0 Hybrid', kw: 132, hp: 180, cc: 1987, engine: 'M20A-FXS', fuel: 'Hybrid', body: 'Hatchback', from: '2018-11', to: '2025-12' }
      ]},
      { id: 'TO-HILUX-AN120', name: 'Hilux VIII Pickup (AN120)', from: '2015-05', to: '2025-12', types: [
        { id: 711, name: '2.4 D-4D', kw: 110, hp: 150, cc: 2393, engine: '2GD-FTV', fuel: 'Diesel', body: 'Pickup', from: '2015-05', to: '2025-12' }
      ]}
    ]
  },
  {
    id: 'FO', name: 'Ford', country: 'US', models: [
      { id: 'FO-FOCUS-MK3', name: 'Focus III', from: '2010-07', to: '2018-09', types: [
        { id: 801, name: '1.6 TDCi', kw: 85, hp: 115, cc: 1560, engine: 'T1DA / T1DB', fuel: 'Diesel', body: 'Hatchback', from: '2010-07', to: '2018-09' },
        { id: 802, name: '1.0 EcoBoost', kw: 92, hp: 125, cc: 998, engine: 'M1DA', fuel: 'Petrol', body: 'Hatchback', from: '2012-02', to: '2018-09' }
      ]},
      { id: 'FO-TRANSIT-V363', name: 'Transit V363 Van', from: '2013-08', to: '2025-12', types: [
        { id: 811, name: '2.0 EcoBlue', kw: 96, hp: 130, cc: 1995, engine: 'YMF6 / BJFA', fuel: 'Diesel', body: 'Van', from: '2016-01', to: '2025-12' }
      ]}
    ]
  }
];

/* ------------------------------------------------------------------ */
/* 2. PARTS CATALOGUE                                                  */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: 'brake', name: 'Braking System', icon: '⊙', sub: ['Brake Disc', 'Brake Pad Set', 'Brake Caliper', 'Brake Hose', 'ABS Sensor', 'Brake Master Cylinder'] },
  { id: 'filter', name: 'Filters', icon: '▤', sub: ['Oil Filter', 'Air Filter', 'Fuel Filter', 'Cabin Filter', 'Hydraulic Filter'] },
  { id: 'engine', name: 'Engine', icon: '⚙', sub: ['Turbocharger', 'Injector', 'Glow Plug', 'Spark Plug', 'Cylinder Head Gasket', 'Oil Pump'] },
  { id: 'susp', name: 'Suspension & Steering', icon: '⌇', sub: ['Shock Absorber', 'Control Arm', 'Ball Joint', 'Tie Rod End', 'Wheel Bearing Kit', 'Coil Spring'] },
  { id: 'elec', name: 'Electrical', icon: '⚡', sub: ['Alternator', 'Starter Motor', 'Battery', 'Ignition Coil', 'Lambda Sensor', 'Crankshaft Sensor'] },
  { id: 'cool', name: 'Cooling System', icon: '❄', sub: ['Radiator', 'Water Pump', 'Thermostat', 'Coolant Hose', 'Radiator Fan', 'Expansion Tank'] },
  { id: 'exh', name: 'Exhaust System', icon: '◍', sub: ['Catalytic Converter', 'Diesel Particulate Filter', 'EGR Valve', 'Silencer', 'Exhaust Manifold'] },
  { id: 'belt', name: 'Belt Drive', icon: '◎', sub: ['Timing Belt Kit', 'V-Ribbed Belt', 'Tensioner Pulley', 'Water Pump + Belt Kit', 'Timing Chain Kit'] },
  { id: 'clutch', name: 'Clutch & Transmission', icon: '◈', sub: ['Clutch Kit', 'Dual Mass Flywheel', 'Slave Cylinder', 'Gearbox Mount', 'CV Joint Kit'] },
  { id: 'body', name: 'Body & Lighting', icon: '▣', sub: ['Headlight', 'Tail Light', 'Wing Mirror', 'Wiper Blade Set', 'Bonnet', 'Front Bumper'] }
];

const BRANDS = [
  { name: 'BOSCH', tier: 'OE' }, { name: 'BREMBO', tier: 'OE' }, { name: 'MANN-FILTER', tier: 'OE' },
  { name: 'SACHS', tier: 'OE' }, { name: 'VALEO', tier: 'OE' }, { name: 'FEBI BILSTEIN', tier: 'AM' },
  { name: 'TRW', tier: 'OE' }, { name: 'CONTINENTAL', tier: 'OE' }, { name: 'NGK', tier: 'OE' },
  { name: 'MAHLE', tier: 'OE' }, { name: 'LUK', tier: 'OE' }, { name: 'HELLA', tier: 'OE' },
  { name: 'DENSO', tier: 'OE' }, { name: 'SKF', tier: 'OE' }, { name: 'RIDEX', tier: 'AM' },
  { name: 'MEYLE', tier: 'AM' }, { name: 'ATE', tier: 'OE' }, { name: 'GATES', tier: 'OE' }
];

/* brands are restricted to the categories they actually supply, so the
   catalogue reads correctly to anyone who knows the aftermarket */
const BRANDS_BY_CAT = {
  brake:  ['BREMBO', 'ATE', 'TRW', 'BOSCH', 'FEBI BILSTEIN', 'MEYLE', 'RIDEX'],
  filter: ['MANN-FILTER', 'BOSCH', 'MAHLE', 'DENSO', 'RIDEX'],
  engine: ['BOSCH', 'MAHLE', 'DENSO', 'NGK', 'VALEO', 'FEBI BILSTEIN'],
  susp:   ['SACHS', 'SKF', 'TRW', 'MEYLE', 'FEBI BILSTEIN', 'RIDEX'],
  elec:   ['BOSCH', 'VALEO', 'DENSO', 'HELLA', 'NGK'],
  cool:   ['VALEO', 'MAHLE', 'GATES', 'HELLA', 'FEBI BILSTEIN'],
  exh:    ['BOSCH', 'DENSO', 'FEBI BILSTEIN', 'RIDEX', 'MEYLE'],
  belt:   ['GATES', 'CONTINENTAL', 'SKF', 'LUK', 'FEBI BILSTEIN'],
  clutch: ['LUK', 'SACHS', 'VALEO', 'FEBI BILSTEIN'],
  body:   ['HELLA', 'VALEO', 'BOSCH', 'RIDEX', 'MEYLE']
};
function brandFor(catId) {
  const name = pick(BRANDS_BY_CAT[catId] || BRANDS.map(x => x.name));
  return BRANDS.find(b => b.name === name);
}

const CRITERIA_BY_SUB = {
  'Brake Disc': () => ({ 'Brake Disc Type': pick(['Vented', 'Solid', 'Perforated', 'Internally Vented']), 'Ø Outer [mm]': String(between(256, 348)), 'Thickness [mm]': String(between(20, 34)), 'Fitting Position': pick(['Front Axle', 'Rear Axle']), 'Num. of Holes': String(pick([4, 5, 5, 5])) }),
  'Brake Pad Set': () => ({ 'Fitting Position': pick(['Front Axle', 'Rear Axle']), 'Width [mm]': String(between(129, 156)), 'Height [mm]': String(between(52, 75)), 'Thickness [mm]': String(between(16, 20)), 'Wear Warning Contact': pick(['incl. wear warning contact', 'excl. wear warning contact']) }),
  'Oil Filter': () => ({ 'Filter Type': pick(['Filter Insert', 'Spin-on Filter']), 'Height [mm]': String(between(60, 145)), 'Ø Outer [mm]': String(between(62, 96)), 'Thread Size': pick(['M20 x 1.5', '3/4"-16 UNF']) }),
  'Air Filter': () => ({ 'Filter Type': pick(['Filter Insert', 'Air Filter Panel']), 'Length [mm]': String(between(180, 340)), 'Width [mm]': String(between(120, 240)), 'Height [mm]': String(between(30, 70)) }),
  'Shock Absorber': () => ({ 'Fitting Position': pick(['Front Axle', 'Rear Axle']), 'Design': pick(['Twin-Tube', 'Monotube', 'Gas Pressure']), 'Absorber Type': pick(['Suspension Strut', 'Telescopic Shock Absorber']) }),
  'Turbocharger': () => ({ 'Charging Type': pick(['Exhaust Turbocharger']), 'Turbocharger Type': pick(['VTG', 'Waste Gate']), 'Air Supply': pick(['with intercooler']) }),
  'Alternator': () => ({ 'Voltage [V]': '14', 'Rated Current [A]': String(pick([90, 110, 120, 140, 150, 180])), 'Pulley Ø [mm]': String(between(49, 62)), 'Ribs': String(pick([5, 6, 7])) }),
  'Clutch Kit': () => ({ 'Ø [mm]': String(between(215, 260)), 'Number of Teeth': String(pick([10, 21, 23, 26])), 'Supplementary Article': pick(['with clutch release bearing', 'with central slave cylinder']) }),
  'Brake Caliper': () => ({ 'Fitting Position': pick(['Front Axle, Left', 'Front Axle, Right', 'Rear Axle, Left', 'Rear Axle, Right']), 'Piston Ø [mm]': String(between(34, 60)), 'Brake Disc Thickness [mm]': String(between(20, 32)), 'Number of Pistons': String(pick([1, 1, 2])) }),
  'Brake Hose': () => ({ 'Fitting Position': pick(['Front Axle', 'Rear Axle']), 'Length [mm]': String(between(280, 560)), 'Thread Size 1': pick(['M10 x 1', 'F10 x 1']), 'Thread Size 2': pick(['M10 x 1', 'IN M10 x 1']) }),
  'ABS Sensor': () => ({ 'Fitting Position': pick(['Front Axle', 'Rear Axle']), 'Cable Length [mm]': String(between(420, 1180)), 'Number of Pins': String(pick([2, 2, 3])), 'Sensor Type': pick(['Active sensor', 'Hall Sensor', 'Inductive Sensor']) }),
  'Fuel Filter': () => ({ 'Filter Type': pick(['In-Line Filter', 'Filter Insert', 'Spin-on Filter']), 'Height [mm]': String(between(72, 190)), 'Ø Outer [mm]': String(between(52, 96)), 'Water Separator': pick(['with water separator', 'without water separator']) }),
  'Cabin Filter': () => ({ 'Filter Type': pick(['Particulate Filter', 'Activated Carbon Filter']), 'Length [mm]': String(between(200, 300)), 'Width [mm]': String(between(90, 220)), 'Height [mm]': String(between(17, 40)) }),
  'Spark Plug': () => ({ 'Electrode Gap [mm]': pick(['0.7', '0.8', '0.9', '1.0']), 'Thread Size': pick(['M12 x 1.25', 'M14 x 1.25']), 'Electrode Material': pick(['Iridium', 'Platinum', 'Nickel']), 'Spanner Size': pick(['14', '16']) }),
  'Glow Plug': () => ({ 'Rated Voltage [V]': pick(['4.4', '5.0', '11.0']), 'Thread Size': pick(['M8 x 1', 'M10 x 1.25']), 'Total Length [mm]': String(between(88, 140)), 'Spanner Size': pick(['8', '10', '12']) }),
  'Lambda Sensor': () => ({ 'Fitting Position': pick(['before catalytic converter', 'after catalytic converter']), 'Cable Length [mm]': String(between(300, 1100)), 'Number of Wires': String(pick([4, 4, 5])), 'Sensor Type': pick(['Planar Broadband', 'Finger Sensor']) }),
  'Starter Motor': () => ({ 'Voltage [V]': '12', 'Power [kW]': pick(['1.4', '1.7', '2.0', '2.2']), 'Number of Teeth': String(pick([9, 10, 11, 12])), 'Rotation Direction': 'Clockwise rotation' }),
  'Battery': () => ({ 'Capacity [Ah]': String(pick([60, 70, 74, 80, 95])), 'Cold-Start Current EN [A]': String(pick([540, 640, 680, 760, 850])), 'Technology': pick(['AGM', 'EFB', 'Lead-Acid']), 'Terminal Layout': pick(['0', '1']) }),
  'Water Pump': () => ({ 'Drive Type': pick(['Belt Pulley', 'Toothed Belt', 'Impeller']), 'Material': pick(['Aluminium', 'Cast Iron', 'Plastic']), 'Supplementary Article': pick(['with seal', 'with gasket set']) }),
  'Radiator': () => ({ 'Core Length [mm]': String(between(520, 720)), 'Core Height [mm]': String(between(380, 560)), 'Core Depth [mm]': String(between(23, 42)), 'Material': pick(['Aluminium / Plastic', 'Brazed Aluminium']) }),
  'Timing Belt Kit': () => ({ 'Number of Teeth': String(between(120, 160)), 'Width [mm]': String(pick([25, 27, 30])), 'Supplementary Article': pick(['with tensioner pulley', 'with water pump', 'with idler pulley']) }),
  'V-Ribbed Belt': () => ({ 'Number of Ribs': String(pick([5, 6, 7])), 'Length [mm]': String(between(880, 2100)), 'Profile': pick(['6PK', '5PK', '7PK']) }),
  'Control Arm': () => ({ 'Fitting Position': pick(['Front Axle, Left, Lower', 'Front Axle, Right, Lower', 'Rear Axle, Left', 'Rear Axle, Right']), 'Material': pick(['Aluminium', 'Steel']), 'Supplementary Article': pick(['with ball joint', 'with bushes']) }),
  'Wheel Bearing Kit': () => ({ 'Ø Inner [mm]': String(between(25, 45)), 'Ø Outer [mm]': String(between(66, 92)), 'Width [mm]': String(between(33, 45)), 'Supplementary Article': pick(['with ABS sensor ring', 'with integrated magnetic sensor ring']) }),
  'Headlight': () => ({ 'Fitting Position': pick(['Left', 'Right']), 'Bulb Technology': pick(['Halogen', 'LED', 'Bi-Xenon']), 'Vehicle Equipment': pick(['for vehicles with headlight levelling', 'for vehicles without headlight levelling']) }),
  'Wiper Blade Set': () => ({ 'Length [mm]': `${between(600, 700)} / ${between(400, 520)}`, 'Wiper Blade Type': pick(['Flat wiper blade', 'Bracket wiper blade']), 'Quantity per Unit': '2' }),
  'Diesel Particulate Filter': () => ({ 'Length [mm]': String(between(310, 460)), 'Ø [mm]': String(between(140, 200)), 'Material': pick(['Silicon Carbide', 'Cordierite']), 'Supplementary Article': pick(['with mounting parts', 'with gaskets']) }),
  'EGR Valve': () => ({ 'Number of Pins': String(pick([5, 6])), 'Operating Mode': pick(['Electric', 'Pneumatic']), 'Supplementary Article': pick(['with seal', 'with gasket']) })
};

function criteriaFor(sub) {
  const fn = CRITERIA_BY_SUB[sub];
  if (fn) return fn();
  return { 'Fitting Position': pick(['Front Axle', 'Rear Axle', 'Left', 'Right', 'Front', 'Rear']), 'Weight [kg]': (0.3 + rnd() * 8).toFixed(2), 'Quantity per Unit': String(pick([1, 1, 1, 2, 4])) };
}

function oeNumber(makeId) {
  const p = { VW: '04L', AUDI: '8W0', BMW: '3411', MB: 'A651', RE: '4020', PE: '1607', TO: '4351', FO: 'CV6Z' }[makeId] || '1K0';
  return `${p} ${between(100, 999)} ${between(100, 999)} ${pick(['A', 'B', 'C', 'D', 'E', 'F'])}`;
}

/* build the parts index: every vehicle type gets a spread of parts */
const PARTS = [];
let pid = 100000;
VEHICLES.forEach(mk => mk.models.forEach(md => md.types.forEach(ty => {
  CATEGORIES.forEach(cat => {
    const nSub = 2 + Math.floor(rnd() * 2);
    const subs = [...cat.sub].sort(() => rnd() - 0.5).slice(0, nSub);
    subs.forEach(sub => {
      const nParts = 2 + Math.floor(rnd() * 3);
      for (let i = 0; i < nParts; i++) {
        const br = brandFor(cat.id);
        const price = +(8 + rnd() * (cat.id === 'engine' || cat.id === 'body' ? 780 : 190)).toFixed(2);
        PARTS.push({
          id: ++pid,
          articleNo: `${br.name.slice(0, 2).toUpperCase()}-${between(10000, 99999)}${pick(['', 'A', 'X'])}`,
          brand: br.name,
          tier: br.tier,
          name: sub,
          categoryId: cat.id,
          category: cat.name,
          typeId: ty.id,
          makeId: mk.id,
          make: mk.name,
          model: md.name,
          typeName: ty.name,
          oe: [oeNumber(mk.id), oeNumber(mk.id)],
          crossRef: Array.from({ length: between(2, 5) }, () => `${pick(BRANDS_BY_CAT[cat.id])} ${between(10000, 99999)}`),
          criteria: criteriaFor(sub),
          price,
          currency: 'EUR',
          stock: pick(['In stock', 'In stock', 'In stock', 'Low stock', 'On order']),
          qtyAvailable: between(0, 240),
          leadTime: pick(['24 h', '24 h', '48 h', '3-5 days']),
          ean: `40${between(10000000000, 99999999999)}`,
          updated: `2026-0${between(4, 8)}-${String(between(10, 28)).padStart(2, '0')}`
        });
      }
    });
  });
})));

/* ------------------------------------------------------------------ */
/* 3. TECHNICAL / WORKSHOP DATA                                        */
/* ------------------------------------------------------------------ */

const TECH = {};
VEHICLES.forEach(mk => mk.models.forEach(md => md.types.forEach(ty => {
  const diesel = ty.fuel === 'Diesel';
  TECH[ty.id] = {
    service: [
      { item: 'Engine oil & filter', interval: diesel ? '30 000 km / 24 months' : '15 000 km / 12 months', spec: diesel ? '5W-30 ACEA C3' : '5W-40 ACEA A3/B4', qty: `${(3.8 + rnd() * 3).toFixed(1)} L` },
      { item: 'Air filter element', interval: '60 000 km / 48 months', spec: 'OE equivalent', qty: '1' },
      { item: 'Cabin / pollen filter', interval: '30 000 km / 24 months', spec: 'Activated carbon', qty: '1' },
      { item: 'Fuel filter', interval: diesel ? '60 000 km' : '90 000 km', spec: 'OE equivalent', qty: '1' },
      { item: diesel ? 'Glow plugs' : 'Spark plugs', interval: diesel ? '120 000 km' : '60 000 km / 48 months', spec: diesel ? '11 V ceramic' : 'Iridium, gap 0.9 mm', qty: String(ty.cc > 2500 ? 6 : 4) },
      { item: 'Brake fluid', interval: '24 months (time only)', spec: 'DOT 4 / low viscosity', qty: '1.0 L' },
      { item: 'Coolant', interval: 'Lifetime — check level', spec: pick(['G12 evo', 'G13', 'OAT red', 'HOAT']), qty: `${(5.5 + rnd() * 3).toFixed(1)} L` },
      { item: 'Timing belt / chain', interval: pick(['180 000 km / 120 months', '210 000 km', 'Chain — no interval, inspect at 150 000 km']), spec: 'Kit incl. tensioner', qty: '1 kit' }
    ],
    repairTimes: [
      { code: `RT-${ty.id}-01`, job: 'Front brake pads — renew (axle set)', hours: (0.7 + rnd() * 0.5).toFixed(1) },
      { code: `RT-${ty.id}-02`, job: 'Front brake discs & pads — renew (axle set)', hours: (1.2 + rnd() * 0.7).toFixed(1) },
      { code: `RT-${ty.id}-03`, job: 'Clutch assembly — renew', hours: (4.5 + rnd() * 3).toFixed(1) },
      { code: `RT-${ty.id}-04`, job: 'Timing belt kit — renew', hours: (2.8 + rnd() * 2.2).toFixed(1) },
      { code: `RT-${ty.id}-05`, job: 'Water pump — renew', hours: (1.9 + rnd() * 1.6).toFixed(1) },
      { code: `RT-${ty.id}-06`, job: 'Alternator — remove & refit', hours: (0.9 + rnd() * 1.2).toFixed(1) },
      { code: `RT-${ty.id}-07`, job: 'Turbocharger — renew', hours: (3.4 + rnd() * 2.6).toFixed(1) },
      { code: `RT-${ty.id}-08`, job: 'Front shock absorber — renew (one side)', hours: (0.9 + rnd() * 0.8).toFixed(1) },
      { code: `RT-${ty.id}-09`, job: 'DPF — remove, clean & refit', hours: (2.1 + rnd() * 1.4).toFixed(1) },
      { code: `RT-${ty.id}-10`, job: 'Full diagnostic — fault code read & report', hours: '0.5' }
    ],
    torque: [
      { item: 'Wheel bolts / nuts', nm: String(pick([110, 120, 125, 140, 160])), note: 'Tighten crosswise' },
      { item: 'Cylinder head bolts', nm: `${between(30, 60)} Nm + 90° + 90°`, note: 'Always renew bolts' },
      { item: 'Main bearing cap', nm: `${between(20, 45)} Nm + 90°`, note: 'Oil threads' },
      { item: 'Conrod bolts', nm: `${between(20, 35)} Nm + 90°`, note: 'Renew bolts' },
      { item: 'Crankshaft pulley bolt', nm: `${between(120, 200)} Nm + 90°`, note: 'Counter-hold flywheel' },
      { item: 'Front hub nut', nm: `${between(180, 260)} Nm`, note: 'Renew nut' },
      { item: 'Brake caliper carrier', nm: String(between(90, 200)), note: 'Micro-encapsulated bolts — renew' },
      { item: 'Sump drain plug', nm: String(between(20, 40)), note: 'Renew sealing washer' }
    ],
    fluids: [
      { item: 'Engine oil (with filter)', qty: `${(3.8 + rnd() * 3).toFixed(1)} L`, spec: diesel ? '5W-30 C3' : '5W-40 A3/B4' },
      { item: 'Gearbox oil (manual)', qty: `${(1.7 + rnd() * 1.1).toFixed(1)} L`, spec: pick(['75W-80 GL-4', '75W-90 GL-5']) },
      { item: 'Cooling system', qty: `${(5.5 + rnd() * 3).toFixed(1)} L`, spec: '50/50 premix' },
      { item: 'Brake system', qty: '0.9 L', spec: 'DOT 4' },
      { item: 'A/C refrigerant', qty: `${between(450, 720)} g`, spec: pick(['R134a', 'R1234yf']) },
      { item: 'Washer reservoir', qty: `${(3 + rnd() * 3).toFixed(1)} L`, spec: '-20 °C concentrate' }
    ],
    bulbs: [
      { pos: 'Dipped beam', type: pick(['H7 55W', 'H7 55W', 'LED module', 'D3S 35W Xenon']) },
      { pos: 'Main beam', type: pick(['H1 55W', 'H15 55W', 'LED module']) },
      { pos: 'Front fog', type: pick(['H8 35W', 'H11 55W', 'LED module']) },
      { pos: 'Indicator front', type: pick(['PY21W', 'WY21W', 'LED']) },
      { pos: 'Tail / brake', type: pick(['P21/5W', 'LED strip', 'W21/5W']) },
      { pos: 'Reverse', type: pick(['W16W', 'P21W']) }
    ]
  };
})));

/* ------------------------------------------------------------------ */
/* 4. DAMAGED / SALVAGE VEHICLE FEED                                   */
/* ------------------------------------------------------------------ */

const DAMAGE_TYPES = ['Front End', 'Rear End', 'Side Impact', 'Rollover', 'Hail', 'Flood', 'Fire', 'Mechanical', 'Vandalism', 'Undercarriage'];
const SALVAGE_SITES = [
  { city: 'Rotterdam', country: 'NL' }, { city: 'Antwerp', country: 'BE' }, { city: 'Bremerhaven', country: 'DE' },
  { city: 'Lyon', country: 'FR' }, { city: 'Barcelona', country: 'ES' }, { city: 'Milan', country: 'IT' },
  { city: 'Gdańsk', country: 'PL' }, { city: 'Dubai', country: 'AE' }, { city: 'Newark, NJ', country: 'US' },
  { city: 'Houston, TX', country: 'US' }, { city: 'Montreal, QC', country: 'CA' }, { city: 'Casablanca', country: 'MA' }
];
const TITLES = ['Salvage — Insurance', 'Salvage — Total Loss', 'Repairable', 'Certificate of Destruction', 'Clean — Mechanical Fault'];

const SALVAGE = [];
for (let i = 0; i < 180; i++) {
  const mk = pick(VEHICLES);
  const md = pick(mk.models);
  const ty = pick(md.types);
  /* keep the registration year inside the type's real build period */
  const y0 = Math.max(2011, +ty.from.slice(0, 4));
  const y1 = Math.min(2024, +ty.to.slice(0, 4));
  const year = between(Math.min(y0, y1), Math.max(y0, y1));
  const dmg = pick(DAMAGE_TYPES);
  const site = pick(SALVAGE_SITES);
  const runs = rnd() > 0.42;
  const retail = between(4200, 38000);
  SALVAGE.push({
    lot: `LOT-${between(400000, 899999)}`,
    vin: `${pick(['WVW', 'WBA', 'WDD', 'WAU', 'VF1', 'VF3', 'JTD', 'WF0'])}${pick(['ZZZ', 'AB1', 'GF8'])}${between(10, 99)}${pick(['A', 'B', 'C', 'D'])}${between(100000, 999999)}`,
    make: mk.name, makeId: mk.id, model: md.name.split(' (')[0], typeName: ty.name, typeId: ty.id,
    year, fuel: ty.fuel, body: ty.body, engine: ty.engine.split(' /')[0],
    odometer: between(28000, 295000),
    damagePrimary: dmg,
    damageSecondary: rnd() > 0.55 ? pick(DAMAGE_TYPES.filter(d => d !== dmg)) : '—',
    severity: dmg === 'Hail' || dmg === 'Vandalism' ? 'Light' : pick(['Light', 'Moderate', 'Moderate', 'Heavy']),
    runsAndDrives: runs,
    keys: rnd() > 0.25,
    airbagsDeployed: dmg === 'Front End' || dmg === 'Side Impact' ? rnd() > 0.35 : rnd() > 0.85,
    title: pick(TITLES),
    location: `${site.city}, ${site.country}`,
    country: site.country,
    estRetail: retail,
    currentBid: Math.round(retail * (0.12 + rnd() * 0.38)),
    buyNow: rnd() > 0.6 ? Math.round(retail * (0.4 + rnd() * 0.25)) : null,
    saleDate: `2026-08-${String(between(11, 30)).padStart(2, '0')}`,
    photos: between(8, 42),
    currency: site.country === 'US' ? 'USD' : site.country === 'CA' ? 'CAD' : site.country === 'AE' ? 'AED' : 'EUR'
  });
}

/* ------------------------------------------------------------------ */
/* 5. SUBSCRIPTION PLANS                                               */
/* ------------------------------------------------------------------ */

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 149, period: 'month', accent: '#5B8DEF',
    tagline: 'For independent garages & single-site resellers',
    calls: '25 000', seats: 3, rate: '5 req/s',
    modules: { parts: true, technical: false, salvage: false },
    features: ['Parts catalogue & vehicle fitment', 'OE + cross-reference lookup', 'CSV export (5 000 rows/day)', 'Email support', '1 API key']
  },
  {
    id: 'pro', name: 'Professional', price: 449, period: 'month', accent: '#00C9A7', popular: true,
    tagline: 'For distributors, workshops chains & marketplaces',
    calls: '250 000', seats: 15, rate: '25 req/s',
    modules: { parts: true, technical: true, salvage: false },
    features: ['Everything in Starter', 'Technical & repair-time data', 'Service schedules, torque, fluids', 'Unlimited CSV / XLSX export', 'Webhooks + HubSpot sync', 'Priority support (8 h SLA)', '5 API keys']
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 1290, period: 'month', accent: '#FF7A45',
    tagline: 'For exporters, insurers & salvage traders',
    calls: 'Unlimited*', seats: 'Unlimited', rate: '100 req/s',
    modules: { parts: true, technical: true, salvage: true },
    features: ['Everything in Professional', 'Damaged / salvage vehicle feed', 'Live bid & buy-now data', 'Bulk feed delivery (S3 / SFTP)', 'White-label sub-accounts', 'Dedicated account manager', 'Custom SLA & 99.9 % uptime', 'Unlimited API keys']
  }
];

/* ------------------------------------------------------------------ */
/* 6. DEMO ACCOUNT + USAGE                                             */
/* ------------------------------------------------------------------ */

const ACCOUNT = {
  company: 'Nordwest Teile GmbH',
  contact: 'Demo User',
  plan: 'pro',
  since: '2026-03-14',
  apiKeys: [
    { label: 'Production', key: 'exr_live_9f2c' + '••••••••••••••••' + 'a41d', created: '2026-03-14', lastUsed: '2 min ago', calls30d: 148230 },
    { label: 'Staging', key: 'exr_test_4b8e' + '••••••••••••••••' + '77c0', created: '2026-05-02', lastUsed: '6 h ago', calls30d: 9814 }
  ],
  usage: { used: 158044, limit: 250000 },
  daily: [4210, 5180, 6120, 5890, 7340, 3120, 2890, 6740, 7010, 8120, 7690, 8340, 4120, 3560, 7880, 8210, 9040, 8760, 9310, 4890, 4010, 8630, 9120, 9840, 10120, 9560, 5210, 4680, 9330, 9910],
  endpointBreakdown: [
    { ep: '/v1/parts/search', calls: 68240, pct: 43 },
    { ep: '/v1/vehicles/types', calls: 31610, pct: 20 },
    { ep: '/v1/parts/{id}', calls: 25290, pct: 16 },
    { ep: '/v1/technical/repair-times', calls: 18960, pct: 12 },
    { ep: '/v1/technical/service-plan', calls: 9480, pct: 6 },
    { ep: '/v1/salvage/listings', calls: 4464, pct: 3 }
  ],
  invoices: [
    { no: 'INV-2026-0731', date: '2026-07-31', amount: 449, status: 'Paid' },
    { no: 'INV-2026-0630', date: '2026-06-30', amount: 449, status: 'Paid' },
    { no: 'INV-2026-0531', date: '2026-05-31', amount: 449, status: 'Paid' },
    { no: 'INV-2026-0430', date: '2026-04-30', amount: 149, status: 'Paid' }
  ]
};

/* ------------------------------------------------------------------ */
/* 7. API ENDPOINT REFERENCE                                           */
/* ------------------------------------------------------------------ */

const ENDPOINTS = [
  {
    method: 'GET', path: '/v1/vehicles/manufacturers', module: 'Parts',
    desc: 'List all manufacturers in the catalogue.',
    sample: { data: [{ id: 'VW', name: 'Volkswagen', country: 'DE', models: 3 }, { id: 'BMW', name: 'BMW', country: 'DE', models: 3 }], meta: { total: 8, page: 1 } }
  },
  {
    method: 'GET', path: '/v1/vehicles/types?model={modelId}', module: 'Parts',
    desc: 'Engine / type variants for a model, with kW, hp, engine codes and build period.',
    sample: { data: [{ typeId: 101, name: '1.6 TDI', kw: 81, hp: 110, cc: 1598, engineCodes: ['CLHA', 'CRKB'], fuel: 'Diesel', from: '2012-08', to: '2020-08' }] }
  },
  {
    method: 'GET', path: '/v1/parts/search?typeId={id}&category={cat}', module: 'Parts',
    desc: 'Parts fitting a given vehicle type, filterable by category, brand and price.',
    sample: { data: [{ id: 100231, articleNo: 'BO-48231A', brand: 'BOSCH', name: 'Brake Disc', oe: ['1K0 615 301 AA'], price: 42.9, currency: 'EUR', stock: 'In stock', criteria: { 'Brake Disc Type': 'Vented', 'Ø Outer [mm]': '288' } }], meta: { total: 34 } }
  },
  {
    method: 'GET', path: '/v1/parts/{articleId}', module: 'Parts',
    desc: 'Full article record: criteria, OE numbers, cross-references, EAN, stock and lead time.',
    sample: { id: 100231, articleNo: 'BO-48231A', brand: 'BOSCH', ean: '4047024812345', crossRef: ['ATE 24012', 'TRW DF4249'], qtyAvailable: 126, leadTime: '24 h' }
  },
  {
    method: 'GET', path: '/v1/technical/service-plan?typeId={id}', module: 'Technical',
    desc: 'Manufacturer service schedule: items, intervals, specifications and quantities.',
    sample: { data: [{ item: 'Engine oil & filter', interval: '30 000 km / 24 months', spec: '5W-30 ACEA C3', qty: '4.3 L' }] }
  },
  {
    method: 'GET', path: '/v1/technical/repair-times?typeId={id}', module: 'Technical',
    desc: 'Standard labour times per operation — used for quoting and invoicing.',
    sample: { data: [{ code: 'RT-101-03', job: 'Clutch assembly — renew', hours: 5.4 }] }
  },
  {
    method: 'GET', path: '/v1/technical/torque?typeId={id}', module: 'Technical',
    desc: 'Torque specifications with angle stages and fitting notes.',
    sample: { data: [{ item: 'Wheel bolts / nuts', nm: '120', note: 'Tighten crosswise' }] }
  },
  {
    method: 'GET', path: '/v1/salvage/listings?country={cc}&damage={type}', module: 'Salvage',
    desc: 'Damaged / accident vehicle inventory with condition, title status and live bid data.',
    sample: { data: [{ lot: 'LOT-582104', vin: 'WVWZZZ1KZAW••••••', make: 'Volkswagen', model: 'Golf VII', year: 2018, damagePrimary: 'Front End', severity: 'Moderate', runsAndDrives: true, currentBid: 3450, currency: 'EUR', saleDate: '2026-08-19' }], meta: { total: 180 } }
  },
  {
    method: 'POST', path: '/v1/webhooks', module: 'Platform',
    desc: 'Register a callback for price changes, stock movements or new salvage lots.',
    sample: { id: 'wh_8821', url: 'https://client.example/hooks/exportrev', events: ['part.price_changed', 'salvage.lot_created'], status: 'active' }
  },
  {
    method: 'GET', path: '/v1/account/usage', module: 'Platform',
    desc: 'Current billing-period call count, limit and per-endpoint breakdown.',
    sample: { period: '2026-08', used: 158044, limit: 250000, rateLimit: '25 req/s' }
  }
];
