/**
 * Subset of the Google Civic Information API `voterInfoQuery` response
 * that we actually consume. The live response has many more fields
 * (precincts, pollingLocations, etc.) which we ignore for now.
 *
 * Full docs: https://developers.google.com/civic-information/docs/v2/elections/voterInfoQuery
 *
 * Note: the Representatives endpoint was retired April 2025; voterInfoQuery
 * remains active but only returns data during active election windows.
 */

export interface GoogleCivicElection {
  id: string;
  name: string;
  electionDay: string; // ISO date
  ocdDivisionId?: string;
}

export interface GoogleCivicDistrict {
  name: string;
  scope:
    | 'statewide'
    | 'congressional'
    | 'stateUpper'
    | 'stateLower'
    | 'countywide'
    | 'judicial'
    | 'schoolBoard'
    | 'cityWide'
    | 'township'
    | 'countyCouncil'
    | 'cityCouncil'
    | 'ward'
    | 'special'
    | 'national';
  id?: string;
}

export interface GoogleCivicChannel {
  type: string;
  id: string;
}

export interface GoogleCivicCandidate {
  name: string;
  party?: string;
  candidateUrl?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  orderOnBallot?: number;
  channels?: GoogleCivicChannel[];
}

export interface GoogleCivicContest {
  type?: string;
  office?: string;
  ballotTitle?: string;
  district: GoogleCivicDistrict;
  candidates?: GoogleCivicCandidate[];
  level?: string[];
  roles?: string[];
  ballotPlacement?: number;
  numberElected?: number;
  numberVotingFor?: number;
}

export interface GoogleCivicResponse {
  election?: GoogleCivicElection;
  contests?: GoogleCivicContest[];
  otherElections?: GoogleCivicElection[];
  kind?: string;
}

/**
 * The shape our Edge Function returns to the client.
 * `source: 'fallback'` means Google returned no contests (no active
 * election in the window, or Google errored). The client should fall
 * back to Geocodio-based district resolution.
 */
export interface BallotResponse {
  source: 'google' | 'fallback';
  electionName?: string;
  electionDate?: string;
  districts: import('../types/domain').District[];
  candidateIds: string[];
}
