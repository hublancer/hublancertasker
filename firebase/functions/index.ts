/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/document";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize the Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Cloud Function to update the offerCount on a task when a new offer is created.
 */
exports.incrementOfferCount = onDocumentCreated(
  "tasks/{taskId}/offers/{offerId}",
  async (event) => {
    logger.info("New offer detected, incrementing offer count.");

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

/**
 * Cloud Function to decrease the offerCount on a task when an offer is deleted.
 */
exports.decrementOfferCount = onDocumentDeleted(
  "tasks/{taskId}/offers/{offerId}",
  async (event) => {
    logger.info("Offer deletion detected, decrementing offer count.");

    const taskId = event.params.taskId;
    const taskRef = db.doc(`tasks/${taskId}`);

    try {
      // Atomically decrement the offerCount field
      await taskRef.update({
        offerCount: FieldValue.increment(-1),
      });
      logger.info(`Successfully decremented offerCount for task: ${taskId}`);
    } catch (error) {
      logger.error(
        `Failed to decrement offerCount for task: ${taskId}`,
        error
      );
    }
  }
);
