import React from 'react';
import CreateTodo from './components/CreateTodo';
import TodoFilter from './components/TodoFilter';
import TodoList from './components/TodoList';
import { useTodos } from './hooks/useTodos';

const App = () => {
  const { loading, todos, onCreate, onEdit, setQuery, setHideComplete } =
    useTodos();

  return (
    <div>
      <h1>TODOs</h1>
      <TodoFilter setQuery={setQuery} setHideComplete={setHideComplete} />
      <TodoList todos={todos} onEdit={onEdit} />
      <CreateTodo onCreate={onCreate} />
    </div>
  );
};

export default App;
