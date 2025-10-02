import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from './logger';

/**
 * Classe para operações atômicas de leitura/escrita em arquivos JSON
 * Implementa escrita atômica usando arquivo temporário + rename
 */
export class FileDB<T = unknown> {
  private filePath: string;
  private tempPath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.tempPath = `${filePath}.tmp`;
  }

  /**
   * Lê o conteúdo do arquivo JSON
   */
  async read(): Promise<T | null> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn({ filePath: this.filePath }, 'File does not exist, returning null');
        return null;
      }
      logger.error({ filePath: this.filePath, error }, 'Failed to read file');
      throw error;
    }
  }

  /**
   * Escreve o conteúdo no arquivo JSON de forma atômica
   */
  async write(data: T): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      
      // Escreve no arquivo temporário primeiro
      await fs.writeFile(this.tempPath, jsonString, 'utf-8');
      
      // Renomeia o arquivo temporário para o arquivo final (operação atômica)
      await fs.rename(this.tempPath, this.filePath);
      
      logger.debug({ filePath: this.filePath }, 'File written successfully');
    } catch (error) {
      // Limpa arquivo temporário em caso de erro
      try {
        await fs.unlink(this.tempPath);
      } catch {
        // Ignora erro de limpeza
      }
      
      logger.error({ filePath: this.filePath, error }, 'Failed to write file');
      throw error;
    }
  }

  /**
   * Verifica se o arquivo existe
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cria o diretório pai se não existir
   */
  async ensureDir(): Promise<void> {
    const dir = this.filePath.substring(0, this.filePath.lastIndexOf('/'));
    if (dir) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Lê o arquivo ou retorna um valor padrão se não existir
   */
  async readOrDefault(defaultValue: T): Promise<T> {
    const data = await this.read();
    return data ?? defaultValue;
  }

  /**
   * Atualiza o arquivo usando uma função de transformação
   */
  async update(updater: (current: T | null) => T): Promise<T> {
    const current = await this.read();
    const updated = updater(current);
    await this.write(updated);
    return updated;
  }
}

/**
 * Instância global para o arquivo de revendas
 * TODO: Substituir por Postgres+PostGIS no futuro
 */
export const revendasDB = new FileDB<import('../types').Revenda[]>(
  join(process.cwd(), 'db', 'revendas.json')
);
