import { createEntityMigration } from './index'

const TestVersionsEnum = {
  VERSION_1: 'VERSION_1',
  VERSION_2: 'VERSION_2',
  VERSION_3: 'VERSION_3',
} as const
// type TestVersions = (typeof TestVersionsEnum)[keyof typeof TestVersionsEnum]
type EntityVersion1 = {
  version: typeof TestVersionsEnum.VERSION_1
  version1Prop: 'testValue'
}
type EntityVersion2 = {
  version: typeof TestVersionsEnum.VERSION_2
  version2Prop: 'testValue'
}
type EntityVersion3 = {
  version: typeof TestVersionsEnum.VERSION_3
  version3Prop: 'testValue'
}
const entityVersion1: EntityVersion1 = {
  version: TestVersionsEnum.VERSION_1,
  version1Prop: 'testValue',
}
const entityVersion2: EntityVersion2 = {
  version: TestVersionsEnum.VERSION_2,
  version2Prop: 'testValue',
}
const entityVersion3: EntityVersion3 = {
  version: TestVersionsEnum.VERSION_3,
  version3Prop: 'testValue',
}

let { addMigration, migrate } = createEntityMigration(
  'testEntity',
  Object.values(TestVersionsEnum),
)

const migrateV1toV2 = jest
  .fn()
  .mockImplementation((data: EntityVersion1): EntityVersion2 => {
    return {
      version: TestVersionsEnum.VERSION_2,
      version2Prop: data.version1Prop,
    }
  })
const addV1toV2Migration = () =>
  addMigration({
    sourceVersion: TestVersionsEnum.VERSION_1,
    targetVersion: TestVersionsEnum.VERSION_2,
    guard(data): data is EntityVersion1 {
      return (
        data.version === TestVersionsEnum.VERSION_1 && 'version1Prop' in data
      )
    },
    migrate: migrateV1toV2,
  })

const migrateV2toV3 = jest
  .fn()
  .mockImplementation((data: EntityVersion2): EntityVersion3 => {
    return {
      version: TestVersionsEnum.VERSION_3,
      version3Prop: data.version2Prop,
    }
  })
const addV2toV3Migration = () =>
  addMigration({
    sourceVersion: TestVersionsEnum.VERSION_2,
    targetVersion: TestVersionsEnum.VERSION_3,
    guard(data): data is EntityVersion2 {
      return (
        data.version === TestVersionsEnum.VERSION_2 && 'version2Prop' in data
      )
    },
    migrate: migrateV2toV3,
  })

const migrateV3toV1 = jest
  .fn()
  .mockImplementation((data: EntityVersion3): EntityVersion1 => {
    return {
      version: TestVersionsEnum.VERSION_1,
      version1Prop: data.version3Prop,
    }
  })
const addV3toV1Migration = () =>
  addMigration({
    sourceVersion: TestVersionsEnum.VERSION_3,
    targetVersion: TestVersionsEnum.VERSION_1,
    guard(data): data is EntityVersion2 {
      return (
        data.version === TestVersionsEnum.VERSION_3 && 'version3Prop' in data
      )
    },
    migrate: migrateV3toV1,
  })

describe('userCollectionMigrations', () => {
  afterEach(() => {
    const migration = createEntityMigration(
      'testMigration',
      Object.values(TestVersionsEnum),
    )
    addMigration = migration.addMigration
    migrate = migration.migrate
    migrateV1toV2.mockClear()
    migrateV2toV3.mockClear()
    migrateV3toV1.mockClear()
  })

  describe('throwIfInfiniteMigration', () => {
    it('throws when adding infinite migrations', () => {
      expect(() => {
        addV1toV2Migration()
        addV2toV3Migration()
        addV3toV1Migration()
      }).toThrowError()
    })

    it('works if one migration in infinite loop is removed', () => {
      expect(() => {
        addV2toV3Migration()
        addV3toV1Migration()
      }).not.toThrowError()
    })
  })

  describe('migrate', () => {
    it('returns the original data if no migrations are available', () => {
      expect(migrate(entityVersion1)).toEqual(entityVersion1)
      expect(migrateV1toV2).toHaveBeenCalledTimes(0)
      expect(migrateV2toV3).toHaveBeenCalledTimes(0)
    })

    it('returns the second version with one migration', () => {
      addV1toV2Migration()
      expect(migrate(entityVersion1)).toEqual(entityVersion2)
      expect(migrateV1toV2).toHaveBeenCalledTimes(1)
      expect(migrateV2toV3).toHaveBeenCalledTimes(0)
    })

    it('returns the third version with two migration', () => {
      addV1toV2Migration()
      addV2toV3Migration()
      expect(migrate(entityVersion1)).toEqual(entityVersion3)
      expect(migrateV1toV2).toHaveBeenCalledTimes(1)
      expect(migrateV2toV3).toHaveBeenCalledTimes(1)
    })

    it('returns the third version with one migration and skips inapplicable migration', () => {
      addV1toV2Migration()
      addV2toV3Migration()
      expect(migrate(entityVersion2)).toEqual(entityVersion3)
      expect(migrateV1toV2).toHaveBeenCalledTimes(0)
      expect(migrateV2toV3).toHaveBeenCalledTimes(1)
    })
  })
})
