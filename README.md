# entity-migrate

A Typescript package for defining and executing migrations for a specific entity, ensuring data consistency and type safety during version updates

---

## Installation

The library is available as a [npm package](https://www.npmjs.com/package/entity-migrate). To install the package run:

```shell
npm install entity-migrate
# or with yarn
yarn add entity-migrate
```

## Usage

### Importing the Package

To use the Entity Migration Package in your project, import the `createEntityMigration` function from the package:

```typescript
import { createEntityMigration } from 'entity-migration';
```

### Creating Entity Migration

To create migrations for your entity, invoke the `createEntityMigration` function, passing the entity tag and an array of all available versions:

```typescript
const { addMigration, migrate } = createEntityMigration('yourEntity', ['version1', 'version2', 'version3']);
```

### Defining Migrations

Use the `addMigration` function to define migrations between different versions of your entity. Each migration requires the source version, target version, a guard function, and a migrate function.
As a convention all the versions of data should contain a `version` property that contains the numeric or string tag of the version.

Here's an example of defining a migration from 'version1' to 'version2':

```typescript
const migrateV1toV2 = (data: Version1): Version2 => ({
  version: 'version2'
  // Migration logic from version1 to version2
});

addMigration({
  sourceVersion: 'version1',
  targetVersion: 'version2',
  guard: (data): data is Version1 => data.version === 'version1' && 'someProp' in data /* checks on other critical properties for migration */,
  migrate: migrateV1toV2,
});
```

You can define migrations for multiple version by calling `addMigration` for each version migration.

### Performing Migrations

To perform a migration on your entity data, use the `migrate` function, passing the data object. The function will automatically apply the appropriate migrations based on the data's version property:

```typescript
const migratedData = migrate(entityData);
```

The `migrate` function returns the migrated data object.
If there are migrations from v1 to v2 and also from v2 to v3 when passing an entity in v1 the function will apply both migrations and return an entity with v3 type

## Example

Here is an examples to help you understand the usage of the Entity Migration Package:

```typescript
// Import the package
import { createEntityMigration } from 'entity-migration';

// different versions of the data
const TestEntityVersionEnum = {
    v1: 'version1',
    v2: 'version2',
    v3: 'version3',
} as const
type TestEntityVersion = (typeof TestEntityVersionEnum)[keyof typeof TestEntityVersionEnum]

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
const { addMigration, migrate } = createEntityMigration('yourEntity', Object.values(TestEntityVersionEnum) as TestEntityVersion[]);

// Define migration from V1 to V2
const isV1 = (data: any): data is TestEntityVersion1 =>
    'version' in data && data.version === TestEntityVersionEnum.v1
    && 'name' in data && typeof data.name === 'string'

const migrateV1toV2 = (data: TestEntityVersion1): TestEntityVersion2 => {
    return {
        version: TestEntityVersionEnum.v2,
        fullName: data.name
    }
}
const addV1toV2Migration = () => addMigration({
    sourceVersion: TestEntityVersionEnum.v1,
    targetVersion: TestEntityVersionEnum.v2,
    guard: isV1,
    migrate: migrateV1toV2
})

// Define migration from V2 to V3
const isV2 = (data: any): data is TestEntityVersion2 =>
    'version' in data && data.version === TestEntityVersionEnum.v2
    && 'fullName' in data && typeof data.fullName === 'string'

const migrateV2toV3 = (data: TestEntityVersion2): TestEntityVersion3 => {
    const parts = data.fullName.split(' ')
    return {
        version: TestEntityVersionEnum.v2,
        firstName: parts.shift(),
        lastName: parts.join(' ')
    }
}
const addV2toV3Migration = () => addMigration({
    sourceVersion: TestEntityVersionEnum.v2,
    targetVersion: TestEntityVersionEnum.v3,
    guard: isV2,
    migrate: migrateV2toV3
})

// Defining the data
const testEntityVersion1: TestEntityVersion1 = {
    version: TestEntityVersionEnum.v1,
    name: 'John Smith'
}

// Perform a migration
const migratedData = migrate(entityData)

console.log(migratedData)
/*
internally the migrate function will migrate to v2:
{
    version: TestEntityVersionEnum.v2,
    fullName: 'John Smith'
}
and then to v3 because the resuling value has a migration to v2:
{
    version: TestEntityVersionEnum.v3,
    firstName: 'John',
    lastName: 'Smith'
}
and returns v3 to be logged in console
 */

```

## Exceptions

### Infinite loop
If a looping set of migration are added like v1ToV2, v2ToV3 and v3ToV1 as soon as the migration that causes the loop is
added the `addMigration` function will throw an error with following message:

`migrating <entityTag> from <sourceVersion> to <targetVersion> can create an infinite loop`

### Wrong migration step
If in any of the migrations steps the data provided to migrate function does not pass the guard function the `migrate`
function will throw an error with the following message:

`wrong <entityTag> migration from <sourceVersion> to <targetVersion>>`

## License

This package is provided under the [MIT License](https://opensource.org/license/mit).
