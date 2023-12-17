import inquirer from 'inquirer';

export async function multiselect<T extends string>(options: {
  name: string;
  message: string;
  choices: T[] ;
}): Promise<T[]> {
  const { name, message = 'Pick a choice:', choices } = options;
  const answer = (await inquirer.prompt([{
    name,
    type: 'list',
    message,
    choices,
  }])) as T[];
  return answer || [];
}
