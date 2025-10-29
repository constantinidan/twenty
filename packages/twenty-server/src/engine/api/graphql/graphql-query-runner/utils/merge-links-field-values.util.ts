import uniqBy from 'lodash.uniqby';

import { hasRecordFieldValue } from 'src/engine/api/graphql/graphql-query-runner/utils/has-record-field-value.util';
import {
  type LinkMetadata,
  type LinksMetadata,
} from 'src/engine/metadata-modules/field-metadata/composite-types/links.composite-type';

import { parseArrayOrJsonStringToArray } from './parse-additional-items.util';

export const mergeLinksFieldValues = (
  recordsWithValues: { value: LinksMetadata; recordId: string }[],
  priorityRecordId: string,
): LinksMetadata => {
  if (recordsWithValues.length === 0) {
    return {
      primaryLinkUrl: '',
      primaryLinkLabel: '',
      secondaryLinks: null,
    };
  }

  let primaryLinkUrl = '';
  let primaryLinkLabel = '';

  const priorityRecord = recordsWithValues.find(
    (record) => record.recordId === priorityRecordId,
  );

  if (
    priorityRecord &&
    hasRecordFieldValue(priorityRecord.value.primaryLinkUrl)
  ) {
    primaryLinkUrl = priorityRecord.value.primaryLinkUrl;
    primaryLinkLabel = priorityRecord.value.primaryLinkLabel;
  } else {
    const fallbackRecord = recordsWithValues.find((record) =>
      hasRecordFieldValue(record.value.primaryLinkUrl),
    );

    if (fallbackRecord) {
      primaryLinkUrl = fallbackRecord.value.primaryLinkUrl;
      primaryLinkLabel = fallbackRecord.value.primaryLinkLabel;
    }
  }

  const allSecondaryLinks: LinkMetadata[] = [];

  recordsWithValues.forEach((record) => {
    // Add primary link from this record if it's not the chosen primary
    if (
      hasRecordFieldValue(record.value.primaryLinkUrl) &&
      record.value.primaryLinkUrl !== primaryLinkUrl
    ) {
      allSecondaryLinks.push({
        url: record.value.primaryLinkUrl,
        label: record.value.primaryLinkLabel,
      });
    }

    // Add secondary links from this record
    const secondaryLinks = parseArrayOrJsonStringToArray<LinkMetadata>(
      record.value.secondaryLinks,
    );

    allSecondaryLinks.push(
      ...secondaryLinks.filter(
        (link) =>
          hasRecordFieldValue(link.url) && link.url !== primaryLinkUrl,
      ),
    );
  });

  const uniqueSecondaryLinks = uniqBy(allSecondaryLinks, 'url');

  const result = {
    primaryLinkLabel,
    primaryLinkUrl,
    secondaryLinks:
      uniqueSecondaryLinks.length > 0 ? uniqueSecondaryLinks : null,
  };

  return result;
};
