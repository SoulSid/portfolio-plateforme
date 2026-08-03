'use client';

import { useActionState } from 'react';
import { sendMessage, type ContactState } from '@/app/[locale]/contact/actions';
import type { Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';

const INITIAL: ContactState = { ok: false, error: null };

export function ContactForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(sendMessage, INITIAL);

  if (state.ok) {
    return (
      <p
        role="status"
        className="panel mt-8 p-4 text-sm"
        style={{ borderColor: 'var(--s-accent)' }}
      >
        {t(locale, 'contactSuccess')}
      </p>
    );
  }

  const field =
    'w-full rounded-md px-3 py-2 text-sm bg-[var(--s-panel)] border border-[var(--s-line)] text-[var(--s-text)]';

  return (
    <form action={formAction} className="mt-8 max-w-xl space-y-4">
      {/* Honeypot : masqué aux humains, laissé accessible aux robots. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="name" className="mono-label block">
          {t(locale, 'contactName')}
        </label>
        <input id="name" name="name" required maxLength={120} className={field} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="mono-label block">
          {t(locale, 'contactEmail')}
        </label>
        <input id="email" name="email" type="email" required className={field} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className="mono-label block">
          {t(locale, 'contactSubject')}
        </label>
        <input id="subject" name="subject" maxLength={160} className={field} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="mono-label block">
          {t(locale, 'contactBody')}
        </label>
        <textarea id="body" name="body" required minLength={10} maxLength={5000} rows={7} className={field} />
      </div>

      {state.error && (
        <p role="alert" className="text-sm" style={{ color: '#ff8a8a' }}>
          {t(locale, 'contactError')}
        </p>
      )}

      <button type="submit" disabled={pending} className="accent-btn disabled:opacity-60">
        {pending ? t(locale, 'contactSending') : t(locale, 'contactSend')}
      </button>
    </form>
  );
}
