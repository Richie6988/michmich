// ============================================================
// EUROPEAN REDUCTION & LOYALTY CARDS
// Used in setup to let participants register their cards
// ============================================================

export interface CardProvider {
  id: string;
  label: string;
  type: 'rail' | 'air' | 'bus' | 'multi';
  /** Default discount % when used (estimation only) */
  defaultReduction?: number;
  /** Country code(s) where it operates */
  countries?: string[];
  /** Customer/loyalty number format hint */
  hint?: string;
}

export const CARD_PROVIDERS: CardProvider[] = [
  // ===== RAIL =====
  // France
  { id: 'sncf-voyageur', label: 'SNCF Carte Voyageur', type: 'rail', countries: ['FR'], hint: '13-digit number' },
  { id: 'sncf-avantage-jeune', label: 'SNCF Carte Avantage Jeune (12-27)', type: 'rail', defaultReduction: 30, countries: ['FR'] },
  { id: 'sncf-avantage-adulte', label: 'SNCF Carte Avantage Adulte (27-59)', type: 'rail', defaultReduction: 30, countries: ['FR'] },
  { id: 'sncf-avantage-senior', label: 'SNCF Carte Avantage Senior (60+)', type: 'rail', defaultReduction: 30, countries: ['FR'] },
  { id: 'sncf-liberte', label: 'SNCF Carte Liberté', type: 'rail', defaultReduction: 45, countries: ['FR'] },
  { id: 'sncf-tgvmax', label: 'SNCF Max Jeune (16-27)', type: 'rail', defaultReduction: 100, countries: ['FR'] },
  { id: 'eurostar-frequent', label: 'Eurostar Frequent Traveller', type: 'rail', countries: ['FR', 'GB', 'BE', 'NL'] },

  // Germany
  { id: 'db-bahncard-25', label: 'DB BahnCard 25', type: 'rail', defaultReduction: 25, countries: ['DE'] },
  { id: 'db-bahncard-50', label: 'DB BahnCard 50', type: 'rail', defaultReduction: 50, countries: ['DE'] },
  { id: 'db-bahncard-100', label: 'DB BahnCard 100', type: 'rail', defaultReduction: 100, countries: ['DE'] },
  { id: 'db-bahnbonus', label: 'DB Bahn.Bonus', type: 'rail', countries: ['DE'] },

  // Italy
  { id: 'trenitalia-cartafreccia', label: 'Trenitalia CartaFreccia', type: 'rail', countries: ['IT'] },
  { id: 'trenitalia-xgo', label: 'Trenitalia X Go', type: 'rail', defaultReduction: 30, countries: ['IT'] },

  // Spain
  { id: 'renfe-tarjeta-dorada', label: 'Renfe Tarjeta Dorada (60+)', type: 'rail', defaultReduction: 40, countries: ['ES'] },
  { id: 'renfe-mas-renfe', label: 'Renfe + Renfe', type: 'rail', countries: ['ES'] },

  // Switzerland
  { id: 'sbb-halbtax', label: 'SBB Half Fare Card', type: 'rail', defaultReduction: 50, countries: ['CH'] },
  { id: 'sbb-ga', label: 'SBB GA (General)', type: 'rail', defaultReduction: 100, countries: ['CH'] },

  // Belgium / Netherlands / Austria
  { id: 'sncb-rail-pass', label: 'SNCB Rail Pass', type: 'rail', countries: ['BE'] },
  { id: 'ns-voordeelurenabo', label: 'NS Dal Voordeel', type: 'rail', defaultReduction: 40, countries: ['NL'] },
  { id: 'oebb-vorteilscard', label: 'ÖBB Vorteilscard', type: 'rail', defaultReduction: 50, countries: ['AT'] },

  // EU-wide
  { id: 'interrail', label: 'Interrail Pass', type: 'rail', countries: ['EU'] },
  { id: 'eurail', label: 'Eurail Pass', type: 'rail', countries: ['EU'] },

  // ===== AIR =====
  { id: 'airfrance-flyingblue', label: 'Air France/KLM Flying Blue', type: 'air', countries: ['FR', 'NL'] },
  { id: 'klm-flyingblue', label: 'KLM Flying Blue', type: 'air', countries: ['NL'] },
  { id: 'lufthansa-miles-more', label: 'Lufthansa Miles & More', type: 'air', countries: ['DE'] },
  { id: 'swiss-miles-more', label: 'Swiss Miles & More', type: 'air', countries: ['CH'] },
  { id: 'austrian-miles-more', label: 'Austrian Miles & More', type: 'air', countries: ['AT'] },
  { id: 'iberia-plus', label: 'Iberia Plus', type: 'air', countries: ['ES'] },
  { id: 'alitalia-millemiglia', label: 'ITA Airways Volare', type: 'air', countries: ['IT'] },
  { id: 'tap-victoria', label: 'TAP Miles&Go', type: 'air', countries: ['PT'] },
  { id: 'finnair-plus', label: 'Finnair Plus', type: 'air', countries: ['FI'] },
  { id: 'sas-eurobonus', label: 'SAS EuroBonus', type: 'air', countries: ['SE', 'DK', 'NO'] },
  { id: 'turkish-miles-smiles', label: 'Turkish Miles&Smiles', type: 'air', countries: ['TR'] },
  { id: 'ryanair-mybudget', label: 'Ryanair myRyanair', type: 'air', countries: ['EU'] },
  { id: 'easyjet-plus', label: 'easyJet Plus', type: 'air', countries: ['EU'] },
  { id: 'vueling-club', label: 'Vueling Club', type: 'air', countries: ['ES'] },
  { id: 'transavia-flyingblue', label: 'Transavia (Flying Blue)', type: 'air', countries: ['NL', 'FR'] },
  { id: 'wizzair-discount', label: 'Wizz Air Discount Club', type: 'air', countries: ['EU'] },
  { id: 'britishairways-executive', label: 'British Airways Executive', type: 'air', countries: ['GB'] },

  // ===== BUS =====
  { id: 'flixbus-points', label: 'FlixBus / FlixTrain', type: 'bus', countries: ['EU'] },
  { id: 'blablacar-bus', label: 'BlaBlaCar Bus', type: 'bus', countries: ['EU'] },

  // ===== Other =====
  { id: 'other', label: 'Other (custom)', type: 'multi' },
];

/**
 * Get the most likely default reduction percentage for a card.
 */
export function getCardDefaultReduction(providerId: string): number {
  const provider = CARD_PROVIDERS.find(p => p.id === providerId);
  return provider?.defaultReduction || 0;
}

/**
 * Get the label for a provider id.
 */
export function getCardLabel(providerId: string): string {
  return CARD_PROVIDERS.find(p => p.id === providerId)?.label || providerId;
}

/**
 * Group providers by type for UI display.
 */
export function groupProvidersByType() {
  return {
    rail: CARD_PROVIDERS.filter(p => p.type === 'rail'),
    air: CARD_PROVIDERS.filter(p => p.type === 'air'),
    bus: CARD_PROVIDERS.filter(p => p.type === 'bus'),
    other: CARD_PROVIDERS.filter(p => p.type === 'multi'),
  };
}
