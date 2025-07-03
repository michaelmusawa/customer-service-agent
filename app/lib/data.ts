interface Service {
  name: string;
  subServices: string[];
}

export const Services: Service[] = [
  { name: "Daily parking", subServices: ["On-street", "Off-street"] },
  {
    name: "Seasonal parking",
    subServices: [
      "PSV Matatus Parking Stickers",
      "Private",
      "Lorries PSV Parking Stickers",
      "Taxis PSV Parking Stickers",
    ],
  },
  {
    name: "Reserved Parking",
    subServices: [
      "Loading Zones",
      "PSV Matatu Parking Bay Hire",
      "Trailer Parking  Bay Hire",
      "Parking bay hire",
    ],
  },
  { name: "VIP Parking", subServices: ["VIP Parking"] },
  {
    name: "Land Valuation",
    subServices: ["Land Valuation", "Provisional Valuation"],
  },
  {
    name: "Land Rates",
    subServices: [
      "Annual Land rates",
      "Rates Search",
      "Land Transfers",
      "Ground Rent",
      "Penalties on Land Rates",
      "Waiver of Penalties on Land",
      "SDR-Stand Premium",
      "Clearance Certificate",
    ],
  },
  { name: "Land Survey ", subServices: ["Land Surveying"] },
  {
    name: "Land Use Planning ",
    subServices: [
      "Land Subdivision",
      "Change of Use",
      "Land Amalgamation",
      "Extension/renewal of lease",
    ],
  },
  {
    name: "Development Control",
    subServices: [
      "Building Permits",
      "Construction Site Board",
      "Building Occupation Certificate",
      "Renovation Permit",
    ],
  },
  {
    name: "Advertisement Management",
    subServices: [
      "Outdoor Advertisements (Large signage)",
      "Outdoor Advertisements (Small signage)",
      "Outdoor Events",
    ],
  },
  {
    name: "County Rents",
    subServices: ["County Houses", "County Market Stalls"],
  },

  {
    name: "Tenant Purchase Scheme-TPS",
    subServices: [
      "Tenant Purchase Scheme-TPS Stalls",
      "Tenant Purchase Scheme-TPS Houses",
    ],
  },

  {
    name: "Site & Service Scheme- SSS ",
    subServices: ["Site & Service Scheme- SSS "],
  },
  {
    name: "NCCG Premises Annual Rent ",
    subServices: ["NCCG Premises Annual Rent "],
  },

  {
    name: "Market Cess",
    subServices: ["Market Cess - W/Sale", "Market Cess - Retail"],
  },
  {
    name: "Single/Unified Business Permits",
    subServices: ["Single Business Permits"],
  },
  { name: "Liquor Licensing", subServices: ["Liquor Licensing"] },
  { name: "Weights and Measures", subServices: ["Weights and Measures"] },
  {
    name: "Betting & Gaming",
    subServices: [
      " Pool Table Licence",
      "Public Gaming Premises License",
      "Betting Premises License",
      "Totaliszator Premises License",
      "Funfair/Tombola Permit",
      "Amusement Machines License",
      "Prize Competition Permit",
      "3 Months Lottery Permit",
      "Annual Lottery Permit",
      "Bingo Permit",
      "Draw Permit",
      "Others",
    ],
  },
  {
    name: "County Hospital Administration",
    subServices: [
      " Pumwani M. Hospital",
      "Mbagathi Hospital",
      "Mama Lucy Hospital",
      "Mutuini Hospital",
      "County Health Centers",
    ],
  },
  {
    name: "Health Certificates",
    subServices: [
      "Birth and Death Certificate",
      "Food Hygiene License",
      "Food Handlers Certificate",
      "Health Certificate",
      "Export Certificate",
    ],
  },
  {
    name: "Public Health Services",
    subServices: [
      "City Mortuary",
      "Ambulance Fees",
      "Laboratory fees",
      "Innoculation",
      "Pest Control",
      "Inst. Insp. Fees & Parklands",
      "Research and Attachment",
    ],
  },
  {
    name: "Fire & Disaster Management",
    subServices: [
      "Fire Inspection Certificate",
      "Fire Fighting (call)nServices",
      "Fire Special Services",
    ],
  },
  {
    name: "Education",
    subServices: [
      "Reg./Inspection of Schools",
      "Hire of School Halls/Equipment",
      "Waithaka Training Centre",
      "Nurseries Fees & Charges",
      "Pre-Unit Fees & Charges",
      "Dagoretti Training Fees",
      "Library Services",
    ],
  },
  {
    name: "Environment, Water& Natural Resources Management",
    subServices: [
      "Annual Waste Coll. Permit",
      "Public Toilets Management",
      "Recycling/Incinerator Permit",
      "Garbage/Tipping Charges",
      "Waste Policy Mgt/Fines",
      "Weigh Bridge Charges",
      "Trans. Soil Construction Site/Nwsc",
      "Building Materials",
      "Solid Waste Management",
      "Cutting Trees",
      "Sale of Plants/Firewood",
      "Noise Pollution Permit",
      "Dog License",
      "Recycling / Incinerator Permits",
      "Boating Fees (Lease) -Uhuru Park",
      "Landscaping",
    ],
  },
  {
    name: "Public Works",
    subServices: [
      "Wayleave",
      "Removal and Storage",
      "Sale of broken slabs (7-ton lorry)",
      "Sale of drums",
      "Hoarding",
      "Damage of Pavement/Slabs",
      "Road Cuttings & Reinstatements",
      "Electricity & Maintenance",
      "Civil Engineering",
      "Street light pole",
      "Encroachment within the street pavement",
      "Chain barriers",
      "Bus shelters",
      "Bridges",
      "Booths, Stands & Rent",
      "Hire of Flags & Buntings",
      "Building works",
      "Hire of Lorry(dry)",
      "Hire of plant and equipment",
      "Hire of Hydraulic platform vehicle",
      "Engineering survey",
      "Traffic study report",
      "Road works and storm water drainage",
    ],
  },
  {
    name: "Admin and Other Services",
    subServices: [
      "Temporary Occupation License",
      "Technical Assistance",
      "Court Fines (all sectors)-Legal",
      "Consent Fees-Legal",
      "Court Awards-Legal",
      "Zebra Crossing-Legal",
      "Conveyance Fees-Legal",
      "Impounding-Dagoretti ",
      "Impounding (Enfor/Tlb)",
      "Sale of Tender/Bid Documents",
      "Sale of minutes/ By-laws",
      "Bail/Refunds/Imprest/Rest/Disposals",
      "Co-Operative Audit",
      "Co-Operative Development",
      "Capital Disposal",
      "HRM-Attachment/Loss of Id/Bail",
    ],
  },
  {
    name: "Hire of Halls",
    subServices: [
      "City Hall Annex",
      "Charter Hall",
      "Conference Hall",
      "City Hall Garden/Space",
    ],
  },
  {
    name: "Hire of City Stadium & Stadium Grounds",
    subServices: ["Hire of City Stadium & Stadium Grounds"],
  },

  { name: "Vet Services", subServices: ["Vet Services"] },

  { name: "Fisheries", subServices: ["Fisheries"] },

  { name: "Sale of Dogs", subServices: ["Sale of Dogs"] },

  { name: "Animal Pounds", subServices: ["Animal Pounds"] },

  { name: "BUS SHELTERS LICENSE", subServices: ["BUS SHELTERS LICENSE"] },

  {
    name: "Hire of Uhuru Park/ Kamukunji/ Jevanjee Garden/ City Park ,etc",
    subServices: ["Hire of Uhuru Park/ Kamukunji/ Jevanjee Garden/ City Park "],
  },
];
