import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: 'https://api.zhipuai.cn/v4',
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(id) },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const prompt = `Ты - опытный B2B маркетолог и веб-разработчик. Тебе нужно придумать идею продукта для бизнеса и написать короткий шаблон сообщения для отправки владельцу этого бизнеса. Бизнес находится в городе Якутск.
    Твое портфолио: https://vitaliy-portfolio-one.vercel.app/ - ты умеешь делать веб сайты, веб приложения, телеграм ботов и вообще все что может понадобиться бизнесу.

    Информация о бизнесе:
    Название: ${lead.name}
    Рубрика (сфера деятельности): ${lead.category || 'Не указана'}
    Рейтинг: ${lead.rating || 'Не указан'}
    Количество отзывов: ${lead.reviews || 'Не указано'}
    Адрес: ${lead.address || 'Не указан'}

    Задача:
    1. Идея продукта (что именно мы можем разработать для них, чтобы увеличить выручку, автоматизировать процессы или улучшить сервис. Учитывай специфику их рубрики).
    2. Текст сообщения (оффер) для владельца/ЛПР в мессенджер. Текст должен быть вежливым, не слишком длинным, вызывать интерес, указывать на то, что у них нет сайта (мы спарсили их из списка организаций без сайтов) и предлагать созвон или диалог. Обязательно вставь ссылку на портфолио.

    Формат ответа:
    Верни строго JSON объект с двумя полями:
    {
      "idea": "Твоя идея для продукта (1-3 предложения)",
      "message": "Текст сообщения для владельца"
    }`;

    const completion = await openai.chat.completions.create({
      model: "glm-4-plus",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
        throw new Error('No content returned from AI');
    }
    const aiResponse = JSON.parse(responseContent);

    const updatedLead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: {
        aiIdea: aiResponse.idea,
        aiMessage: aiResponse.message,
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error generating AI offer:', error);
    return NextResponse.json({ error: 'Failed to generate AI offer' }, { status: 500 });
  }
}
