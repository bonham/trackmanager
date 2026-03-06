const DEFAULT_AUTH_SCHEMA = 'public';

function isValidSchemaName(schema: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(schema);
}

export default function getAuthSchema(): string {
  const configuredSchema = process.env.AUTH_SCHEMA?.trim();

  if (configuredSchema === undefined || configuredSchema.length === 0) {
    return DEFAULT_AUTH_SCHEMA;
  }

  if (!isValidSchemaName(configuredSchema)) {
    throw new Error(`Invalid AUTH_SCHEMA value: ${configuredSchema}`);
  }

  return configuredSchema;
}
