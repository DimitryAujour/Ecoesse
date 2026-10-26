import { Product, GlobalImpact } from '@/types/commerce';

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'eco-sisal-dish-brush',
    title: 'Zero-Waste Sisal Dish Brush',
    titleFr: 'Brosse à vaisselle en sisal zéro déchet',
    slug: 'sisal-dish-brush',
    description: `Crafted from sustainable beechwood and tough natural sisal agave plant fibers. Replaces plastic sponges entirely. 100% compostable and ergonomically shaped with a replaceable head mechanism.

### Key Highlights:
- **Material:** FSC-certified Beechwood & Natural Sisal Fiber bristles
- **Zero Microplastics:** Safe for cast iron, stainless steel, and ceramic cookware
- **Lifespan:** 4-6 months with proper drying; fully biodegradable at end-of-life`,
    descriptionFr: `Fabriqué en bois de hêtre durable et en fibres naturelles de sisal d'agave résistant. Remplace entièrement les éponges en plastique. 100 % compostable et de forme ergonomique, avec un mécanisme de tête remplaçable.

### Points clés :
- **Matériau :** Bois de hêtre certifié FSC et poils en fibre naturelle de sisal
- **Zéro microplastique :** Sans danger pour la fonte, l'acier inoxydable et la céramique
- **Durée de vie :** 4 à 6 mois avec un séchage adéquat; entièrement biodégradable en fin de vie`,
    category: 'household',
    price: 1499, // $14.99 CAD
    compareAtPrice: 1899,
    sku: 'ECO-HH-001',
    inventoryCount: 85,
    images: [
      'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80'
    ],
    sustainabilityMetrics: {
      treesPlanted: 1,
      plasticBottlesSaved: 12,
      carbonOffsetKg: 2.5,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eco-bamboo-pet-bowl',
    title: 'Natural Bamboo Fiber Pet Bowl',
    titleFr: 'Bol pour animaux en fibre de bambou naturelle',
    slug: 'bamboo-pet-bowl',
    description: `Non-toxic, ultra-durable pet feeding bowl made from renewable bamboo fiber and rice husks. Designed with non-slip silicone feet to protect your floors while keeping plastics out of our oceans and pets' food.

### Key Highlights:
- **Food Safe:** Free from BPA, phthalates, and synthetic chemical coatings
- **Easy Clean:** Dishwasher safe (top rack) and stain resistant
- **Planet Positive:** Made from agricultural harvest byproducts`,
    descriptionFr: `Bol d'alimentation pour animaux non toxique et ultra-durable, fabriqué à partir de fibre de bambou renouvelable et de balles de riz. Conçu avec des pieds antidérapants en silicone pour protéger vos planchers tout en gardant les plastiques hors des océans et de la nourriture de vos animaux.

### Points clés :
- **Salubre :** Sans BPA, sans phtalates et sans revêtements chimiques synthétiques
- **Facile à nettoyer :** Va au lave-vaisselle (panier supérieur) et résiste aux taches
- **Positif pour la planète :** Fabriqué à partir de sous-produits de récolte agricole`,
    category: 'pet-care',
    price: 2499, // $24.99 CAD
    compareAtPrice: 2999,
    sku: 'ECO-PET-002',
    inventoryCount: 42,
    images: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=800&q=80'
    ],
    sustainabilityMetrics: {
      treesPlanted: 2,
      plasticBottlesSaved: 28,
      carbonOffsetKg: 5.0,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eco-glass-spray-bottle',
    title: 'Refillable Amber Glass Spray Bottle (500ml)',
    titleFr: 'Bouteille vaporisatrice en verre ambré rechargeable (500 ml)',
    slug: 'refillable-glass-spray-bottle',
    description: `Eliminate single-use plastic cleaning bottles permanently with heavy-duty laboratory-grade amber glass. Protects light-sensitive essential oil and vinegar cleaning solutions with multi-pattern adjustable mist and stream sprayer.

### Key Highlights:
- **UV Protection:** Amber glass shields active botanical ingredients
- **Commercial Grade Sprayer:** Rated for 10,000+ continuous triggers
- **Silicone Boot:** Shock-absorbing base prevents slips and clinking on counters`,
    descriptionFr: `Éliminez définitivement les bouteilles de nettoyage en plastique à usage unique grâce à du verre ambré robuste de qualité laboratoire. Protège les solutions de nettoyage sensibles à la lumière à base d'huiles essentielles et de vinaigre, avec un vaporisateur réglable à jet et à brume.

### Points clés :
- **Protection UV :** Le verre ambré protège les ingrédients botaniques actifs
- **Vaporisateur de qualité commerciale :** Conçu pour plus de 10 000 déclenchements continus
- **Base en silicone :** Base amortissante qui prévient les glissements et les cliquetis sur les comptoirs`,
    category: 'household',
    price: 1850, // $18.50 CAD
    compareAtPrice: 2200,
    sku: 'ECO-HH-003',
    inventoryCount: 110,
    images: [
      'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608248597359-59807530bebb?auto=format&fit=crop&w=800&q=80'
    ],
    sustainabilityMetrics: {
      treesPlanted: 1,
      plasticBottlesSaved: 36,
      carbonOffsetKg: 3.2,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eco-biodegradable-sponge-cloths',
    title: 'Swedish Biodegradable Sponge Cloths (4-Pack)',
    titleFr: 'Chiffons éponges suédois biodégradables (paquet de 4)',
    slug: 'biodegradable-sponge-cloths',
    description: `Absorbs 20x its weight in liquid! One Swedish sponge cloth replaces up to 17 rolls of paper towels. Made from 70% FSC cellulose and 30% unbleached cotton, printed with natural water-based inks.

### Key Highlights:
- **Zero Waste:** Machine washable and boilable up to 200 times
- **Quick Drying:** Naturally resists odors and mildew unlike synthetic sponges
- **100% Backyard Compostable:** Breaks down in 6-8 weeks in standard soil`,
    descriptionFr: `Absorbe 20 fois son poids en liquide ! Un chiffon éponge suédois remplace jusqu'à 17 rouleaux d'essuie-tout. Fabriqué à partir de 70 % de cellulose certifiée FSC et de 30 % de coton non blanchi, imprimé avec des encres naturelles à base d'eau.

### Points clés :
- **Zéro déchet :** Lavable à la machine et bouillable jusqu'à 200 fois
- **Séchage rapide :** Résiste naturellement aux odeurs et à la moisissure, contrairement aux éponges synthétiques
- **100 % compostable à domicile :** Se décompose en 6 à 8 semaines dans un sol ordinaire`,
    category: 'personal-care',
    price: 1699, // $16.99 CAD
    compareAtPrice: 2199,
    sku: 'ECO-PC-004',
    inventoryCount: 60,
    images: [
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=800&q=80'
    ],
    sustainabilityMetrics: {
      treesPlanted: 1,
      plasticBottlesSaved: 18,
      carbonOffsetKg: 1.8,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_GLOBAL_IMPACT: GlobalImpact = {
  totalTreesPlanted: 1420,
  totalPlasticBottlesRemoved: 18450,
  totalCarbonOffsetKg: 3680,
  totalOrdersCount: 685,
  lastUpdated: new Date().toISOString(),
};
