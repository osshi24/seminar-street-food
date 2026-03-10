import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MAIL_QUEUE } from './mail.constants';
import { EmailJobData } from './mail.service';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

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
    return `<p>Template: ${template}</p><pre>${JSON.stringify(context, null, 2)}</pre>`;
  }
}
