import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.$transaction([
    prisma.promotion.deleteMany(),
    prisma.priceHistory.deleteMany(),
    prisma.notificationConfig.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("Database cleaned.");

  console.log("Seeding categories...");
  const categoriesData = [
    { name: 'Eletrônicos', slug: 'eletronicos' },
    { name: 'Moda', slug: 'moda' },
    { name: 'Casa', slug: 'casa' },
    { name: 'Games', slug: 'games' },
    { name: 'Esportes', slug: 'esportes' },
    { name: 'Beleza', slug: 'beleza' },
    { name: 'Livros', slug: 'livros' },
    { name: 'Brinquedos', slug: 'brinquedos' },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categoriesMap[cat.slug] = created.id;
  }

  const catSlugs = categoriesData.map(c => c.slug);

  console.log("Seeding initial products...");
  const initialProducts = [
    {
      name: "iPhone 15 Pro",
      categorySlug: "eletronicos",
      currentPrice: 7500.0,
      description: "Smartphone Apple com Chip A17 Pro",
      imageUrl: "https://m.media-amazon.com/images/I/81+GIkwqLIL._AC_SL1500_.jpg",
    },
    {
      name: "PlayStation 5",
      categorySlug: "games",
      currentPrice: 3500.0,
      description: "Console Sony de última geração",
      imageUrl: "https://m.media-amazon.com/images/I/51051HiS9OL._AC_SL1200_.jpg",
    },
    {
      name: "Camisa Polo Reserva",
      categorySlug: "moda",
      currentPrice: 159.9,
      description: "Camisa polo clássica 100% algodão",
      imageUrl: "https://m.media-amazon.com/images/I/51rY7V9-1rL._AC_UX569_.jpg",
    },
  ];

  for (const p of initialProducts) {
    const { categorySlug, ...productData } = p;
    await prisma.product.create({
      data: {
        ...productData,
        categoryId: categoriesMap[categorySlug],
        promotions: {
          create: {
            discountPercentage: 15,
            description: "Oferta Especial",
          }
        },
        history: {
          create: {
            price: p.currentPrice,
          }
        }
      },
    });
  }

  console.log("Generating 20 more products with promotions...");
  for (let i = 1; i <= 20; i++) {
    const slug = catSlugs[Math.floor(Math.random() * catSlugs.length)];
    const price = Math.floor(Math.random() * 1000) + 50;
    const discount = Math.floor(Math.random() * 40) + 10;
    
    await prisma.product.create({
      data: {
        name: `Produto Exemplo ${i} (${slug})`,
        categoryId: categoriesMap[slug],
        currentPrice: price,
        description: `Descrição detalhada do produto exemplo número ${i}. Excelente custo-benefício.`,
        imageUrl: `https://picsum.photos/seed/prod${i}/400/300`,
        promotions: {
          create: {
            discountPercentage: discount,
            description: `Promoção Incrível de ${discount}%`,
          }
        },
        history: {
          create: {
            price: price * 1.2, // Simulate a previously higher price
          }
        }
      }
    });
  }

  console.log("Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
