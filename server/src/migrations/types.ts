// Contrato común para definir migraciones versionadas del backend.
import { PoolClient } from "pg";

export interface Migration {
  version: string;
  name: string;
  up: (client: PoolClient) => Promise<void>;
}
