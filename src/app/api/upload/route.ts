import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let count = 0;
    for (const row of data as any[]) {
      await prisma.lead.create({
        data: {
          name: row['Название'] ? String(row['Название']) : 'Без названия',
          category: row['Рубрика'] ? String(row['Рубрика']) : null,
          rating: row['Рейтинг'] ? String(row['Рейтинг']) : null,
          reviews: row['Отзывы'] ? String(row['Отзывы']) : null,
          address: row['Адрес'] ? String(row['Адрес']) : null,
          phone: row['Телефон'] ? String(row['Телефон']) : null,
          coordinates: row['Координаты'] ? String(row['Координаты']) : null,
          link2gis: row['Ссылка 2ГИС'] ? String(row['Ссылка 2ГИС']) : null,
        },
      });
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
