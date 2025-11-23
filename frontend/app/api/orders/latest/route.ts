import { NextResponse } from 'next/server';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const ORDER_DIR = path.resolve(process.cwd(), '../backend/KMS/logs/orders');

export const revalidate = 0;

async function getLatestOrderFile() {
  try {
    await fs.mkdir(ORDER_DIR, { recursive: true });
    const entries = await fs.readdir(ORDER_DIR, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
    if (files.length === 0) {
      return null;
    }

    const ranked = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(ORDER_DIR, file.name);
        const stats = await fs.stat(filePath);
        return { filePath, name: file.name, mtimeMs: stats.mtimeMs };
      })
    );

    ranked.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return ranked[0];
  } catch (error) {
    console.error('Unable to read orders directory', error);
    throw error;
  }
}

export async function GET() {
  try {
    const latest = await getLatestOrderFile();
    if (!latest) {
      return new NextResponse(null, { status: 204 });
    }

    const raw = await fs.readFile(latest.filePath, { encoding: 'utf-8' });
    const payload = JSON.parse(raw);
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    return NextResponse.json(
      {
        fileName: latest.name,
        updatedAt: new Date(latest.mtimeMs).toISOString(),
        completedAt: payload.completedAt,
        summary: payload.summary,
        order: payload.order,
      },
      { headers }
    );
  } catch (error) {
    console.error('Failed to load latest order', error);
    return new NextResponse('Failed to load latest order', { status: 500 });
  }
}
