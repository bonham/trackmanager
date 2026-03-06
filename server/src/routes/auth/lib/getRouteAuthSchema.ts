import type { Request } from 'express';

function isValidSchemaName(schema: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(schema);
}

function ensureValidSchema(schema: string): string {
  if (!isValidSchemaName(schema)) {
    throw new Error(`Invalid schema value from route context: ${schema}`);
  }
  return schema;
}

export default function getRouteAuthSchema(req: Request): string | undefined {
  const reqWithSchema = req as Request & { schema?: unknown };

  if (typeof reqWithSchema.schema === 'string') {
    return ensureValidSchema(reqWithSchema.schema);
  }

  if (typeof req.params.authSchema === 'string' && req.params.authSchema.length > 0) {
    return ensureValidSchema(req.params.authSchema);
  }

  const querySchema = req.query.authSchema;
  if (typeof querySchema === 'string' && querySchema.length > 0) {
    return ensureValidSchema(querySchema);
  }

  return undefined;
}
