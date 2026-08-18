import { api } from '@/lib/api';
import type { SheetData, UploadMetadata } from '@/modules/jobs/types';

/**
 * Spreadsheet upload and parsing.
 *
 * The server owns parsing. The builder used to read files in the browser with a
 * bundled copy of `xlsx`; these two calls replace it.
 */
export const excelService = {
  /**
   * Upload a spreadsheet. The response already carries the sheet list, each
   * sheet's headers and its row count, so no second call is needed to render
   * the sheet picker.
   */
  upload: (file: File) => api.upload<UploadMetadata>('excel/upload', file),

  /** Re-read an upload's sheet list without re-uploading. */
  getMetadata: (uploadId: string) => api.get<UploadMetadata>(`excel/${uploadId}/metadata`),

  /** The rows of one sheet, keyed by that sheet's raw header text. */
  getSheet: (uploadId: string, sheetName: string) =>
    api.get<SheetData>(`excel/${uploadId}/sheet/${encodeURIComponent(sheetName)}`),
};
