import { promises as fs } from 'fs';
import type { Migration, MigrationProvider } from 'kysely';
import * as path from 'path';
import { pathToFileURL } from 'url';

/**
 * A custom migration provider that properly handles file paths with ESM on all platforms.
 * This converts file paths to file:// URLs before importing, which is required for dynamic imports in ESM.
 */
export class EsmFileMigrationProvider implements MigrationProvider {
  readonly #props: {
    migrationFolder: string;
  };

  constructor(props: { migrationFolder: string }) {
    this.#props = props;
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};
    const files = await fs.readdir(this.#props.migrationFolder);

    for (const fileName of files) {
      if (
        fileName.endsWith('.js') ||
        (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts'))
      ) {
        const migrationKey = fileName.substring(0, fileName.lastIndexOf('.'));
        const filePath = path.join(this.#props.migrationFolder, fileName);

        // Convert file path to file:// URL for ESM compatibility (works on all platforms)
        const fileUrl = pathToFileURL(filePath).href;

        // Dynamic import using the file:// URL
        const migration = await import(fileUrl);

        migrations[migrationKey] = migration;
      }
    }

    return migrations;
  }
}
