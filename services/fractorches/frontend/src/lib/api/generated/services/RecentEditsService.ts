/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DbRecentEditsResult } from '../models/DbRecentEditsResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RecentEditsService {
  /**
   * List recent edits
   * @returns DbRecentEditsResult OK
   * @throws ApiError
   */
  public static getApiV1RecentEdits({
    limit = 50,
    offset,
    project,
    search,
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
     * Max files per page
     */
    limit?: number,
    /**
     * Files to skip
     */
    offset?: number,
    /**
     * Filter by project
     */
    project?: string,
    /**
     * Filter by file path substring (case-insensitive)
     */
    search?: string,
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
  }): CancelablePromise<DbRecentEditsResult> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/recent-edits',
      query: {
        'limit': limit,
        'offset': offset,
        'project': project,
        'search': search,
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
}
