import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Commentary } from './commentary.entity';

@Entity('commentary_translations')
export class CommentaryTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'commentary_id' })
  commentaryId: string;

  @Column({ name: 'language_code', length: 10 })
  languageCode: string;

  @Column({ name: 'translated_text', type: 'text' })
  translatedText: string;

  @Column({ name: 'audio_url', type: 'text', nullable: true })
  audioUrl: string | null;

  @Column({ name: 'audio_s3_key', type: 'text', nullable: true })
  audioS3Key: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Commentary, (c) => c.translations)
  @JoinColumn({ name: 'commentary_id' })
  commentary: Commentary;
}
