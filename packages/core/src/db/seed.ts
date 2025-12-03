import cuid from 'cuid';

import { UsersTable } from '~/auth/schema';
import { generateQRCodeValue } from '~/business.server/events/events';
import { ParticipantStatuses, ParticipantTypes, UserRoles } from '~/config/constant';
import { db, eq } from '~/drizzle.server';
import { logError, logInfo } from '~/utils/logging';

const ADMIN_EMAIL = 'mgongzai@gmail.com';

async function seed() {
  logInfo('Starting database seed...');

  const existingAdmin = await db.query.users.findFirst({
    where: eq(UsersTable.email, ADMIN_EMAIL),
  });

  if (existingAdmin) {
    logInfo('Admin user already exists, skipping creation', { email: ADMIN_EMAIL });
    return;
  }

  const userId = cuid();
  const qrCodeValue = generateQRCodeValue(userId);

  await db.insert(UsersTable).values({
    id: userId,
    name: 'Kong',
    email: ADMIN_EMAIL,
    emailVerified: true,
    role: UserRoles.ADMIN.code,
    participantType: ParticipantTypes.REGULAR.code,
    status: ParticipantStatuses.REGISTERED.code,
    qrCodeValue,
  });

  logInfo('Admin user created successfully', { email: ADMIN_EMAIL, userId });
}

seed()
  .then(() => {
    logInfo('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logError('Seed failed', { error });
    process.exit(1);
  });
