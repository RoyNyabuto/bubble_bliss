import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Bubble Bliss Owner",
        email: "owner@bubblebliss.co.ke",
        phone: "0700000001",
        passwordHash,
        role: "ADMIN"
      },
      {
        name: "Demo Driver",
        email: "driver@bubblebliss.co.ke",
        phone: "0700000002",
        passwordHash,
        role: "DRIVER"
      },
      {
        name: "Demo Employee",
        email: "employee@bubblebliss.co.ke",
        phone: "0700000003",
        passwordHash,
        role: "EMPLOYEE"
      },
      {
        name: "Demo Customer",
        email: "customer@bubblebliss.co.ke",
        phone: "0700000004",
        passwordHash,
        role: "CUSTOMER"
      }
    ],
    skipDuplicates: true
  });

  await prisma.service.createMany({
    data: [
      { name: "Small narrow basket", category: "Laundry baskets", basePrice: 250, unit: "basket" },
      { name: "Large narrow basket", category: "Laundry baskets", basePrice: 300, unit: "basket" },
      { name: "Wide large basket", category: "Laundry baskets", basePrice: 350, unit: "basket" },
      { name: "Duvet 3x4", category: "Duvets", basePrice: 250, unit: "item" },
      { name: "Duvet 4x6 / 3x6", category: "Duvets", basePrice: 300, unit: "item" },
      { name: "Duvet 5x6 / 6x6", category: "Duvets", basePrice: 350, unit: "item" },
      { name: "Heavy jacket", category: "Extras", basePrice: 200, unit: "item" },
      { name: "Pillows (pair)", category: "Extras", basePrice: 250, unit: "pair" },
      { name: "Shirt ironing", category: "Ironing", basePrice: 30, unit: "item" },
      { name: "Trousers ironing", category: "Ironing", basePrice: 50, unit: "item" },
      { name: "Suit ironing", category: "Ironing", basePrice: 150, unit: "item" }
    ]
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
