// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Realistic Mock Review Generator
// Generates deterministic product reviews per product
// ═══════════════════════════════════════════════════════

function simpleSeed(str) {
  let h = 0xdeadbeef;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
  return ((h ^ h >>> 16) >>> 0);
}

function createRandom(seed) {
  return function() {
    seed |= 0; seed = seed + 0x9e3779b9 | 0;
    let t = seed ^ seed >>> 16; t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15; t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}

const FIRST_NAMES = ["Chris", "Alex", "Jordan", "Mike", "Sarah", "Emily", "David", "James", "Dan", "Matt", "Leo", "Jason", "Brian", "Tom", "Jess", "Ryan", "Kevin", "Will"];
const LAST_INITIALS = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "J.", "K.", "L.", "M.", "N.", "P.", "R.", "S.", "T.", "W."];

const REVIEW_DATA = {
  eq: {
    titles: ["Surgical precision", "Best EQ I've bought", "Incredible workflow", "Game changer for my mixes", "Crystal clear"],
    texts: [
      "The precision on this EQ is unmatched. I've been using FabFilter for years, but the workflow here is just significantly faster for me. High-pass filters sweep incredibly smoothly with absolutely zero phase artifacting.",
      "Replaced my stock DAW EQ immediately. The low-end definition is crazy and it barely uses any CPU even with 30+ instances across my session. A total steal for the price.",
      "Got this on the crypto discount. Excellent UI, no weird resonances when pushing the high shelf. Makes mastering a breeze.",
      "Very transparent sound. I love how you can isolate bands so easily. It's surgical when it needs to be, but can also do broad musical strokes."
    ]
  },
  compressor: {
    titles: ["Punches hard", "Glue for days", "Warm and fat", "Perfect drum bus comp", "Incredible UI"],
    texts: [
      "I threw this on my drum bus and it instantly glued everything together. The auto-release is magical, sounds like an authentic hardware SSL unit to my ears.",
      "Amazing saturation characteristics when you drive the input. It doesn't pump unnaturally unless you really force it to. The mix knob is a godsend for parallel compression.",
      "Bought this using USDT, instant delivery. The plugin itself is fantastic — controls the dynamics perfectly without squashing the life out of the vocal.",
      "The metering is super responsive. Very easy to dial in exactly 3dB of gain reduction. My new go-to vocal compressor."
    ]
  },
  reverb: {
    titles: ["Lush tails", "Massive spaces", "Fits perfectly in the mix", "No metallic ringing", "My new favorite hall"],
    texts: [
      "Most algorithmic reverbs have a metallic ring to them, but this one is incredibly smooth. The decay decays naturally into the noise floor. Beautiful on vocals and acoustic guitars.",
      "The modulation on the tail makes it sound huge. CPU usage is impressively low for how dense the reverb algorithm is.",
      "Fantastic plugin. The built-in EQ on the verb saves me from having to route it to a separate bus just to clean up the mud. Worth every penny.",
      "I use the room presets on drums to give them some life, and it just works. Sounds like a $500 plugin."
    ]
  },
  synth: {
    titles: ["Massive sound", "Analog warmth", "Great presets", "A beast of a synth", "So inspiring"],
    texts: [
      "The oscillators sound incredibly thick. I was skeptical but the analog modeling here is top tier. The bass patches literally rattle my monitors.",
      "Comes with a ton of highly usable presets. The modulation matrix takes a bit to figure out, but once you do, the sound design possibilities are endless.",
      "I have Serum and Massive, but I keep reaching for this because the filters just sound so much creamier. 10/10.",
      "Paid with ETH, got my license instantly. The UI scales beautifully on my 4K monitor. The included pads are cinematic quality."
    ]
  },
  mastering: {
    titles: ["Loud and proud", "Transparent limiting", "The final polish", "Essential for DIY mastering", "Incredible value"],
    texts: [
      "This limiter can be pushed ridiculously hard before it starts distorting. Keeps the transients punchy while bringing the LUFS right where I need them for Spotify.",
      "A complete all-in-one mastering solution. The multiband saturation module adds exactly the right amount of harmonic excitement to the top end.",
      "I was paying an engineer $100 a track, now I just use this chain and honestly the results are 95% there. The true peak limiting is flawless.",
      "Amazing visual feedback. You can literally see exactly what it's doing to your dynamics. Highly recommended."
    ]
  },
  generic: {
    titles: ["Works flawlessly", "Great value", "Solid plugin", "Must have in the toolkit", "Impressed"],
    texts: [
      "Does exactly what it says on the tin. Low CPU, great UI, no crashes in Ableton 11. What more could you ask for?",
      "For this price, it's an absolute no-brainer. I've bought plugins three times the price that don't sound half as good.",
      "Delivery was instant. Installed without a hitch. The sound quality is definitely professional grade.",
      "I was on the fence but I'm glad I pulled the trigger. Customer support was also surprisingly fast when I had a license question."
    ]
  }
};

