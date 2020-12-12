import rawData2016 from './2016.json';
import rawData2020 from './2020.json';
import raw2008_2016 from './2008_2016.json';
import { keyBy, groupBy, uniq, values, sortBy } from 'lodash';

const state_hash: any = {
  AL: 'Alabama',
  AK: 'Alaska',
  AS: 'American Samoa',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District Of Columbia',
  FM: 'Federated States Of Micronesia',
  FL: 'Florida',
  GA: 'Georgia',
  GU: 'Guam',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MH: 'Marshall Islands',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  MP: 'Northern Mariana Islands',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PW: 'Palau',
  PA: 'Pennsylvania',
  PR: 'Puerto Rico',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VI: 'Virgin Islands',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

const fipsToJson: any = {
  "01": "Alabama",
  "02": "Alaska",
  "04": "Arizona",
  "05": "Arkansas",
  "06": "California",
  "08": "Colorado",
  "09": "Connecticut",
  "10": "Delaware",
  "11": "District of Columbia",
  "12": "Florida",
  "13": "Georgia",
  "15": "Hawaii",
  "16": "Idaho",
  "17": "Illinois",
  "18": "Indiana",
  "19": "Iowa",
  "20": "Kansas",
  "21": "Kentucky",
  "22": "Louisiana",
  "23": "Maine",
  "24": "Maryland",
  "25": "Massachusetts",
  "26": "Michigan",
  "27": "Minnesota",
  "28": "Mississippi",
  "29": "Missouri",
  "30": "Montana",
  "31": "Nebraska",
  "32": "Nevada",
  "33": "New Hampshire",
  "34": "New Jersey",
  "35": "New Mexico",
  "36": "New York",
  "37": "North Carolina",
  "38": "North Dakota",
  "39": "Ohio",
  "40": "Oklahoma",
  "41": "Oregon",
  "42": "Pennsylvania",
  "44": "Rhode Island",
  "45": "South Carolina",
  "46": "South Dakota",
  "47": "Tennessee",
  "48": "Texas",
  "49": "Utah",
  "50": "Vermont",
  "51": "Virginia",
  "53": "Washington",
  "54": "West Virginia",
  "55": "Wisconsin",
  "56": "Wyoming"
}

export const STATE_OPTIONS = sortBy(values(fipsToJson), s => s);


interface DP {
  gop: number,
  dem: number,
  other: number,
  total: number,
  name: string,
  state: string,
}

const data2016: DP[] = rawData2016
  .filter((d: any) => d.total_votes && state_hash[d.state_abbr] && d.county_name)
  .map((obj: any) => ({
    gop: obj.votes_gop,
    dem: obj.votes_dem,
    other: obj.total_votes - obj.votes_gop - obj.votes_dem,
    total: obj.total_votes,
    name: `${obj.county_name}, ${state_hash[obj.state_abbr]}`,
    state: state_hash[obj.state_abbr],
  }));

const data2020 = rawData2020
  .filter((d: any) => d.total_votes && d.state_name && d.county_name)
  .map((obj: any) => ({
    gop: obj.votes_gop,
    dem: obj.votes_dem,
    other: obj.total_votes - obj.votes_gop - obj.votes_dem,
    total: obj.total_votes,
    name: `${obj.county_name}, ${obj.state_name}`,
    state: obj.state_name,
    county: obj.county_name,
  }));

const indexed2020 = keyBy(data2020, d => d.name);

const set2020 = keyBy(data2020, d => d.name);
const set2016 = keyBy(data2016, d => d.name);
const names = uniq([...data2020.map(d => d.name), ...data2016.map(d => d.name)]);

export const formatted = names
  .filter(key => set2020[key] && set2016[key])
  .map(name => {
    const dp2016 = set2016[name];
    const dp2020 = set2020[name];
    const pointdiff2016 = dp2016.dem / dp2016.total - dp2016.gop / dp2016.total;
    const pointdiff2020 = dp2020.dem / dp2020.total - dp2020.gop / dp2020.total;
    return {
      dp2016,
      dp2020,
      gop: dp2020.gop - dp2016.gop,
      dem: dp2020.dem - dp2016.dem,
      other: dp2020.other - dp2016.other,
      name,
      state: dp2016.state,
      pointdiff2016,
      pointdiff2020,
      pointdiffdiff: pointdiff2020 - pointdiff2016,
    };
  });



export function log() {
  console.log({ delta: formatted });
  const grouped = groupBy(formatted, d => d.state);
  console.log({ grouped });

  type Data = {
    gop: number,
    dem: number,
    other: number,
    year: number,
    county: string,
    state: string,
    name: string,
  }

  const result: Data[] = [];
  (raw2008_2016 as any).forEach((obj: any) => {
    const stateCode = String(obj.fips_code).slice(0, 2);
    const state = fipsToJson[stateCode];
    const name = `${obj.county}, ${state}`
    if (!indexed2020[name]) return;
    if (!state || !obj.county) return;
    for (const year of [2008, 2012, 2016]) {
      result.push({
        gop: obj['gop_' + year],
        dem: obj['dem_' + year],
        other: obj['oth_' + year],
        year,
        county: obj.county,
        state,
        name: `${obj.county}, ${state}`,
      })
    }
    const dp2020 = indexed2020[name];
    result.push({
      gop: dp2020.gop,
      dem: dp2020.dem,
      other: dp2020.other,
      year: 2020,
      county: dp2020.county,
      state: dp2020.state,
      name: dp2020.name,
    })
  });
  console.log({ result })
}

export function getData() {

  type Data = {
    gop: number,
    dem: number,
    other: number,
    total: number,
    year: number,
    county: string,
    state: string,
    name: string,
  }

  const result: Data[] = [];
  (raw2008_2016 as any).forEach((obj: any) => {
    const stateCode = String(obj.fips_code).slice(0, 2);
    const state = fipsToJson[stateCode];
    const name = `${obj.county}, ${state}`
    if (!indexed2020[name]) return;
    if (!state || !obj.county) return;
    for (const year of [2008, 2012, 2016]) {
      result.push({
        gop: obj['gop_' + year],
        dem: obj['dem_' + year],
        other: obj['oth_' + year],
        total: obj['total_' + year],
        year,
        county: obj.county,
        state,
        name: `${obj.county}, ${state}`,
      })
    }
    const dp2020 = indexed2020[name];
    result.push({
      gop: dp2020.gop,
      dem: dp2020.dem,
      other: dp2020.other,
      total: dp2020.total,
      year: 2020,
      county: dp2020.county,
      state: dp2020.state,
      name: dp2020.name,
    })
  });
  return result;
}


