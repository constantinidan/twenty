import { FieldMetadataType } from 'twenty-shared/types';

import { mergeFieldValues } from 'src/engine/api/graphql/graphql-query-runner/utils/merge-field-values.util';

describe('mergeFieldValues', () => {
  const PRIORITY_RECORD_ID = 'priority-record-id';
  const RECORDS_WITH_VALUES = [
    { value: 'value1', recordId: 'record1' },
    { value: 'value2', recordId: PRIORITY_RECORD_ID },
    { value: 'value3', recordId: 'record3' },
  ];

  describe('default field types', () => {
    it('should return priority field value for text fields', () => {
      const result = mergeFieldValues(
        FieldMetadataType.TEXT,
        RECORDS_WITH_VALUES,
        PRIORITY_RECORD_ID,
      );

      expect(result).toBe('value2');
    });

    it('should throw error when priority record is not found', () => {
      const recordsWithoutPriorityValue = [
        { value: 'value1', recordId: 'record1' },
        { value: null, recordId: PRIORITY_RECORD_ID },
        { value: 'value3', recordId: 'record3' },
      ];

      expect(() =>
        mergeFieldValues(
          FieldMetadataType.TEXT,
          recordsWithoutPriorityValue,
          'non-existent-id',
        ),
      ).toThrow('Priority record with ID non-existent-id not found');
    });
  });

  describe('array field types', () => {
    it('should merge array values', () => {
      const arrayRecords = [
        { value: ['a', 'b'], recordId: 'record1' },
        { value: ['b', 'c'], recordId: PRIORITY_RECORD_ID },
        { value: ['c', 'd'], recordId: 'record3' },
      ];

      const result = mergeFieldValues(
        FieldMetadataType.ARRAY,
        arrayRecords,
        PRIORITY_RECORD_ID,
      );

      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('arrayable field types', () => {
    it('should merge emails for EMAILS field', () => {
      const emailRecords = [
        {
          value: {
            primaryEmail: 'first@example.com',
            additionalEmails: ['extra1@example.com'],
          },
          recordId: 'record1',
        },
        {
          value: {
            primaryEmail: 'priority@example.com',
            additionalEmails: ['extra2@example.com'],
          },
          recordId: PRIORITY_RECORD_ID,
        },
      ];

      const result = mergeFieldValues(
        FieldMetadataType.EMAILS,
        emailRecords,
        PRIORITY_RECORD_ID,
      );

      expect(result).toEqual({
        primaryEmail: 'priority@example.com',
        additionalEmails: expect.arrayContaining([
          'extra1@example.com',
          'extra2@example.com',
          'first@example.com',
        ]),
      });
      expect((result as any).additionalEmails).toHaveLength(3);
    });

    it('should preserve primary emails from non-priority records in additionalEmails', () => {
      const emailRecords = [
        {
          value: {
            primaryEmail: 'first@example.com',
            additionalEmails: ['extra1@example.com'],
          },
          recordId: 'record1',
        },
        {
          value: {
            primaryEmail: 'priority@example.com',
            additionalEmails: ['extra2@example.com'],
          },
          recordId: PRIORITY_RECORD_ID,
        },
        {
          value: {
            primaryEmail: 'third@example.com',
            additionalEmails: null,
          },
          recordId: 'record3',
        },
      ];

      const result = mergeFieldValues(
        FieldMetadataType.EMAILS,
        emailRecords,
        PRIORITY_RECORD_ID,
      );

      expect(result).toEqual({
        primaryEmail: 'priority@example.com',
        additionalEmails: expect.arrayContaining([
          'extra1@example.com',
          'extra2@example.com',
          'first@example.com',
          'third@example.com',
        ]),
      });
      expect((result as any).additionalEmails).toHaveLength(4);
      expect((result as any).additionalEmails).not.toContain(
        'priority@example.com',
      );
    });

    it('should preserve primary phones from non-priority records in additionalPhones', () => {
      const phoneRecords = [
        {
          value: {
            primaryPhoneNumber: '+1234567890',
            primaryPhoneCountryCode: 'US',
            primaryPhoneCallingCode: '+1',
            additionalPhones: [
              {
                number: '+1111111111',
                countryCode: 'US',
                callingCode: '+1',
              },
            ],
          },
          recordId: 'record1',
        },
        {
          value: {
            primaryPhoneNumber: '+9876543210',
            primaryPhoneCountryCode: 'US',
            primaryPhoneCallingCode: '+1',
            additionalPhones: [
              {
                number: '+2222222222',
                countryCode: 'US',
                callingCode: '+1',
              },
            ],
          },
          recordId: PRIORITY_RECORD_ID,
        },
        {
          value: {
            primaryPhoneNumber: '+5555555555',
            primaryPhoneCountryCode: 'US',
            primaryPhoneCallingCode: '+1',
            additionalPhones: null,
          },
          recordId: 'record3',
        },
      ];

      const result = mergeFieldValues(
        FieldMetadataType.PHONES,
        phoneRecords,
        PRIORITY_RECORD_ID,
      );

      expect(result).toEqual({
        primaryPhoneNumber: '+9876543210',
        primaryPhoneCountryCode: 'US',
        primaryPhoneCallingCode: '+1',
        additionalPhones: expect.arrayContaining([
          expect.objectContaining({ number: '+1111111111' }),
          expect.objectContaining({ number: '+2222222222' }),
          expect.objectContaining({ number: '+1234567890' }),
          expect.objectContaining({ number: '+5555555555' }),
        ]),
      });
      expect((result as any).additionalPhones).toHaveLength(4);
      expect(
        (result as any).additionalPhones?.map(
          (p: { number: string }) => p.number,
        ),
      ).not.toContain('+9876543210');
    });

    it('should preserve primary links from non-priority records in secondaryLinks', () => {
      const linkRecords = [
        {
          value: {
            primaryLinkUrl: 'https://example1.com',
            primaryLinkLabel: 'Example 1',
            secondaryLinks: [{ url: 'https://extra1.com', label: 'Extra 1' }],
          },
          recordId: 'record1',
        },
        {
          value: {
            primaryLinkUrl: 'https://priority.com',
            primaryLinkLabel: 'Priority',
            secondaryLinks: [{ url: 'https://extra2.com', label: 'Extra 2' }],
          },
          recordId: PRIORITY_RECORD_ID,
        },
        {
          value: {
            primaryLinkUrl: 'https://example3.com',
            primaryLinkLabel: 'Example 3',
            secondaryLinks: null,
          },
          recordId: 'record3',
        },
      ];

      const result = mergeFieldValues(
        FieldMetadataType.LINKS,
        linkRecords,
        PRIORITY_RECORD_ID,
      );

      expect(result).toEqual({
        primaryLinkUrl: 'https://priority.com',
        primaryLinkLabel: 'Priority',
        secondaryLinks: expect.arrayContaining([
          expect.objectContaining({ url: 'https://extra1.com' }),
          expect.objectContaining({ url: 'https://extra2.com' }),
          expect.objectContaining({ url: 'https://example1.com' }),
          expect.objectContaining({ url: 'https://example3.com' }),
        ]),
      });
      expect((result as any).secondaryLinks).toHaveLength(4);
      expect(
        (result as any).secondaryLinks?.map((l: { url: string }) => l.url),
      ).not.toContain('https://priority.com');
    });
  });
});
