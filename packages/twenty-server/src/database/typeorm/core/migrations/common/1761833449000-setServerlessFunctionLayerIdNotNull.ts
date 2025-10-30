import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class SetServerlessFunctionLayerIdNotNull1761833449000
  implements MigrationInterface
{
  name = 'SetServerlessFunctionLayerIdNotNull1761833449000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."serverlessFunction" ALTER COLUMN "serverlessFunctionLayerId" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."serverlessFunction" ALTER COLUMN "serverlessFunctionLayerId" DROP NOT NULL`,
    );
  }
}
