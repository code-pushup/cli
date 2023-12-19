import {select, Separator} from '@inquirer/prompts';

type Choice<T> = {
  value: T;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
}

export async function multiselect<T>(options: {
  message: string;
  choices: T[];
}): Promise<T[]> {
  const { message = 'Choices:', choices } = options;
  const answer = await select<T[]>(
    {
      message,
      choices: choices.map((value) => ({
        value
      } satisfies Choice<T>)) as unknown as readonly Separator[],
    });
  return answer;
}
