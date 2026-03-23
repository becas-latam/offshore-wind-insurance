# Project Setup V2 — Additional Features

Based on the updated CAR risk analysis reference and marine insurance reference, the following features need to be added to the project setup.

---

## 1. Construction Timeline Visualization (NEW FEATURE)

An interactive timeline where users define when each contractor with vessels is on the offshore site. This enables:
- Visual overlap detection (which contractors are on site simultaneously = cross-contractor risk)
- Phase-based risk assessment
- Period of insurance mapping per contractor

### User Inputs
| Input | Format | Notes |
|---|---|---|
| Overall CAR policy period | Start date — End date | Defines the outer boundary |
| Expected COD (Commercial Operation Date) | Date | |
| Per contractor: offshore period | Start date — End date | When they have vessels/operations offshore |
| Per contractor: marshalling port period | Start date — End date | When they're at the port |
| Per contractor: expected Take Over date | Date | When co-insurance ends |

### Visualization
- Gantt-chart style horizontal bars per contractor
- Color-coded by scope (WTG, Foundations, IAC, etc.)
- Overlapping periods highlighted (cross-contractor risk zones)
- Construction phases (1-6) shown as background bands
- Key milestones: CAR inception, first offshore, COD, Take Over dates

---

## 2. Insured Sites (NEW SECTION)

Users define the insured sites listed in the CAR policy. Default sites provided, user can add more.

### Default Sites
| Site | Description | Example |
|---|---|---|
| Site 1 | Manufacturing facility | Blade factory, monopile fabrication yard |
| Site 2 | Marshalling harbour / installation port | Cuxhaven, Esbjerg, Eemshaven |
| Site 3 | Offshore construction site | The wind farm location |
| Site 4 | Onshore substation / cable route | If applicable |

### User Inputs
- Editable table of sites (name + description)
- User can add/remove sites
- Per contractor: which sites are relevant
- Flag: any storage/staging locations NOT listed as insured sites? (gap detection)

---

## 3. Serial Loss — Insurance (EXPANDED)

Current: simple yes/no + aggregation period
Needed: much more detailed

### New Fields per Wind Farm (CAR policy level)
| Input | Format | Notes |
|---|---|---|
| Serial loss clause in CAR | yes / no | |
| Aggregation basis | Per root cause / Per individual loss | Critical distinction |
| Declining coverage scale | yes / no | |
| Scale tier structure per component type | e.g., "3-3-3" or "5-5-5" | Number of losses per tier |
| Coverage percentages per tier | e.g., "100%-75%-50%" | |
| Declining scale applies to DSU/BI | yes / no (default: no) | |

---

## 4. Serial Defect — Contract (NEW, separate from insurance)

Per contractor:
| Input | Format | Notes |
|---|---|---|
| Serial defect clause in contract | yes / no | |
| Trigger threshold | Number (e.g., 3 same-type failures) | |
| Contractor obligation when triggered | Inspect all / Inspect + replace all / Other | |

---

## 5. Maintenance Cover Type (EXPANDED)

Current: just extended maintenance yes/no + duration
Needed: three levels of maintenance cover

### New Fields per Contractor
| Input | Format | Notes |
|---|---|---|
| Maintenance cover type | Visits only / Extended / Warranty(Guarantee) | |
| Maintenance period duration | Months from Take Over | |
| Design defects included | yes / no | Only if Extended (to distinguish narrow vs broad) |
| Scope limitations | Free text | |

---

## 6. CAR-TPL (NEW SECTION)

### New Fields per Wind Farm
| Input | Format | Notes |
|---|---|---|
| CAR-TPL in place | yes / no | |
| CAR-TPL limit | Amount | |
| CAR-TPL deductible | Amount | |
| Watercraft buy-back | yes / no / unknown | Vessel damage included in TPL? |
| Gap between contractor mobilisation and CAR inception | yes / no / unknown | |
| Contractor own insurance requirements in contract | yes / no | |

---

## 7. Marine Insurance Details (FROM MARINE REFERENCE)

Per contractor (expanding existing fields):
| Input | Format | Notes |
|---|---|---|
| Contractor H&M in place | yes / no | NEW |
| Other project contractors co-insured on H&M | yes / no / unknown | NEW |
| UXO cover on H&M | yes / no / unknown | NEW |
| RDC level | 3/4 / 4/4 / unknown | NEW |
| Specialist operations covered under H&M | yes / no / unknown | NEW |
| Contractor P&I in place | yes / no | NEW |
| P&I protective co-insurance (misdirected arrow) | yes / no | NEW |
| P&I contractual liability extension | yes / no / n/a | NEW — critical for negligence contracts |
| P&I specialist operations extension | yes / no / n/a | NEW — critical |
| P&I club name | Text | NEW |
| Vessel provision | Contractor provides / Employer provides / Mixed | NEW |

---

## 8. Port Liability (FROM MARINE REFERENCE)

### New Fields per Wind Farm
| Input | Format | Notes |
|---|---|---|
| Port contract structure | Employer holds / Each contractor arranges / Joint / Mixed | |
| Port liability regime | Negligence (default) / Other | |

### Per Contractor (if Employer holds port contract)
| Input | Format | Notes |
|---|---|---|
| Port damage indemnity in contract | yes / no | |
| P&I covers port damage indemnity | yes / no / unknown | |

---

## 9. Aviation (FROM MARINE REFERENCE)

### New Fields per Wind Farm
| Input | Format | Notes |
|---|---|---|
| Helicopter operations planned | yes / no | |
| Aviation liability policy in place | yes / no | |
| Employer co-insured on aviation liability | yes / no | |

---

## Build Priority

### Phase A — High Priority (core analysis quality)
1. Insured Sites (simple table, high impact on analysis)
2. Serial Loss insurance details (declining scale)
3. Serial Defect contract clause (per contractor)
4. Maintenance cover type (3 levels)
5. CAR-TPL section

### Phase B — Medium Priority (marine depth)
6. Marine insurance details expansion (per contractor)
7. Port liability
8. Aviation

### Phase C — Timeline Visualization
9. Construction timeline / Gantt chart
10. Contractor offshore periods
11. Cross-contractor overlap visualization

---

## Notes
- The timeline visualization is the most complex feature and should be built separately
- All other fields can be added to existing wizard steps (Insurance Conditions, Deductibles, etc.)
- Some fields may warrant new steps in the wizard to avoid overwhelming existing steps
