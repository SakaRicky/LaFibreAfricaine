// Seed the La Fibre Africaine catalog — fully bilingual (EN/FR).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const collections = [
  {
    slug: "matching-sets",
    nameEn: "Matching Sets", nameFr: "Ensembles assortis",
    descriptionEn: "Coordinated tote-and-sandal pairs, cut from the same cloth in Cameroon.",
    descriptionFr: "Des duos sac et sandales coordonnés, taillés dans la même étoffe au Cameroun.",
    sortOrder: 1,
  },
  {
    slug: "bags",
    nameEn: "Bags", nameFr: "Sacs",
    descriptionEn: "Jute and Ankara totes that carry culture into everyday life.",
    descriptionFr: "Des cabas en jute et en wax qui portent la culture au quotidien.",
    sortOrder: 2,
  },
  {
    slug: "sandals",
    nameEn: "Sandals", nameFr: "Sandales",
    descriptionEn: "Hand-finished sandals in wax print, kente and mudcloth textures.",
    descriptionFr: "Des sandales finies à la main en wax, kente et bogolan.",
    sortOrder: 3,
  },
];

const SIZES = ["36", "37", "38", "39", "40", "41", "42", "43"];

interface SeedProduct {
  slug: string; name: string; collection: string; price: number;
  colorEn: string; colorFr: string; stock: number;
  featured?: boolean; isSet?: boolean; sizes?: boolean; personalizable?: boolean;
  images: string[];
  descriptionEn: string; descriptionFr: string;
  storyEn?: string; storyFr?: string;
  materialsEn: string; materialsFr: string;
}

