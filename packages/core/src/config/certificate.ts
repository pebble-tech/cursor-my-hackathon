import type { UserRole } from './constant';

export const HACKATHON_NAME = 'Cursor x Anthropic Hackathon Malaysia';
export const HACKATHON_DATE = 'December 6-7, 2025';

interface CertificateContent {
  title: string;
  subtitle: string;
}

export const CERTIFICATE_CONTENT: Record<UserRole, CertificateContent> = {
  participant: {
    title: 'Participation',
    subtitle: `participated in ${HACKATHON_NAME}`,
  },
  ops: {
    title: 'Volunteer',
    subtitle: `volunteered at ${HACKATHON_NAME}`,
  },
  admin: {
    title: 'Organization',
    subtitle: `helped organize ${HACKATHON_NAME}`,
  },
} as const;
