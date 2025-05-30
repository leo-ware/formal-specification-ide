import { Request, Response } from 'express';
import { annotateGraph } from "../agents/graphs/annotateGraph.ts";
import { responseContent } from "../agents/agent.ts";
import { Logger } from '../Logger.ts';
import { Counter } from '@common/util/Counter.ts';
import { GenerateAnnotationsRequest, GenerateAnnotationsResponse, GenerateAnnotationsSuccessResponse } from "@common/serverAPI/generateAnnotationsAPI.ts";
import { v4 as uuidv4 } from 'uuid';

var userUUID = uuidv4();

export function generateAnnotationsHandler(requestCounter: Counter, logger: Logger) {
  return async (req: Request<{}, {}, GenerateAnnotationsRequest>, res: Response<GenerateAnnotationsResponse>): Promise<void> => {
    const { lhsText, rhsText, currentAnnotations, useDemoCache } = req.body;

    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`POST /generate-annotations (${requestId}): `);

    requestLogger.info("REQUEST RECEIVED.");
    requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

    if (!lhsText) {
      const error = "lhsText is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).send({ error });
      return;
    }

    if (!rhsText) {
      const error = "rhsText is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).send({ error });
      return;
    }

    if (!currentAnnotations) {
      const error = "currentAnnotations is required.";
      requestLogger.error(`INVALID REQUEST: ${error}`);
      res.status(400).send({ error });
      return;
    }

    try {
      const config = { configurable: { thread_id: userUUID } };
      const output = await annotateGraph.invoke({ lhsText, rhsText, currentAnnotations, useDemoCache, logger }, config);
      const response : GenerateAnnotationsSuccessResponse = { data: output.decodedAnnotations, debugInfo: { rawModelOutput: responseContent(output) }};
      requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
      res.json(response);
    } catch (e) {
      const error = `Error generating annotations. ${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(400).send({ error });
    }
  }
}