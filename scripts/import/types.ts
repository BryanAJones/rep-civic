/**
 * Intermediate types for the import pipeline.
 * Raw CSV data is parsed into these, then transformed into Rep schema rows.
 */

// Raw parsed record from FEC candidate bulk file
export interface FecCandidate {
  candidateId: string;       // CAND_ID (e.g., H6GA06123)
  name: string;              // CAND_NAME (LAST, FIRST MIDDLE)
  party: string;             // CAND_PTY_AFFILIATION (DEM, REP, LIB, etc.)
  electionYear: number;      // CAND_ELECTION_YR
  state: string;             // CAND_ST (GA)
  office: 'H' | 'S';        // CAND_OFFICE (H=House, S=Senate)
  district: string;          // CAND_OFFICE_DISTRICT (01-14 for House, 00 for Senate)
  incumbentFlag: string;     // CAND_ICI (I=Incumbent, C=Challenger, O=Open)
  status: string;            // CAND_STATUS (C=Candidate, N=Not yet candidate)
}

// Raw parsed record from OpenStates people CSV
export interface OpenStatesLegislator {
  id: string;                // OpenStates person ID
  name: string;              // Full name
  party: string;             // Party affiliation
  currentRole: string;       // e.g., "upper" or "lower"
  district: string;          // District number
  jurisdiction: string;      // State (Georgia)
  givenName: string;
  familyName: string;
}

// Unified intermediate record after both sources are parsed
export interface ImportCandidate {
  sourceId: string;          // Original ID from source (FEC CAND_ID, OpenStates person ID, Congress bioguideId)
  source: 'fec' | 'openstates' | 'congress';
  name: string;              // "First Last" format
  initials: string;          // Two-letter initials
  party: string;             // Normalized: "Democratic", "Republican", "Libertarian", etc.
  officeTitle: string;       // e.g., "U.S. Representative", "State Senator"
  districtCode: string;      // OCD-ID based code matching Geocodio format
  level: 'state' | 'federal';
  isIncumbent: boolean;      // True for sitting members (congress.gov) — used for tie-breaks during dedup
}

// Ready-to-insert rows
export interface DistrictRow {
  code: string;
  level: 'city' | 'county' | 'state' | 'federal';
  office_title: string;
  district_name: string;
  display_label: string;
}

export interface CandidateRow {
  name: string;
  initials: string;
  office_title: string;
  district_code: string;
  party: string;
  status: 'unclaimed';
  filing_id: string | null;
  filing_date: string | null;
  opponent_count: number;
}
