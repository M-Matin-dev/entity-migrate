// Import the package
import { createEntityMigration } from '../index'

// different versions of the data
const TestEntityVersionEnum = {
  v1: 'version1',
  v2: 'version2',
  v3: 'version3',
} as const
type TestEntityVersion =
  (typeof TestEntityVersionEnum)[keyof typeof TestEntityVersionEnum]

// interfaces for different versions of the data
type TestEntityVersion1 = {
  version: typeof TestEntityVersionEnum.v1
  name: string
}
type TestEntityVersion2 = {
  version: typeof TestEntityVersionEnum.v2
  fullName: string
}
type TestEntityVersion3 = {
  version: typeof TestEntityVersionEnum.v3
  firstName: string
  lastName: string
}

// Create entity migration for 'yourEntity'
const { addMigration, migrate } = createEntityMigration(
  'yourEntity',
  Object.values(TestEntityVersionEnum) as TestEntityVersion[],
)

// Define migration from V1 to V2
const isV1 = (data: any): data is TestEntityVersion1 =>
  'version' in data &&
  data.version === TestEntityVersionEnum.v1 &&
  'name' in data &&
  typeof data.name === 'string'

const migrateV1toV2 = (data: TestEntityVersion1): TestEntityVersion2 => {
  return {
    version: TestEntityVersionEnum.v2,
    fullName: data.name,
  }
}

addMigration({
  sourceVersion: TestEntityVersionEnum.v1,
  targetVersion: TestEntityVersionEnum.v2,
  guard: isV1,
  migrate: migrateV1toV2,
})

// Define migration from V2 to V3
const isV2 = (data: any): data is TestEntityVersion2 =>
  'version' in data &&
  data.version === TestEntityVersionEnum.v2 &&
  'fullName' in data &&
  typeof data.fullName === 'string'

const migrateV2toV3 = (data: TestEntityVersion2): TestEntityVersion3 => {
  const parts = data.fullName.split(' ')
  console.log('test', { data })
  return {
    version: TestEntityVersionEnum.v3,
    firstName: parts.shift(),
    lastName: parts.join(' '),
  }
}

addMigration({
  sourceVersion: TestEntityVersionEnum.v2,
  targetVersion: TestEntityVersionEnum.v3,
  guard: isV2,
  migrate: migrateV2toV3,
})

// Defining the data
const testEntityVersion1: TestEntityVersion1 = {
  version: TestEntityVersionEnum.v1,
  name: 'John Smith',
}

// Perform a migration
const migratedData = migrate(testEntityVersion1)

console.log(migratedData)
/*
internally the migrate function will migrate to v2:
{
    version: TestEntityVersionEnum.v2,
    fullName: 'John Smith'
}
and then to v3 because the resulting value has a migration from v2 to v3:
{
    version: TestEntityVersionEnum.v3,
    firstName: 'John',
    lastName: 'Smith'
}
and returns v3 to be logged in console
 */
