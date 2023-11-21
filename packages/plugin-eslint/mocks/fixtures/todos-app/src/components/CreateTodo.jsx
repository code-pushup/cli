import React, { useState } from 'react';

const CreateTodo = props => {
  const [title, setTitle] = useState('');

  return (
    <form
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
      }}
      onSubmit={event => {
        event.preventDefault();
        props.onCreate(title);
        setTitle('');
      }}
    >
      <input
        value={title}
        onInput={event => {
          setTitle(event.target.value);
        }}
      />
      <button>Add</button>
    </form>
  );
};

export default CreateTodo;