const products: SeedProduct[] = [
  // ——— Matching Sets ———
  {
    slug: "sahel-sunset-set", name: "Sahel Sunset Set", collection: "matching-sets", price: 8500,
    colorEn: "Pink & Gold", colorFr: "Rose et or", stock: 0, featured: true, isSet: true, sizes: true,
    images: ["sahel-sunset-1.jpg", "sahel-sunset-2.jpg"],
    descriptionEn: "A structured tote and matching sandals in a hand-pieced triangle patchwork of rose, gold and black wax prints.",
    descriptionFr: "Un cabas structuré et ses sandales assorties, en patchwork de triangles cousus main dans des wax rose, or et noir.",
    storyEn: "Each triangle is cut and joined by hand in Cameroon, so no two sets share exactly the same rhythm of pattern.",
    storyFr: "Chaque triangle est coupé et assemblé à la main au Cameroun : aucun ensemble ne partage exactement le même rythme de motifs.",
    materialsEn: "Ankara wax print, reinforced canvas lining, cushioned sole",
    materialsFr: "Wax ankara, doublure en toile renforcée, semelle coussinée",
  },
  {
    slug: "toghu-heritage-set", name: "Toghu Heritage Set", collection: "matching-sets", price: 8900,
    colorEn: "Camel & Toghu", colorFr: "Camel et toghu", stock: 0, featured: true, isSet: true, sizes: true,
    images: ["toghu-heritage-1.jpg", "toghu-heritage-2.jpg"],
    descriptionEn: "Natural jute tote crossed with a band of embroidered toghu — the royal cloth of the Cameroonian Grassfields — with matching sandals.",
    descriptionFr: "Cabas en jute naturel traversé d'une bande de toghu brodé — l'étoffe royale des Grassfields camerounais — avec sandales assorties.",
    storyEn: "Toghu was once reserved for royalty in the Northwest of Cameroon. This set brings that heritage into everyday elegance.",
    storyFr: "Le toghu était autrefois réservé à la royauté du Nord-Ouest du Cameroun. Cet ensemble fait entrer cet héritage dans l'élégance du quotidien.",
    materialsEn: "Natural jute, embroidered toghu velvet band, cushioned sole",
    materialsFr: "Jute naturel, bande de velours toghu brodée, semelle coussinée",
  },
  {
    slug: "savane-applique-set", name: "Savane Appliqué Set", collection: "matching-sets", price: 7900,
    colorEn: "Camel", colorFr: "Camel", stock: 0, isSet: true, sizes: true,
    images: ["savane-1.jpg"],
    descriptionEn: "Warm camel jute tote with a hand-stitched toghu appliqué motif, paired with matching bow sandals.",
    descriptionFr: "Cabas en jute camel orné d'un motif toghu appliqué cousu main, accompagné de sandales à nœud assorties.",
    storyEn: "A quiet, versatile set — the appliqué carries the culture while the neutral jute goes with everything.",
    storyFr: "Un ensemble discret et polyvalent — l'appliqué porte la culture, le jute neutre s'accorde avec tout.",
    materialsEn: "Natural jute, toghu appliqué, cushioned sole",
    materialsFr: "Jute naturel, appliqué toghu, semelle coussinée",
  },
  {
    slug: "emerald-zigzag-set", name: "Emerald Zigzag Set", collection: "matching-sets", price: 8500,
    colorEn: "Green & Gold", colorFr: "Vert et or", stock: 0, featured: true, isSet: true, sizes: true,
    images: ["emerald-zigzag-set-1.jpg", "emerald-zigzag-set-2.jpg"],
    descriptionEn: "Vivid green-and-gold zigzag weave tote with golden jute handles and matching bow sandals.",
    descriptionFr: "Cabas au tissage zigzag vert et or éclatant, anses en jute dorée et sandales à nœud assorties.",
    storyEn: "The zigzag weave echoes woven raffia cloth from the Grassfields, reimagined in the brand's emerald and gold.",
    storyFr: "Le tissage en zigzag évoque les étoffes de raphia des Grassfields, réinventées dans l'émeraude et l'or de la maison.",
    materialsEn: "Woven fabric, jute trim, cushioned sole",
    materialsFr: "Tissu tissé, finitions en jute, semelle coussinée",
  },
  {
    slug: "kilim-flame-set", name: "Kilim Flame Set", collection: "matching-sets", price: 8500,
    colorEn: "Red Multicolour", colorFr: "Rouge multicolore", stock: 0, isSet: true, sizes: true,
    images: ["kilim-flame-1.jpg", "kilim-flame-2.jpg"],
    descriptionEn: "Flame-red chevron tapestry tote with taupe jute back and matching rosette sandals.",
    descriptionFr: "Cabas en tapisserie à chevrons rouge flamme, dos en jute taupe et sandales à rosette assorties.",
    storyEn: "A bold set for women who want their accessories to speak first — fireside reds woven into a graphic chevron.",
    storyFr: "Un ensemble affirmé pour celles dont les accessoires parlent en premier — des rouges de braise tissés en chevrons graphiques.",
    materialsEn: "Woven tapestry, jute, cushioned sole",
    materialsFr: "Tapisserie tissée, jute, semelle coussinée",
  },
  {
    slug: "soleil-bloom-set", name: "Soleil Bloom Set", collection: "matching-sets", price: 8200,
    colorEn: "Yellow & Blue", colorFr: "Jaune et bleu", stock: 0, isSet: true, sizes: true,
    images: ["soleil-bloom-1.jpg"],
    descriptionEn: "Sunshine-yellow handbag with an appliquéd bloom in blue Ankara, and matching bow sandals.",
    descriptionFr: "Sac à main jaune soleil orné d'une fleur appliquée en wax bleu, avec sandales à nœud assorties.",
    storyEn: "Made for celebration days — church, birthdays, family gatherings — when an outfit needs joy.",
    storyFr: "Pensé pour les jours de fête — messe, anniversaires, réunions de famille — quand une tenue réclame de la joie.",
    materialsEn: "Textured fabric, Ankara wax print appliqué, cushioned sole",
    materialsFr: "Tissu texturé, appliqué en wax ankara, semelle coussinée",
  },
  {
    slug: "kente-gold-set", name: "Kente Gold Set", collection: "matching-sets", price: 8500,
    colorEn: "Gold Kente", colorFr: "Kente doré", stock: 0, isSet: true, sizes: true,
    images: ["kente-gold-1.jpg"],
    descriptionEn: "Golden tote panelled with a kente-inspired check in red, green and gold, with natural jute bow sandals.",
    descriptionFr: "Cabas doré au panneau de damier inspiré du kente en rouge, vert et or, avec sandales en jute naturel à nœud.",
    storyEn: "Kente's geometry is a language of pride across West Africa — worn here in gold for everyday royalty.",
    storyFr: "La géométrie du kente est un langage de fierté à travers l'Afrique de l'Ouest — portée ici en or, pour une royauté du quotidien.",
    materialsEn: "Kente-inspired woven fabric, jute, cushioned sole",
    materialsFr: "Tissu tissé inspiré du kente, jute, semelle coussinée",
  },
  {
    slug: "amber-dusk-set", name: "Amber Dusk Set", collection: "matching-sets", price: 7900,
    colorEn: "Burnt Orange", colorFr: "Orange brûlé", stock: 0, isSet: true, sizes: true,
    images: ["amber-dusk-1.jpg"],
    descriptionEn: "Burnt-amber shoulder bag edged in black, with matching double-bow sandals.",
    descriptionFr: "Sac porté épaule ambre brûlé bordé de noir, avec sandales à double nœud assorties.",
    storyEn: "Golden-hour colours in a clean, structured silhouette — elegant from the office to the evening.",
    storyFr: "Les couleurs de l'heure dorée dans une silhouette nette et structurée — élégante du bureau à la soirée.",
    materialsEn: "Textured weave, canvas trim, cushioned sole",
    materialsFr: "Tissage texturé, finitions en toile, semelle coussinée",
  },
  {
    slug: "rose-patchwork-set", name: "Rose Patchwork Set", collection: "matching-sets", price: 8200,
    colorEn: "Rose & Jute", colorFr: "Rose et jute", stock: 0, isSet: true, sizes: true,
    images: ["rose-patchwork-1.jpg"],
    descriptionEn: "Natural jute tote with a rose-and-plum harlequin patchwork panel and matching rosette sandals.",
    descriptionFr: "Cabas en jute naturel au panneau patchwork arlequin rose et prune, avec sandales à rosette assorties.",
    storyEn: "Soft rose wax prints set into raw jute — the meeting point of delicacy and craft.",
    storyFr: "Des wax rose tendre sertis dans le jute brut — le point de rencontre de la délicatesse et de l'artisanat.",
    materialsEn: "Natural jute, Ankara patchwork, cushioned sole",
    materialsFr: "Jute naturel, patchwork de wax, semelle coussinée",
  },
  {
    slug: "motherland-set", name: "Motherland Set", collection: "matching-sets", price: 8800,
    colorEn: "Brown & Red", colorFr: "Brun et rouge", stock: 0, featured: true, isSet: true, sizes: true,
    images: ["motherland-set-1.jpg"],
    descriptionEn: "Brown woven tote with the African continent worked in reds and pinks, edged in patterned trim, with matching sandals.",
    descriptionFr: "Cabas tissé brun où le continent africain se dessine en rouges et roses, bordé d'un galon à motifs, avec sandales assorties.",
    storyEn: "Wear the continent itself — a statement of belonging stitched by hand in Cameroon.",
    storyFr: "Portez le continent lui-même — une déclaration d'appartenance cousue à la main au Cameroun.",
    materialsEn: "Woven fabric, embroidered appliqué, cushioned sole",
    materialsFr: "Tissu tissé, appliqué brodé, semelle coussinée",
  },
  {
    slug: "noir-rose-set", name: "Noir Rose Set", collection: "matching-sets", price: 8200,
    colorEn: "Black & Rose", colorFr: "Noir et rose", stock: 0, isSet: true, sizes: true,
    images: ["noir-rose-1.jpg"],
    descriptionEn: "Black denim tote with rose and leopard patchwork appliqué and matching black sandals.",
    descriptionFr: "Cabas en denim noir à appliqué patchwork rose et léopard, avec sandales noires assorties.",
    storyEn: "The most urban set of the collection — dark, modern, with a flash of print.",
    storyFr: "L'ensemble le plus urbain de la collection — sombre, moderne, avec un éclat d'imprimé.",
    materialsEn: "Denim, Ankara patchwork, cushioned sole",
    materialsFr: "Denim, patchwork de wax, semelle coussinée",
  },
  {
    slug: "nuit-rose-set", name: "Nuit Rosée Set", collection: "matching-sets", price: 8200,
    colorEn: "Black & Rose", colorFr: "Noir et rose", stock: 0, isSet: true, sizes: true,
    images: ["nuit-rose-1.jpg"],
    descriptionEn: "Black tote with a full harlequin front of rose, plum and cream prints, with matching pink-trimmed sandals.",
    descriptionFr: "Cabas noir à la façade arlequin rose, prune et crème, avec sandales bordées de rose assorties.",
    storyEn: "Evening colours, everyday practicality — a set that moves from day to night.",
    storyFr: "Des couleurs du soir, une praticité de tous les jours — un ensemble qui passe du jour à la nuit.",
    materialsEn: "Canvas, Ankara patchwork, cushioned sole",
    materialsFr: "Toile, patchwork de wax, semelle coussinée",
  },
  {
    slug: "lagoon-set", name: "Lagoon Set", collection: "matching-sets", price: 8400,
    colorEn: "Teal & Green", colorFr: "Sarcelle et vert", stock: 0, isSet: true, sizes: true,
    images: ["lagoon-1.jpg"],
    descriptionEn: "Coral-motif Ankara tote in lagoon blues and greens with black leather-look handles, paired with white slide sandals.",
    descriptionFr: "Cabas en wax aux motifs coralliens, bleus et verts lagon, anses façon cuir noir, accompagné de mules blanches.",
    storyEn: "A fresh, modern pairing — organic wax-print shapes with a clean white slide.",
    storyFr: "Un duo frais et moderne — les formes organiques du wax rencontrent une mule blanche épurée.",
    materialsEn: "Ankara wax print, faux-leather handles, slide sole",
    materialsFr: "Wax ankara, anses en simili-cuir, semelle de mule",
  },
  {
    slug: "coral-flame-set", name: "Coral Flame Set", collection: "matching-sets", price: 8000,
    colorEn: "Red", colorFr: "Rouge", stock: 0, isSet: true, sizes: true,
    images: ["coral-flame-1.jpg"],
    descriptionEn: "Vivid red textured tote with black handles and matching red sandals with black flower rosettes.",
    descriptionFr: "Cabas texturé rouge vif aux anses noires, avec sandales rouges assorties ornées de fleurs noires.",
    storyEn: "One colour, worn boldly. The red set photographed on the coast — made for holidays and celebrations.",
    storyFr: "Une seule couleur, portée avec audace. L'ensemble rouge photographié sur la côte — fait pour les vacances et les célébrations.",
    materialsEn: "Textured weave, canvas, cushioned sole",
    materialsFr: "Tissage texturé, toile, semelle coussinée",
  },

  // ——— Bags ———
  {
    slug: "reine-dafrique-tote", name: "Reine d'Afrique Tote", collection: "bags", price: 6500,
    colorEn: "Taupe", colorFr: "Taupe", stock: 0, featured: true,
    images: ["reine-tote-1.jpg"],
    descriptionEn: "Statement tote with a portrait of an African queen in a flame headwrap, framed by mudcloth-print gussets.",
    descriptionFr: "Cabas signature au portrait d'une reine africaine coiffée d'un foulard flamboyant, encadré de soufflets imprimés bogolan.",
    storyEn: "She looks out from the bag the way the brand looks out at the world — rooted, confident, elegant.",
    storyFr: "Elle regarde depuis le sac comme la maison regarde le monde — enracinée, confiante, élégante.",
    materialsEn: "Jute-blend canvas, printed portrait panel, mudcloth-print trim",
    materialsFr: "Toile mêlée de jute, panneau portrait imprimé, finitions imprimé bogolan",
  },
  {
    slug: "motherland-denim-tote", name: "Motherland Denim Tote", collection: "bags", price: 5900,
    colorEn: "Grey & Orange", colorFr: "Gris et orange", stock: 0,
    images: ["motherland-denim-1.jpg"],
    descriptionEn: "Grey denim book-tote with the African continent appliquéd in orange and navy Ankara, print-wrapped handles and gussets.",
    descriptionFr: "Cabas en denim gris à l'appliqué du continent africain en wax orange et marine, anses et soufflets gainés d'imprimé.",
    storyEn: "A modern classic silhouette carrying the oldest map there is.",
    storyFr: "Une silhouette classique et moderne qui porte la plus ancienne des cartes.",
    materialsEn: "Denim, Ankara wax print appliqué and trim",
    materialsFr: "Denim, appliqué et finitions en wax ankara",
  },

  // ——— Sandals ———
  {
    slug: "azure-bow-sandals", name: "Azure Bow Sandals", collection: "sandals", price: 3200,
    colorEn: "Blue", colorFr: "Bleu", stock: 0, sizes: true,
    images: ["azure-bow-1.jpg"],
    descriptionEn: "Deep blue snake-and-dot print sandals crowned with a marigold bow.",
    descriptionFr: "Sandales à l'imprimé serpent et pois bleu profond, couronnées d'un nœud souci.",
    materialsEn: "Ankara wax print, cushioned sole, fabric bow",
    materialsFr: "Wax ankara, semelle coussinée, nœud en tissu",
  },
  {
    slug: "natural-jute-bow-sandals", name: "Natural Jute Bow Sandals", collection: "sandals", price: 2800,
    colorEn: "Natural", colorFr: "Naturel", stock: 0, sizes: true,
    images: ["jute-nature-1.jpg"],
    descriptionEn: "Raw jute sandals with a mixed-print bow — the neutral pair that matches every jute tote.",
    descriptionFr: "Sandales en jute brut au nœud d'imprimés mêlés — la paire neutre qui accompagne tous les cabas en jute.",
    materialsEn: "Natural jute, Ankara bow, cushioned sole",
    materialsFr: "Jute naturel, nœud en wax, semelle coussinée",
  },
  {
    slug: "golden-noir-sandals", name: "Golden Noir Sandals", collection: "sandals", price: 3000,
    colorEn: "Gold & Black", colorFr: "Or et noir", stock: 0, sizes: true,
    images: ["golden-noir-1.jpg"],
    descriptionEn: "Honey-gold woven sandals with a structured black bow.",
    descriptionFr: "Sandales tissées or miel au nœud noir structuré.",
    materialsEn: "Woven fabric, canvas bow, cushioned sole",
    materialsFr: "Tissu tissé, nœud en toile, semelle coussinée",
  },
  {
    slug: "kente-cowrie-sandals", name: "Kente Cowrie Sandals", collection: "sandals", price: 3400,
    colorEn: "Gold Kente", colorFr: "Kente doré", stock: 0, featured: true, sizes: true,
    images: ["kente-cowrie-1.jpg"],
    descriptionEn: "Kente-inspired print sandals finished with a black rosette and a real cowrie shell.",
    descriptionFr: "Sandales à l'imprimé inspiré du kente, finies d'une rosette noire et d'un véritable cauri.",
    storyEn: "The cowrie was once currency across Africa — worn here as a small crown on each sandal.",
    storyFr: "Le cauri fut jadis monnaie à travers l'Afrique — porté ici comme une petite couronne sur chaque sandale.",
    materialsEn: "Kente-inspired print, cowrie shell, cushioned sole",
    materialsFr: "Imprimé inspiré du kente, cauri, semelle coussinée",
  },
  {
    slug: "indigo-cowrie-sandals", name: "Indigo Cowrie Sandals", collection: "sandals", price: 3400,
    colorEn: "Indigo", colorFr: "Indigo", stock: 0, sizes: true,
    images: ["indigo-cowrie-1.jpg"],
    descriptionEn: "Indigo mudcloth-print sandals with matching rosette and cowrie shell centre.",
    descriptionFr: "Sandales à l'imprimé bogolan indigo, rosette assortie et cauri en leur centre.",
    materialsEn: "Mudcloth-inspired print, cowrie shell, cushioned sole",
    materialsFr: "Imprimé inspiré du bogolan, cauri, semelle coussinée",
  },
  {
    slug: "emerald-zigzag-sandals", name: "Emerald Zigzag Sandals", collection: "sandals", price: 3000,
    colorEn: "Green & Gold", colorFr: "Vert et or", stock: 0, sizes: true,
    images: ["emerald-zigzag-sandals-1.jpg"],
    descriptionEn: "Green-and-gold zigzag weave sandals with a double jute-and-print bow.",
    descriptionFr: "Sandales au tissage zigzag vert et or, double nœud de jute et d'imprimé.",
    materialsEn: "Woven fabric, jute bow, cushioned sole",
    materialsFr: "Tissu tissé, nœud en jute, semelle coussinée",
  },
  {
    slug: "ruby-cowrie-sandals", name: "Ruby Cowrie Sandals", collection: "sandals", price: 3200,
    colorEn: "Red", colorFr: "Rouge", stock: 0, sizes: true,
    images: ["ruby-cowrie-1.jpg"],
    descriptionEn: "Flame-red melange sandals with black rosette and cowrie shell.",
    descriptionFr: "Sandales chinées rouge flamme, rosette noire et cauri.",
    materialsEn: "Textured weave, cowrie shell, cushioned sole",
    materialsFr: "Tissage texturé, cauri, semelle coussinée",
  },
  {
    slug: "mustard-azure-sandals", name: "Mustard Azure Sandals", collection: "sandals", price: 3200,
    colorEn: "Mustard & Blue", colorFr: "Moutarde et bleu", stock: 0, sizes: true,
    images: ["mustard-azure-1.jpg"],
    descriptionEn: "Mustard linen-weave sandals with blue Ankara straps and a two-tone bow.",
    descriptionFr: "Sandales en toile de lin moutarde, brides en wax bleu et nœud bicolore.",
    materialsEn: "Linen-weave fabric, Ankara straps, cushioned sole",
    materialsFr: "Toile de lin, brides en wax, semelle coussinée",
  },
  {
    slug: "fuchsia-ikat-sandals", name: "Fuchsia Ikat Sandals", collection: "sandals", price: 3300,
    colorEn: "Fuchsia", colorFr: "Fuchsia", stock: 0, sizes: true,
    images: ["fuchsia-ikat-1.jpg"],
    descriptionEn: "Vivid fuchsia ikat-print sandals with layered taupe double bows.",
    descriptionFr: "Sandales à l'imprimé ikat fuchsia vif, doubles nœuds taupe superposés.",
    materialsEn: "Ikat-inspired print, cushioned sole",
    materialsFr: "Imprimé inspiré de l'ikat, semelle coussinée",
  },
];