export function generateDeterministicReviews(productId, category) {
  const seed = simpleSeed(productId);
  const rand = createRandom(seed);
  
  // Decide how many reviews: between 8 and 35
  const numReviews = Math.floor(rand() * 28) + 8;
  const reviews = [];
  
  const poolCat = REVIEW_DATA[category] ? category : 'generic';
  
  // Weights for ratings (mostly 5s, some 4s, rare 3s)
  const ratingWeights = [
    { stars: 5, weight: 75 },
    { stars: 4, weight: 20 },
    { stars: 3, weight: 5 }
  ];

  for (let i = 0; i < numReviews; i++) {
    // Pick rating
    let rVal = rand() * 100;
    let stars = 5;
    let cum = 0;
    for (let rw of ratingWeights) {
      cum += rw.weight;
      if (rVal <= cum) { stars = rw.stars; break; }
    }

    // Pick name
    const fName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const lInit = LAST_INITIALS[Math.floor(rand() * LAST_INITIALS.length)];
    
    // Pick content
    const titlePool = REVIEW_DATA[poolCat].titles.concat(REVIEW_DATA.generic.titles);
    const textPool = REVIEW_DATA[poolCat].texts.concat(REVIEW_DATA.generic.texts);
    const title = titlePool[Math.floor(rand() * titlePool.length)];
    const text = textPool[Math.floor(rand() * textPool.length)];

    // Pick date (between 0 and 365 days ago)
    const daysAgo = Math.floor(rand() * 365);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - daysAgo);

    reviews.push({
      id: `rev_${productId}_${i}`,
      author: `${fName} ${lInit}`,
      initials: `${fName.charAt(0)}${lInit.charAt(0)}`,
      date: dateObj.toISOString(),
      stars,
      title,
      text,
      verified: rand() > 0.1, // 90% verified
      helpful: Math.floor(rand() * 45), // 0 to 45 helpful votes
      isUser: false
    });
  }
  
  // Sort by date descending
  reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  return reviews;
}

export function getUserReviews(productId) {
  try {
    const data = localStorage.getItem(`pm_user_reviews_${productId}`);
    return data ? JSON.parse(data) : [];
  } catch(e) {
    return [];
  }
}

export function saveUserReview(productId, reviewObj) {
  const existing = getUserReviews(productId);
  existing.unshift({
    ...reviewObj,
    id: `usr_${Date.now()}`,
    date: new Date().toISOString(),
    helpful: 0,
    isUser: true,
    verified: true // Because they just "bought" or are acting as a buyer
  });
  localStorage.setItem(`pm_user_reviews_${productId}`, JSON.stringify(existing));
}

export function getProductReviews(productId, category) {
  const generated = generateDeterministicReviews(productId, category);
  const userReviews = getUserReviews(productId);
  // User reviews go at the top
  return [...userReviews, ...generated];
}

export function formatReviewDate(isoString) {
  const d = new Date(isoString);
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 14) return `${diffDays} days ago`;
  
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
