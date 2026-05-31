const ruleSections = [
  {
    title: 'Eligibility',
    icon: 'public',
    rules: [
      'There is no region lock on the IDL. A player from any country can play.',
    ],
  },
  {
    title: 'Draft Format',
    icon: 'casino',
    rules: [
      'The group stage is all Bo2, captains mode.',
      'In a Bo2, there is a coin flip for game 1. The loser of the flip picks side or pick order for game 2.',
      'A Bo3 or Bo5 goes coin flip, loser picks, coin flip, loser picks, coin flip, and so on for each game.',
    ],
  },
  {
    title: 'Tie Breakers',
    icon: 'balance',
    rules: [
      'Tie breakers use the head to head rule first.',
      'From there it goes into either a Bo1 decider match or a coin flip, depending on time and schedule.',
    ],
  },
  {
    title: 'Standins',
    icon: 'group_add',
    rules: [
      'A standin can only be up to 500 mmr above the player they are replacing.',
      'Any mmr below the player they are replacing is fine.',
      'If the standin is 500 mmr above the player they are replacing, you need to check with the enemy captain that this is ok.',
      'The enemy captain has the right to veto this if they choose to.',
    ],
  },
  {
    title: 'Punctuality',
    icon: 'schedule',
    rules: [
      'Teams must field 5 players on time to games. Lateness penalties apply as follows.',
      '20 minutes late: draft penalty 1.',
      '30 minutes late: draft penalty 2.',
      '40 minutes late: forfeit game 1.',
      '60 minutes late: forfeit the series.',
    ],
  },
  {
    title: 'Conduct',
    icon: 'sports_esports',
    rules: [
      'No fake gg calls and then cancelling them. It is fine if it happens by accident.',
      'Trash talk is fine within reason. No racism or sexism.',
      'Don\'t be a gimp.',
    ],
  },
  {
    title: 'Admins',
    icon: 'gavel',
    rules: [
      'Admins reserve the right to make any decision on the above, and their decision is final.',
    ],
  },
];

// Continuous numbering across every section: each section's starting number
// is the total count of rules in all preceding sections.
const sectionsWithOffsets = ruleSections.map((section, index) => ({
  ...section,
  startNumber: ruleSections
    .slice(0, index)
    .reduce((sum, s) => sum + s.rules.length, 0),
}));

const Rules = () => {
  return (
    <main className="flex-1">
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-white text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em] mb-4 text-center">
            LEAGUE RULES
          </h1>
          <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">
            The rules for the Irish Dota League. If anything is unclear, ask an admin in Discord.
          </p>

          <div className="space-y-8">
            {sectionsWithOffsets.map((section) => (
              <div
                key={section.title}
                className="bg-gradient-to-br from-primary/10 to-zinc-900 border border-primary/50 rounded-lg p-6 md:p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl">{section.icon}</span>
                  </div>
                  <h2 className="text-white text-2xl font-bold">{section.title}</h2>
                </div>
                <ol className="space-y-4">
                  {section.rules.map((rule, i) => {
                    const number = section.startNumber + i + 1;
                    return (
                      <li key={number} className="flex gap-4">
                        <span className="shrink-0 w-12 flex justify-center">
                          <span className="w-8 h-8 rounded-full bg-primary text-black font-bold text-sm flex items-center justify-center">
                            {number}
                          </span>
                        </span>
                        <span className="text-white/80 leading-relaxed pt-1">{rule}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Rules;
