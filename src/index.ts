export interface Migration<
  SourceVersion extends string | number,
  TargetVersion extends string | number,
  SourceType extends { version: SourceVersion },
  TargetType extends { version: TargetVersion },
> {
  sourceVersion: SourceVersion
  targetVersion: TargetVersion
  guard(data: any): data is SourceType
  migrate(data: SourceType): TargetType
}

export function createEntityMigration<Versions extends string | number>(
  entityTag: string,
  allVersions: Versions[],
) {
  type MigrationsMap = Partial<Record<Versions, Migration<any, any, any, any>>>

  const userCollectionMigrations: MigrationsMap = {}

  function throwIfInfiniteMigrationFrom<T extends string | number>(
    migrations: MigrationsMap,
    version: T,
  ) {
    const isMigrationVersion = (version: any): version is Versions => {
      return currentVersion && currentVersion in migrations
    }
    const migratedFromVersion = new Set<Versions>()
    let currentVersion = version
    while (isMigrationVersion(currentVersion)) {
      const { targetVersion } = migrations[currentVersion] || {}
      if (migratedFromVersion.has(currentVersion)) {
        throw new Error(
          `migrating ${entityTag} from ${currentVersion} to ${targetVersion} can create an infinite loop`,
        )
      }
      migratedFromVersion.add(currentVersion)
      currentVersion = targetVersion
    }
  }
  function throwIfInfiniteMigration(migrations: MigrationsMap) {
    allVersions.forEach(version =>
      throwIfInfiniteMigrationFrom(migrations, version),
    )
  }

  function addMigration<
    SourceVersion extends Versions,
    TargetVersion extends Versions,
    SourceType extends { version: SourceVersion },
    TargetType extends { version: TargetVersion },
    Props extends Migration<
      SourceVersion,
      TargetVersion,
      SourceType,
      TargetType
    >,
  >(props: Props) {
    userCollectionMigrations[props.sourceVersion] = props
    throwIfInfiniteMigration(userCollectionMigrations)
  }

  const migrateData = (data: any) => {
    if ('version' in data) {
      let migratedData = data
      let migration = userCollectionMigrations[migratedData.version]
      while (migration) {
        const { migrate, guard, sourceVersion, targetVersion } = migration
        if (guard(migratedData)) {
          migratedData = migrate(migratedData)
          migration = userCollectionMigrations[targetVersion]
        } else {
          throw new Error(
            `wrong ${entityTag} migration from ${sourceVersion} to ${targetVersion}`,
          )
        }
      }
      return migratedData
    }
    throw new Error(
      `${entityTag} to be migrated should have a version property on it`,
    )
  }

  return {
    addMigration,
    migrate: migrateData,
  }
}