async function main() {
  const collectionIds: Record<string, number> = {};
  for (const c of collections) {
    const row = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    collectionIds[c.slug] = row.id;
  }

  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        collectionId: collectionIds[p.collection],
        priceCents: p.price,
        descriptionEn: p.descriptionEn, descriptionFr: p.descriptionFr,
        storyEn: p.storyEn ?? "", storyFr: p.storyFr ?? "",
        materialsEn: p.materialsEn, materialsFr: p.materialsFr,
        colorEn: p.colorEn, colorFr: p.colorFr,
        stock: p.stock,
        featured: p.featured ?? false,
        isSet: p.isSet ?? false,
        personalizable: p.personalizable ?? false,
        images: {
          create: p.images.map((file, i) => ({
            url: `/media/products/${file}`,
            alt: `${p.name} — photo ${i + 1}`,
            sortOrder: i,
          })),
        },
        sizes: p.sizes
          ? { create: SIZES.map((size) => ({ size, stock: Math.max(1, Math.round(p.stock / 2)) })) }
          : undefined,
      },
    });
    void product;
  }

  await prisma.adminUser.upsert({
    where: { email: "sakaricky91@gmail.com" },
    update: {},
    create: {
      email: "sakaricky91@gmail.com",
      name: "Ricky",
      passwordHash: await bcrypt.hash("LaFibre-2026!", 10),
    },
  });

  const settings: Record<string, string> = {
    alert_email: "sakaricky91@gmail.com",
    whatsapp_number: "12638807371",
    pickup_note_fr: "Ramassage \u00e0 Montr\u00e9al (Lachine) \u2014 d\u00e9tails convenus sur WhatsApp",
    pickup_note_en: "Pickup in Montreal (Lachine) \u2014 details arranged on WhatsApp",
    thankyou_code: "MERCI10",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const count = await prisma.product.count();
  console.log(`Seeded ${count} products in ${collections.length} collections.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
