type ConstantNestedObj<T extends string> = {
  code: T;
  label: string;
};

type ConstantObj<T extends string> = {
  [key: string]: ConstantNestedObj<T>;
};

const generateCodes = <T extends string>(constantObj: ConstantObj<T>): [T, ...T[]] => {
  return Object.values(constantObj).map((c) => c.code) as [T, ...T[]];
};

export const createEnumObject = <T extends string>(values: readonly T[]): { [K in T]: K } => {
  const obj = {} as { [K in T]: K };
  for (const v of values) obj[v] = v;
  return obj;
};

// User Roles
export const UserRoles = {
  PARTICIPANT: { code: 'participant' as const, label: 'Participant' },
  OPS: { code: 'ops' as const, label: 'Operations' },
  ADMIN: { code: 'admin' as const, label: 'Administrator' },
};
export const UserRoleCodes = generateCodes(UserRoles);
export const UserRoleEnum = createEnumObject(UserRoleCodes);
export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];

// Participant Types
export const ParticipantTypes = {
  REGULAR: { code: 'regular' as const, label: 'Regular' },
  VIP: { code: 'vip' as const, label: 'VIP' },
};
export const ParticipantTypeCodes = generateCodes(ParticipantTypes);
export const ParticipantTypeEnum = createEnumObject(ParticipantTypeCodes);
export type ParticipantType = (typeof ParticipantTypeEnum)[keyof typeof ParticipantTypeEnum];

// User Type (UI concept combining roles and participant types)
export type UserType = 'vip' | 'ops' | 'admin' | 'regular';
export const UserTypeCodes: [UserType, ...UserType[]] = ['vip', 'ops', 'admin', 'regular'];
export const UserTypeEnum = createEnumObject(UserTypeCodes);

// Participant Status
export const ParticipantStatuses = {
  REGISTERED: { code: 'registered' as const, label: 'Registered' },
  CHECKED_IN: { code: 'checked_in' as const, label: 'Checked In' },
};
export const ParticipantStatusCodes = generateCodes(ParticipantStatuses);
export const ParticipantStatusEnum = createEnumObject(ParticipantStatusCodes);
export type ParticipantStatus = (typeof ParticipantStatusEnum)[keyof typeof ParticipantStatusEnum];

// Code Status
export const CodeStatuses = {
  UNASSIGNED: { code: 'unassigned' as const, label: 'Unassigned' },
  AVAILABLE: { code: 'available' as const, label: 'Available' },
  REDEEMED: { code: 'redeemed' as const, label: 'Redeemed' },
};
export const CodeStatusCodes = generateCodes(CodeStatuses);
export const CodeStatusEnum = createEnumObject(CodeStatusCodes);
export type CodeStatus = (typeof CodeStatusEnum)[keyof typeof CodeStatusEnum];

// Check-in Type Categories
export const CheckinTypeCategories = {
  ATTENDANCE: { code: 'attendance' as const, label: 'Attendance' },
  MEAL: { code: 'meal' as const, label: 'Meal' },
};
export const CheckinTypeCategoryCodes = generateCodes(CheckinTypeCategories);
export const CheckinTypeCategoryEnum = createEnumObject(CheckinTypeCategoryCodes);
export type CheckinTypeCategory = (typeof CheckinTypeCategoryEnum)[keyof typeof CheckinTypeCategoryEnum];

// Code Distribution Types
export const CodeDistributionTypes = {
  UNIQUE: { code: 'unique' as const, label: 'Unique (1 code per participant)' },
  UNIVERSAL: { code: 'universal' as const, label: 'Universal (same code for all)' },
};
export const CodeDistributionTypeCodes = generateCodes(CodeDistributionTypes);
export const CodeDistributionTypeEnum = createEnumObject(CodeDistributionTypeCodes);
export type CodeDistributionType = (typeof CodeDistributionTypeEnum)[keyof typeof CodeDistributionTypeEnum];
