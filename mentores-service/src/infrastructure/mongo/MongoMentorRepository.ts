import { MongoClient, type Collection, type Db } from 'mongodb';
import type { Mentor } from '../../domain/mentor';
import type { MentorRepository } from '../../ports/MentorRepository';

export interface MongoConfig {
  uri: string;
  dbName: string;
  serverSelectionTimeoutMS?: number;
}

const PROJECAO = { _id: 0 } as const;

/** Adaptador MongoDB da colecao `mentores`. Conexao lazy e cacheada. */
export class MongoMentorRepository implements MentorRepository {
  private client: MongoClient | null = null;
  private dbPromise: Promise<Db> | null = null;

  constructor(private readonly config: MongoConfig) {}

  private async obterDb(): Promise<Db> {
    if (!this.dbPromise) {
      const client = new MongoClient(this.config.uri, {
        serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS ?? 5000,
      });
      this.client = client;
      this.dbPromise = client
        .connect()
        .then((conectado) => conectado.db(this.config.dbName));
    }
    return this.dbPromise;
  }

  private async colecao(): Promise<Collection<Mentor>> {
    const db = await this.obterDb();
    return db.collection<Mentor>('mentores');
  }

  /** Cria indices necessarios. Chamado no boot e pelo script de seed. */
  async inicializar(): Promise<void> {
    const col = await this.colecao();
    await col.createIndex({ id: 1 }, { unique: true, name: 'uk_mentor_id' });
    await col.createIndex({ nome: 1 }, { name: 'idx_mentor_nome' });
  }

  async listar(): Promise<Mentor[]> {
    const col = await this.colecao();
    return col.find({}, { projection: PROJECAO }).toArray();
  }

  async buscarPorId(id: string): Promise<Mentor | null> {
    const col = await this.colecao();
    return col.findOne({ id }, { projection: PROJECAO });
  }

  async criar(mentor: Mentor): Promise<Mentor> {
    const col = await this.colecao();
    await col.insertOne({ ...mentor });
    return mentor;
  }

  async atualizar(mentor: Mentor): Promise<Mentor | null> {
    const col = await this.colecao();
    const resultado = await col.replaceOne({ id: mentor.id }, mentor);
    return resultado.matchedCount > 0 ? mentor : null;
  }

  async remover(id: string): Promise<boolean> {
    const col = await this.colecao();
    const resultado = await col.deleteOne({ id });
    return resultado.deletedCount > 0;
  }

  async inserirVarios(mentores: Mentor[]): Promise<void> {
    if (mentores.length === 0) return;
    const col = await this.colecao();
    await col.insertMany(mentores.map((mentor) => ({ ...mentor })));
  }

  async contar(): Promise<number> {
    const col = await this.colecao();
    return col.countDocuments({});
  }

  async verificarSaude(): Promise<boolean> {
    try {
      const db = await this.obterDb();
      await db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async fechar(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.dbPromise = null;
    }
  }
}
