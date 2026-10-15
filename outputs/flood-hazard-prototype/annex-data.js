const annexData = [
  {
    "municipality": "Paniqui",
    "location": "Matalapitap (portions of)",
    "occurrence": "04:00AM, 22 September",
    "description": "Reported as of 10:00AM, 22 September",
    "action": "Conducted roving in coordination with BDRRMC",
    "remarks": "Subsided as of 22 September",
    "status": "Subsided"
  },
  {
    "municipality": "Paniqui",
    "location": "Canan (portions of)",
    "occurrence": "",
    "description": "Reported as of 10:00AM, 22 September",
    "action": "",
    "remarks": "",
    "status": "Status unreported"
  },
  {
    "municipality": "Paniqui",
    "location": "Sta. Ines (portions of)",
    "occurrence": "",
    "description": "Reported as of 10:00AM, 22 September",
    "action": "",
    "remarks": "",
    "status": "Status unreported"
  },
  {
    "municipality": "Paniqui",
    "location": "Coral (portions of)",
    "occurrence": "",
    "description": "Reported as of 10:00AM, 22 September",
    "action": "",
    "remarks": "",
    "status": "Status unreported"
  },
  {
    "municipality": "Paniqui",
    "location": "Sitio Bacao, Brgy. Salumague",
    "occurrence": "05:00PM, 22 September",
    "description": "1 1/2 ft, Reported as of 05:00PM, 22 September",
    "action": "",
    "remarks": "Still flooded (3 ft) as of 11:00PM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Paniqui",
    "location": "Sitio Lising, Brgy. Salumague",
    "occurrence": "",
    "description": "1 1/2 ft, Reported as of 05:00PM, 22 September",
    "action": "",
    "remarks": "",
    "status": "Status unreported"
  },
  {
    "municipality": "Paniqui",
    "location": "Sitio Caturay, Brgy. Apulid",
    "occurrence": "11:00AM, 23 September",
    "description": "2 ft, Reported as of 11:00AM, 23 September",
    "action": "",
    "remarks": "Still flooded (2ft) as of 11:00PM, 25 September",
    "status": "Still flooded"
  },
  {
    "municipality": "San Manuel",
    "location": "Brgy. San Vicente (portions of)",
    "occurrence": "01:00PM, 19 September",
    "description": "2 ft, as of 05:00PM, 22 September",
    "action": "Conducted roving in coordination with BDRRMC",
    "remarks": "Subsided as of 24 September",
    "status": "Subsided"
  },
  {
    "municipality": "Camiling",
    "location": "Cacamilingan Sur",
    "occurrence": "01:00PM, 23 September",
    "description": "2-3 ft, Reported as of 05:00PM, 23 September",
    "action": "Conducted roving in coordination with BDRRMCs",
    "remarks": "Subsided as of 24 September",
    "status": "Subsided"
  },
  {
    "municipality": "Camiling",
    "location": "Pao 1st",
    "occurrence": "01:00PM, 23 September",
    "description": "2-3 ft, Reported as of 05:00PM, 23 September",
    "action": "",
    "remarks": "",
    "status": "Status unreported"
  },
  {
    "municipality": "Camiling",
    "location": "Bilad",
    "occurrence": "03:00PM, 23 September",
    "description": "1-2 ft, Reported as of 05:00PM, 23 September",
    "action": "",
    "remarks": "",
    "status": "Status unreported"
  },
  {
    "municipality": "Camiling",
    "location": "Sawat",
    "occurrence": "03:00PM, 23 September",
    "description": "1-2 ft, Reported as of 05:00PM, 23 September",
    "action": "",
    "remarks": "",
    "status": "Status unreported"
  },
  {
    "municipality": "Ramos",
    "location": "Purok Jolo, Brgy. Guiteb",
    "occurrence": "11:00AM, 23 September",
    "description": "1-2 ft, Reported as of 11:00AM, 23 September",
    "action": "Conducted roving in coordination with BDRRMCs and MSWDO",
    "remarks": "Still flooded (1-2 ft) as of 09:00AM,  26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Ramos",
    "location": "Purok Taguig, Brgy. Poblacion South",
    "occurrence": "11:00AM, 23 September",
    "description": "1-2 ft, Reported as of 11:00AM, 23 September",
    "action": "",
    "remarks": "Subsided as of 4PM, 25 September",
    "status": "Subsided"
  },
  {
    "municipality": "Ramos",
    "location": "Brgy. Pance",
    "occurrence": "12:00NN, 24 September",
    "description": "2 ft, Reported as of 12:00NN, 24 September",
    "action": "",
    "remarks": "Still flooded (1-2 ft) as of 09:00AM,  26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Purok Maligaya, Brgy. Sta. Lucia East",
    "occurrence": "08:00AM, 24 September",
    "description": "2-3 ft, Reported as of 08:00AM, 24 September",
    "action": "Conducted roving in coordination with BDRRMC",
    "remarks": "Still flooded but receded to 1-2 ft as of 08:00AM,                           26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Purok Pagasa, Brgy. Sta. Lucia East",
    "occurrence": "08:00AM, 24 September",
    "description": "2-3 ft, Reported as of 08:00AM, 24 September",
    "action": "",
    "remarks": "",
    "status": "Status unreported"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Calapan",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "Conducted roving in coordination with BDRRMCs and MSWDO",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Burgos",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Mabini",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Subsided as of 08:00AM, 26 September",
    "status": "Subsided"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Sta. Maria",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Lapsing",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Subsided as of 08:00AM, 26 September",
    "status": "Subsided"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Baquero Sur",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Maluac",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Subsided as of 08:00AM, 26 September",
    "status": "Subsided"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Tolega Norte",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Tolega Sur",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Baquero Norte",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Banaoang East",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Capaoayan",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. San Leon",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. San Juan",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "Moncada",
    "location": "Portions of Brgy. Sta. Lucia West",
    "occurrence": "10:00AM, 23 September",
    "description": "1 ft, Reported as of 12:00NN, 25 September",
    "action": "",
    "remarks": "Still flooded (1 ft) as of 08:00AM, 26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "La Paz",
    "location": "Old Macalong, Brgy. Macalong",
    "occurrence": "02:00PM, 24 September",
    "description": "1 ft, Reported as of 02:00PM, 24 September",
    "action": "Conducted roving in coordination wisth BDRRMCs",
    "remarks": "Still flooded (1 ft) as of 09:00AM,  26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "La Paz",
    "location": "Sitio Mait, Brgy. San Isidro",
    "occurrence": "02:00PM, 24 September",
    "description": "1 ft, Reported as of 02:00PM, 24 September",
    "action": "",
    "remarks": "Still flooded (2 ft) as of 09:00AM,  26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "La Paz",
    "location": "Purok Tagumpay, Brgy. San Roque",
    "occurrence": "02:00PM, 24 September",
    "description": "3-4 ft, Reported as of 02:00PM, 24 September",
    "action": "",
    "remarks": "Still flooded (<1 ft) as of 09:00PM,  26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "La Paz",
    "location": "Purok Bagong Sikat, Brgy. San Roque",
    "occurrence": "02:00PM, 24 September",
    "description": "3-4 ft, Reported as of 02:00PM, 24 September",
    "action": "",
    "remarks": "Still flooded (1-2 ft) as of 09:00PM,  26 September",
    "status": "Still flooded"
  },
  {
    "municipality": "La Paz",
    "location": "Purok Libtong, Brgy. San Roque",
    "occurrence": "02:00PM, 24 September",
    "description": "3-4 ft, Reported as of 02:00PM, 24 September",
    "action": "",
    "remarks": "Still flooded (1-2 ft) as of 09:00AM,  26 September",
    "status": "Still flooded"
  }
];
