import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId || "",
        clientEmail,
        privateKey,
      }),
    });
  } else {
    admin.initializeApp({ projectId: projectId || "" });
  }
}

const db = admin.firestore();

interface CityData {
  name: string;
  estado: string;
}

interface NeighborhoodData {
  name: string;
  cityId: string;
}

const CITIES: CityData[] = [
  { name: "Venâncio Aires", estado: "RS" },
  { name: "Santa Cruz do Sul", estado: "RS" },
  { name: "Lajeado", estado: "RS" },
];

const NEIGHBORHOODS: Record<string, string[]> = {
  "Venâncio Aires": [
    "Aviação", "Battisti", "Bela Vista", "Bem Feita", "Brands", "Brígida",
    "Canto do Cedro", "Centro", "Cidade Alta", "Cidade Nova", "Coronel Brito",
    "Cruzeiro", "Diettrich", "Grão-Pará", "Gressler", "Industrial", "Leopoldina",
    "Macedo", "Morsch", "Santa Tecla", "São Francisco Xavier", "São José",
    "Travessa", "União", "Universitário", "Xangrilá",
  ],
  "Santa Cruz do Sul": [
    "A Grande", "Aliança", "Alto Paredão", "Ana Nery", "Arroio Grande",
    "Arroio do Couto", "Avenida", "Belvedere", "Bom Jesus", "Bonfim",
    "Castelo Branco", "Centro", "Country", "Distrito Industrial", "Dona Carlota",
    "Esmeralda", "Faxinal Menino Deus", "Germânia", "Goiás", "Higienópolis",
    "Independência", "Jardim Europa", "Linha Santa Cruz", "Margarida",
    "Monte Verde", "Pedreira", "Progresso", "Rauber", "Renascença",
    "Santo Antônio", "Santo Inácio", "Schulz", "Senai", "Universitário",
    "Vale do Nazaré", "Várzea", "Verena",
  ],
  "Lajeado": [
    "Alto do Parque", "Americano", "Bom Pastor", "Campestre", "Carneiros",
    "Centenário", "Centro", "Conservas", "Conventos", "Floresta", "Florestal",
    "Hidráulica", "Igrejinha", "Imigrante", "Jardim Botânico", "Jardim do Cedro",
    "Moinhos", "Moinhos d'Água", "Montanha", "Morro 25", "Nações", "Olarias",
    "Planalto", "Santo André", "Santo Antônio", "São Bento", "São Cristóvão",
    "Universitário",
  ],
};

async function seed() {
  console.log("🌱 Iniciando seed de cidades e bairros...\n");

  for (const cityData of CITIES) {
    // Busca se a cidade já existe (pelo nome + estado)
    const existingCities = await db
      .collection("cities")
      .where("name", "==", cityData.name)
      .where("estado", "==", cityData.estado)
      .limit(1)
      .get();

    let cityId: string;

    if (existingCities.empty) {
      // Cria a cidade
      const cityRef = await db.collection("cities").add({
        name: cityData.name,
        estado: cityData.estado,
        createdAt: new Date(),
      });
      cityId = cityRef.id;
      console.log(`✅ Cidade criada: ${cityData.name} (${cityData.estado}) — ID: ${cityId}`);
    } else {
      cityId = existingCities.docs[0].id;
      console.log(`⏭️  Cidade já existe: ${cityData.name} (${cityData.estado}) — ID: ${cityId}`);
    }

    // Adiciona os bairros
    const neighborhoods = NEIGHBORHOODS[cityData.name] || [];
    let added = 0;
    let skipped = 0;

    for (const nbName of neighborhoods) {
      // Verifica se o bairro já existe para esta cidade
      const existingNb = await db
        .collection("neighborhoods")
        .where("name", "==", nbName)
        .where("cityId", "==", cityId)
        .limit(1)
        .get();

      if (existingNb.empty) {
        await db.collection("neighborhoods").add({
          name: nbName,
          cityId: cityId,
          createdAt: new Date(),
        });
        added++;
      } else {
        skipped++;
      }
    }

    console.log(`   Bairros: ${added} adicionados, ${skipped} já existentes`);
    console.log("");
  }

  console.log("🎉 Seed concluído!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erro durante o seed:", err);
  process.exit(1);
});
