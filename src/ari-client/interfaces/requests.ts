import type { Logger } from './logger.types.js';

export interface AriClientConfig {
  host: string; // Ex.: "localhost"
  port: number; // Ex.: 8088
  username: string; // Ex.: "ipcomari"
  password: string; // Ex.: "password123"
  secure?: boolean; // Indica se é uma conexão segura (default: true)
  logger?: Logger; // Logger implementation, defaults to console
}

export interface AriApplication {
  name: string;
  // [key: string]: any; // Caso existam outros campos desconhecidos, remova isso se os campos forem conhecidos.
}
