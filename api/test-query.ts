import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const dateStr = "27 JUNE";
  console.log("Input string:", dateStr);

  const d = new Date(dateStr);
  console.log("Parsed Date object:", d);
  console.log("Is NaN:", isNaN(d.getTime()));

  // Start of day and End of day helper logic
  const startOfDay = (date: Date) => {
    const temp = new Date(date);
    temp.setHours(0, 0, 0, 0);
    return temp;
  };

  const endOfDay = (date: Date) => {
    const temp = new Date(date);
    temp.setHours(23, 59, 59, 999);
    return temp;
  };

  const startDate = startOfDay(d);
  const endDate = endOfDay(d);

  console.log("startDate filter:", startDate.toISOString(), startDate);
  console.log("endDate filter:", endDate.toISOString(), endDate);

  // Run the query with OR condition
  const results = await prisma.leave.findMany({
    where: {
      OR: [
        { createdAt: { gte: startDate, lte: endDate } },
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ]
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  console.log("Number of results found:", results.length);
  console.log("Results details:");
  results.forEach(l => {
    console.log(`- ID: ${l.id}, Title: ${l.title}, Start: ${l.startDate.toISOString()}, End: ${l.endDate.toISOString()}, CreatedAt: ${l.createdAt.toISOString()}`);
  });

  // Also query all leaves to see their exact dates in the DB
  const allLeaves = await prisma.leave.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log("\nSample of all leaves in DB:");
  allLeaves.forEach(l => {
    console.log(`- ID: ${l.id}, Title: ${l.title}, Start: ${l.startDate.toISOString()}, End: ${l.endDate.toISOString()}, CreatedAt: ${l.createdAt.toISOString()}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
