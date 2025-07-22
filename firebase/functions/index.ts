/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/document";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize the Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Cloud Function to update the offerCount on a task when a new offer is created.
 */
exports.updateOfferCount = onDocumentCreated(
  "tasks/{taskId}/offers/{offerId}",
  async (event) => {
    logger.info("New offer detected, updating offer count.");

    const taskId = event.params.taskId;
    const taskRef = db.doc(`tasks/${taskId}`);

    try {
      // Atomically increment the offerCount field
      await taskRef.update({
        offerCount: FieldValue.increment(1),
      });
      logger.info(`Successfully incremented offerCount for task: ${taskId}`);
    } catch (error) {
      logger.error(
        `Failed to increment offerCount for task: ${taskId}`,
        error
      );
    }
  }
);
