'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Non autorisé.');
}

export async function toggleRead(id: string) {
  await requireAdmin();
  const message = await prisma.contactMessage.findUnique({ where: { id }, select: { read: true } });
  if (!message) return;
  await prisma.contactMessage.update({ where: { id }, data: { read: !message.read } });
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}
