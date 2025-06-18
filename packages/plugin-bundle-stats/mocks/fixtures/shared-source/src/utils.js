export function greet(name) {
  return `Hello, ${name}!`;
}

export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export const BIG_DATA = {
  children: [
    {
      id: 1,
      name: 'Item 1',
      description: 'Description 1',
    },
    {
      id: 2,
      name: 'Item 2',
      description: 'Description 2',
    },
    {
      id: 3,
      name: 'Item 3',
      description: 'Description 3',
    },
    {
      id: 4,
      name: 'Item 4',
      description: 'Description 4',
    },
    {
      id: 5,
      name: 'Item 5',
      description: 'Description 5',
      children: [
        {
          id: 1,
          name: 'Item 1',
          description: 'Description 1',
        },
        {
          id: 2,
          name: 'Item 2',
          description: 'Description 2',
        },
        {
          id: 3,
          name: 'Item 3',
          description: 'Description 3',
        },
        {
          id: 4,
          name: 'Item 4',
          description: 'Description 4',
        },
        {
          id: 5,
          name: 'Item 5',
          description: 'Description 5',
          children: [
            {
              id: 1,
              name: 'Item 1',
              description: 'Description 1',
            },
            {
              id: 2,
              name: 'Item 2',
              description: 'Description 2',
            },
            {
              id: 3,
              name: 'Item 3',
              description: 'Description 3',
            },
            {
              id: 4,
              name: 'Item 4',
              description: 'Description 4',
            },
            {
              id: 5,
              name: 'Item 5',
              description: 'Description 5',
              children: [
                {
                  id: 1,
                  name: 'Item 1',
                  description: 'Description 1',
                },
                {
                  id: 2,
                  name: 'Item 2',
                  description: 'Description 2',
                },
                {
                  id: 3,
                  name: 'Item 3',
                  description: 'Description 3',
                },
                {
                  id: 4,
                  name: 'Item 4',
                  description: 'Description 4',
                },
                {
                  id: 5,
                  name: 'Item 5',
                  description: 'Description 5',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
