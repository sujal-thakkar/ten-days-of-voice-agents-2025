import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { SqlJsStatic } from 'sql.js';
import { NextResponse } from 'next/server';

interface FraudCaseRow {
  id: number;
  userName: string;
  customerName: string;
  securityIdentifier: string;
  cardLast4: string;
  cardBrand: string;
  transactionAmount: number;
  currency: string;
  merchantName: string;
  location: string;
  transactionTime: string;
  transactionCategory: string;
  transactionSource: string;
  securityQuestion: string;
  status: string;
  outcomeNote: string | null;
}

const DEFAULT_DB_PATH = path.resolve(
  process.cwd(),
  '..',
  'backend',
  'src',
  'data',
  'fraud_cases.db'
);

let sqlModulePromise: Promise<SqlJsStatic> | null = null;

function getSqlModule() {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({
      locateFile: (file) =>
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    });
  }
  return sqlModulePromise;
}

function resolveDbPath(): string {
  const envPath = process.env.FRAUD_DB_PATH;
  const target = envPath ? path.resolve(envPath) : DEFAULT_DB_PATH;

  if (!fs.existsSync(target)) {
    throw new Error(
      `Fraud database not found at ${target}. Run the backend seeding command or update FRAUD_DB_PATH.`
    );
  }

  return target;
}

export async function GET() {
  try {
    const dbPath = resolveDbPath();
    const SQL = await getSqlModule();
    const fileBuffer = await fs.promises.readFile(dbPath);
    const db = new SQL.Database(new Uint8Array(fileBuffer));
    const rows: FraudCaseRow[] = [];
    const statement = db.prepare(`
      SELECT
        id,
        user_name AS userName,
        customer_name AS customerName,
        security_identifier AS securityIdentifier,
        card_last4 AS cardLast4,
        card_brand AS cardBrand,
        transaction_amount AS transactionAmount,
        currency,
        merchant_name AS merchantName,
        location,
        transaction_time AS transactionTime,
        transaction_category AS transactionCategory,
        transaction_source AS transactionSource,
        security_question AS securityQuestion,
        status,
        outcome_note AS outcomeNote
      FROM fraud_cases
      ORDER BY id ASC
    `);

    while (statement.step()) {
      rows.push(statement.getAsObject() as FraudCaseRow);
    }

    statement.free();
    db.close();

    const cases = rows.map((row) => ({
      id: row.id,
      userName: row.userName,
      customerName: row.customerName,
      securityIdentifier: row.securityIdentifier,
      cardEnding: `**** ${row.cardLast4}`,
      cardBrand: row.cardBrand,
      transactionAmount: Number(row.transactionAmount),
      currency: row.currency,
      merchantName: row.merchantName,
      location: row.location,
      transactionTime: row.transactionTime,
      transactionCategory: row.transactionCategory,
      transactionSource: row.transactionSource,
      securityQuestion: row.securityQuestion,
      status: row.status,
      outcomeNote: row.outcomeNote,
    }));

    return NextResponse.json({ cases }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to read fraud cases';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
