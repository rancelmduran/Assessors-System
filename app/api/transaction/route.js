import nodemailer from 'nodemailer';
import { createSubmissionHandler } from '../../../lib/public-submission-handler.mjs';
export const runtime = 'nodejs';
export const maxDuration = 60;
export const POST = createSubmissionHandler({ createTransport: options => nodemailer.createTransport(options) });
