/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PinMessageResponse } from '../models/PinMessageResponse';
import type { PinRequest } from '../models/PinRequest';
import type { PinsResponse } from '../models/PinsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PinsService {
  /**
   * List pins
   * @returns PinsResponse OK
   * @throws ApiError
   */
  public static getApiV1Pins({
    project,
    agent,
    model,
    date,
    dateFrom,
    dateTo,
    timezone,
    activeSince,
    includeOneShot,
    includeAutomated,
  }: {
    /**
     * Filter by project
     */
    project?: string,
    /**
     * Filter by agent
     */
    agent?: string,
    /**
     * Comma-separated model filter
     */
    model?: string,
    /**
     * Filter by activity date
     */
    date?: string,
    /**
     * Activity range start
     */
    dateFrom?: string,
    /**
     * Activity range end
     */
    dateTo?: string,
    /**
     * IANA timezone for date filters
     */
    timezone?: string,
    /**
     * Activity timestamp lower bound
     */
    activeSince?: string,
    /**
     * Include one-shot sessions
     */
    includeOneShot?: boolean,
    /**
     * Include automated sessions
     */
    includeAutomated?: boolean,
  }): CancelablePromise<PinsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/pins',
      query: {
        'project': project,
        'agent': agent,
        'model': model,
        'date': date,
        'date_from': dateFrom,
        'date_to': dateTo,
        'timezone': timezone,
        'active_since': activeSince,
        'include_one_shot': includeOneShot,
        'include_automated': includeAutomated,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
        502: `Bad Gateway`,
        503: `Service Unavailable`,
        504: `Gateway Timeout`,
      },
    });
  }
  /**
   * Unpin message
   * @returns void
   * @throws ApiError
   */
  public static deleteApiV1SessionsIdMessagesMessageidPin({
    id,
    messageId,
  }: {
    /**
     * Session ID
     */
    id: string,
    /**
     * Message ordinal
     */
    messageId: number,
  }): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/v1/sessions/{id}/messages/{messageId}/pin',
      path: {
        'id': id,
        'messageId': messageId,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
        502: `Bad Gateway`,
        503: `Service Unavailable`,
        504: `Gateway Timeout`,
      },
    });
  }
  /**
   * Pin message
   * @returns PinMessageResponse OK
   * @throws ApiError
   */
  public static postApiV1SessionsIdMessagesMessageidPin({
    id,
    messageId,
    requestBody,
  }: {
    /**
     * Session ID
     */
    id: string,
    /**
     * Message ordinal
     */
    messageId: number,
    requestBody: PinRequest,
  }): CancelablePromise<PinMessageResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/sessions/{id}/messages/{messageId}/pin',
      path: {
        'id': id,
        'messageId': messageId,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
        502: `Bad Gateway`,
        503: `Service Unavailable`,
        504: `Gateway Timeout`,
      },
    });
  }
  /**
   * List session pins
   * @returns PinsResponse OK
   * @throws ApiError
   */
  public static getApiV1SessionsIdPins({
    id,
  }: {
    /**
     * Session ID
     */
    id: string,
  }): CancelablePromise<PinsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/sessions/{id}/pins',
      path: {
        'id': id,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
        502: `Bad Gateway`,
        503: `Service Unavailable`,
        504: `Gateway Timeout`,
      },
    });
  }
}
