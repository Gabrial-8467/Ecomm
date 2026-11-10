import { runAllSeeds } from './seeds/index.js';

runAllSeeds()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database seeding failed:', err);
    process.exit(1);
  });
