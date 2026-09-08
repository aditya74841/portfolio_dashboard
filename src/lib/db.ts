import Dexie, { type EntityTable } from "dexie";

export interface LocalDiaryEntry {
  date: string; // Primary Key: format YYYY-MM-DD
  _id?: string; // MongoDB ObjectId when synced
  userId?: string;
  content: string;
  mood: string;
  wordCount: number;
  createdAt?: string;
  updatedAt: string;
  syncStatus: "synced" | "pending";
}

export const db = new Dexie("PortfolioDashboardDB") as Dexie & {
  diary: EntityTable<LocalDiaryEntry, "date">;
};

// Schema: Indexed by primary key 'date', and secondary indexes on 'updatedAt' and 'syncStatus'
db.version(1).stores({
  diary: "date, updatedAt, syncStatus",
});

