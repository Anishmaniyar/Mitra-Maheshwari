import { app } from './app.js';
import { testDatabaseConnection } from './config/database.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  await testDatabaseConnection();

  const port = Number(env.PORT);
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
