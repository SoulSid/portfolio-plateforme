'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export type ContactState = { ok: boolean; error: string | null };

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  subject: z.string().trim().max(160).optional(),
  body: z.string().trim().min(10).max(5000),
});

/**
 * Limitation de débit en mémoire, par processus.
 * Suffisant pour freiner un envoi répété depuis un même navigateur ; ce n'est
 * pas une protection distribuée, et elle repart à zéro à chaque redéploiement.
 */
const RATE = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (RATE.get(key) ?? []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  RATE.set(key, recent);
  return false;
}

export async function sendMessage(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  /* Honeypot : un champ invisible que seuls les robots remplissent. */
  if (String(formData.get('website') ?? '') !== '') {
    return { ok: true, error: null }; // succès simulé : le robot n'apprend rien
  }

  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject') || undefined,
    body: formData.get('body'),
  });

  if (!parsed.success) {
    return { ok: false, error: 'invalid' };
  }

  if (rateLimited(parsed.data.email.toLowerCase())) {
    return { ok: false, error: 'rate' };
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body,
    },
  });

  /* Notification e-mail : facultative. Sans clé Resend, le message est
     quand même enregistré et visible dans /admin/messages. */
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (apiKey && to) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio <onboarding@resend.dev>',
          to: [to],
          reply_to: parsed.data.email,
          subject: parsed.data.subject
            ? `[Portfolio] ${parsed.data.subject}`
            : `[Portfolio] Message de ${parsed.data.name}`,
          text: `${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.body}`,
        }),
      });
    } catch {
      /* L'e-mail est un confort : son échec ne doit pas perdre le message. */
    }
  }

  revalidatePath('/admin/messages');
  return { ok: Boolean(message), error: null };
}
