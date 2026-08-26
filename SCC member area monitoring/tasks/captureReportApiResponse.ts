import { Task, Actor } from '../../screenplay/actor';
import { BrowseTheWeb } from '../../screenplay/abilities/browseTheWeb';
import { Request, Response } from '@playwright/test';

export interface CapturedReportApiData {
  url: string;
  status: number;
  requestPayload: any;
  responseJson: any;
  durationMs: number;
}

export class CaptureReportApiResponse implements Task {
  private timeoutMs: number;

  private constructor(timeoutMs: number = 30000) {
    this.timeoutMs = timeoutMs;
  }

  static withTimeout(timeoutMs: number = 30000): CaptureReportApiResponse {
    return new CaptureReportApiResponse(timeoutMs);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).page;

    console.log('?? [API Capture] Listening for members/api/report/generate request & response...');

    const startTime = Date.now();

    // Condition-based response wait
    const responsePromise = page.waitForResponse(
      (response: Response) => response.url().includes('members/api/report/generate') || response.url().includes('api/report/generate'),
      { timeout: this.timeoutMs }
    );

    try {
      const response = await responsePromise;
      const durationMs = Date.now() - startTime;
      const status = response.status();
      const url = response.url();

      let requestPayload: any = null;
      try {
        const postData = response.request().postData();
        requestPayload = postData ? JSON.parse(postData) : null;
      } catch {
        requestPayload = response.request().postData();
      }

      let responseJson: any = null;
      try {
        responseJson = await response.json();
      } catch (e: any) {
        responseJson = { text: await response.text().catch(() => '') };
      }

      const capturedData: CapturedReportApiData = {
        url,
        status,
        requestPayload,
        responseJson,
        durationMs
      };

      actor.remember('reportApiData', capturedData);
      actor.remember('reportApiResponse', responseJson);
      actor.remember('reportApiPayload', requestPayload);

      console.log(? [API Capture] Captured report/generate (Status: , Time: ms));
      console.log('?? Request Payload:', JSON.stringify(requestPayload, null, 2));
      console.log('?? Response JSON:', JSON.stringify(responseJson, null, 2));

    } catch (error: any) {
      console.warn(?? [API Capture] Timed out waiting for members/api/report/generate within ms);
      actor.remember('reportApiError', error.message);
    }
  }
}
