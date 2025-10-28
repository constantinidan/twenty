import { type CountryCode } from 'libphonenumber-js';
import uniqBy from 'lodash.uniqby';

import { hasRecordFieldValue } from 'src/engine/api/graphql/graphql-query-runner/utils/has-record-field-value.util';
import {
  type AdditionalPhoneMetadata,
  type PhonesMetadata,
} from 'src/engine/metadata-modules/field-metadata/composite-types/phones.composite-type';

export const mergePhonesFieldValues = (
  recordsWithValues: { value: PhonesMetadata; recordId: string }[],
  priorityRecordId: string,
): PhonesMetadata => {
  if (recordsWithValues.length === 0) {
    return {
      primaryPhoneNumber: '',
      primaryPhoneCountryCode: 'US',
      primaryPhoneCallingCode: '',
      additionalPhones: null,
    };
  }

  let primaryPhoneNumber = '';
  let primaryPhoneCountryCode: CountryCode | null = null;
  let primaryPhoneCallingCode = '';

  const priorityRecord = recordsWithValues.find(
    (record) => record.recordId === priorityRecordId,
  );

  if (
    priorityRecord &&
    hasRecordFieldValue(priorityRecord.value.primaryPhoneNumber)
  ) {
    primaryPhoneNumber = priorityRecord.value.primaryPhoneNumber;
    primaryPhoneCountryCode = priorityRecord.value.primaryPhoneCountryCode;
    primaryPhoneCallingCode = priorityRecord.value.primaryPhoneCallingCode;
  } else {
    const fallbackRecord = recordsWithValues.find((record) =>
      hasRecordFieldValue(record.value.primaryPhoneNumber),
    );

    if (fallbackRecord) {
      primaryPhoneNumber = fallbackRecord.value.primaryPhoneNumber;
      primaryPhoneCountryCode = fallbackRecord.value.primaryPhoneCountryCode;
      primaryPhoneCallingCode = fallbackRecord.value.primaryPhoneCallingCode;
    }
  }

  const allPhones: AdditionalPhoneMetadata[] = [];

  recordsWithValues.forEach((record) => {
    // Collect primary phones from all records
    if (hasRecordFieldValue(record.value.primaryPhoneNumber)) {
      allPhones.push({
        number: record.value.primaryPhoneNumber,
        countryCode: record.value.primaryPhoneCountryCode,
        callingCode: record.value.primaryPhoneCallingCode,
      });
    }

    // Collect additional phones from all records
    if (Array.isArray(record.value.additionalPhones)) {
      allPhones.push(
        ...record.value.additionalPhones.filter((phone) =>
          hasRecordFieldValue(phone.number),
        ),
      );
    }
  });

  // Deduplicate by number and filter out the selected primary phone
  const uniqueAdditionalPhones = uniqBy(allPhones, 'number').filter(
    (phone) => phone.number !== primaryPhoneNumber,
  );

  return {
    primaryPhoneNumber,
    primaryPhoneCountryCode: primaryPhoneCountryCode!,
    primaryPhoneCallingCode,
    additionalPhones:
      uniqueAdditionalPhones.length > 0 ? uniqueAdditionalPhones : null,
  };
};
