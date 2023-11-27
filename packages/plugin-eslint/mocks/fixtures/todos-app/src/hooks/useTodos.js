import { useCallback, useEffect, useMemo, useState } from 'react';

export const useTodos = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch('https://jsonplaceholder.typicode.com/todos')
      .then(resp => resp.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  const onCreate = useCallback(title => {
    const body = JSON.stringify({
      title: title,
      complete: false,
    });

    fetch('https://jsonplaceholder.typicode.com/todos', {
      method: 'POST',
      body,
    })
      .then(resp => resp.json())
      .then(({ id }) => {
        setData(data => [
          ...data,
          {
            id: id,
            title: title,
            complete: false,
          },
        ]);
      });
  });

  const onEdit = useCallback(todo => {
    setData(data => data.map(t => (t.id == todo.id ? todo : t)));
    fetch(`https://jsonplaceholder.typicode.com/todos/${todo.id}`, {
      method: 'PUT',
      body: JSON.stringify(todo),
    });
  });

  const [query, setQuery] = useState('');
  const [hideComplete, setHideComplete] = useState(false);

  const todos = useMemo(
    () =>
      data.filter(todo => {
        if (query && !todo.title.toLowerCase().includes(query.toLowerCase())) {
          return false;
        }
        if (hideComplete && todo.complete) {
          return false;
        }
        return true;
      }),
    [data, query, hideComplete],
  );

  return {
    loading,
    todos,
    onCreate,
    onEdit,
    setQuery,
    setHideComplete,
  };
};
