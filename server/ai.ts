import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { z } from 'zod';
import { AIUnavailableError, HttpError } from './errors.js';
import { PROMPTS, wrapData } from './prompts.js';
import {
  BulletsOutput,
  ReviewOutput,
  SkillsOutput,
  SummaryOutput,
  TailorOutput,
  type BulletsInput,
  type BulletsResult,
  type ReviewInput,
  type ReviewResult,
  type SkillsInput,
  type SkillsResult,
  type SummaryInput,
  type SummaryResult,
  type TailorInput,
  type TailorResult,
} from './schemas.js';

/** The only AI contract the routes depend on, so tests can substitute a fake. */
export interface AIService {
  generateSummary(input: SummaryInput): Promise<SummaryResult>;
  improveBullets(input: BulletsInput): Promise<BulletsResult>;
  suggestSkills(input: SkillsInput): Promise<SkillsResult>;
  reviewResume(input: ReviewInput): Promise<ReviewResult>;
  tailorToJob(input: TailorInput): Promise<TailorResult>;
}

type Logger = Pick<Console, 'error'>;

export class OpenAIService implements AIService {
  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
    private readonly logger: Logger = console,
  ) {}

  generateSummary(input: SummaryInput) {
    return this.run(SummaryOutput, 'resume_summary', PROMPTS.summary, input);
  }

  improveBullets(input: BulletsInput) {
    return this.run(BulletsOutput, 'improved_bullets', PROMPTS.bullets, input);
  }

  suggestSkills(input: SkillsInput) {
    return this.run(SkillsOutput, 'skill_suggestions', PROMPTS.skills, input);
  }

  reviewResume(input: ReviewInput) {
    return this.run(ReviewOutput, 'resume_review', PROMPTS.review, input);
  }

  tailorToJob(input: TailorInput) {
    return this.run(TailorOutput, 'tailored_resume', PROMPTS.tailor, input);
  }

  /**
   * One structured-output call: the response must match the Zod schema. Refusals and truncated
   * answers are reported as errors instead of being parsed, and the parsed value is validated
   * again before it is returned.
   */
  private async run<T>(schema: z.ZodType<T>, name: string, instructions: string, data: unknown): Promise<T> {
    let response;
    try {
      response = await this.client.responses.parse({
        model: this.model,
        instructions,
        input: wrapData(data),
        text: { format: zodTextFormat(schema, name) },
        max_output_tokens: 4000,
      });
    } catch (error) {
      this.logger.error(`[ai] ${name} request failed:`, describe(error));
      if (error instanceof OpenAI.APIError && error.status === 429) {
        throw new AIUnavailableError('The AI service is busy right now. Please try again in a minute.');
      }
      throw new AIUnavailableError();
    }

    if (response.status === 'incomplete') {
      this.logger.error(`[ai] ${name} incomplete:`, response.incomplete_details?.reason);
      throw new AIUnavailableError('The AI response was cut off. Please try again.');
    }

    const refused = response.output.some(
      (item) => item.type === 'message' && item.content.some((part) => part.type === 'refusal'),
    );
    if (refused) {
      throw new HttpError(422, 'AI_REFUSED', 'The AI could not help with this content. Try rephrasing it.');
    }

    const parsed = schema.safeParse(response.output_parsed);
    if (!parsed.success) {
      this.logger.error(`[ai] ${name} returned an unexpected shape`);
      throw new AIUnavailableError('The AI returned an unexpected response. Please try again.');
    }
    return parsed.data;
  }
}

function describe(error: unknown): string {
  if (error instanceof OpenAI.APIError) return `${error.status ?? 'network'} ${error.name}`;
  return error instanceof Error ? error.message : String(error);
}
