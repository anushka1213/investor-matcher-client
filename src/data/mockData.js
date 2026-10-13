export const mockOptions = {
    stages: ['Pre-Seed', 'Seed', 'Series A', 'Series B'],
    sectors: ['Healthcare', 'Logistics', 'B2B', 'Deeptech', 'Education', 'Energy', 'AI-SaaS', 'Sustainability', 'Consumer Tech', 'Sports'],
    geographies: ['Delhi', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana'],
    rounds: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Bridge'],
    leads: ['Lead investor', 'Co-investor / follow-on', 'No preference'],
  };
  
  const c = (key, label, status, detail) => ({ key, label, status, detail });
  
  export const mockMatches = [
    {
      investor: { _id: '1', name: 'Sample Ventures', type: 'VC', email: 'hello@sample.vc',
        ticketText: '$500K - $2M', applyLink: 'https://example.com' },
      score: 100,
      criteria: [
        c('stage', 'Stage', 'match', 'Invests in Seed'),
        c('sector', 'Sector', 'match', 'Healthcare'), 
        c('geography', 'Geography', 'unknown', 'Not in data'),
        c('round', 'Round', 'match', 'Seed'),
        c('lead', 'Lead preference', 'unknown', 'Not in data'),
      ],
    },
    {
      investor: { _id: '2', name: 'Example Capital', type: 'VC', email: 'team@example.vc',
        ticketText: '$1M - $5M' },
      score: 67,
      criteria: [
        c('stage', 'Stage', 'match', 'Invests in Seed'),
        c('sector', 'Sector', 'match', 'Invests in any sector'),
        c('geography', 'Geography', 'unknown', 'Not in data'),
        c('round', 'Round', 'mismatch', 'Prefers Series A'),
        c('lead', 'Lead preference', 'unknown', 'Not in data'),
      ],
    },
    {
      investor: { _id: '3', name: 'Demo Incubator', type: 'Incubator', website: 'https://example.org' },
      score: 33,
      criteria: [
        c('stage', 'Stage', 'unknown', 'Not in data'),
        c('sector', 'Sector', 'mismatch', 'Focus: Agritech'),
        c('geography', 'Geography', 'match', 'Based in Delhi'),
        c('round', 'Round', 'unknown', 'Not in data'),
        c('lead', 'Lead preference', 'unknown', 'Not in data'),
      ],
    },
  ];