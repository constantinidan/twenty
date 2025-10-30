import { MESSAGING_THROTTLE_DURATION } from 'src/modules/messaging/message-import-manager/constants/messaging-throttle-duration';

export const isThrottled = (
  syncStageStartedAt: string | null,
  throttleFailureCount: number,
  throttleDuration: number = MESSAGING_THROTTLE_DURATION,
): boolean => {
  if (!syncStageStartedAt) {
    return false;
  }

  return (
    computeThrottlePauseUntil(
      syncStageStartedAt,
      throttleFailureCount,
      throttleDuration,
    ) > new Date()
  );
};

const computeThrottlePauseUntil = (
  syncStageStartedAt: string,
  throttleFailureCount: number,
  throttleDuration: number,
): Date => {
  return new Date(
    new Date(syncStageStartedAt).getTime() +
      throttleDuration * Math.pow(2, throttleFailureCount - 1),
  );
};
