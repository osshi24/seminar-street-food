import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { MAIL_QUEUE } from './mail.constants';
import { EmailJobData } from './mail.service';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;
  private templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(private readonly configService: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST'),
      port: configService.get<number>('SMTP_PORT', 587),
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, context } = job.data;
    try {
      const html = this.renderTemplate(template, context);
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} (template: ${template})`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to} (attempt ${job.attemptsMade + 1}): ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private renderTemplate(template: string, context: Record<string, unknown>): string {
    try {
      const cached = this.templateCache.get(template);
      if (cached) return cached(context);

      const templatePath = path.resolve(__dirname, 'templates', `${template}.hbs`);
      const source = fs.readFileSync(templatePath, 'utf-8');
      const compiled = Handlebars.compile(source, { noEscape: true });
      this.templateCache.set(template, compiled);
      return compiled(context);
    } catch (e) {
      this.logger.warn(`Missing/invalid email template "${template}", falling back to debug output`);
      return `<p><strong>Template:</strong> ${template}</p><pre>${escapeHtml(
        JSON.stringify(context, null, 2),
      )}</pre>`;
    }
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
