import moment from 'moment';
import React from 'react';

const TodoList = props => (
  <ul>
    {props.todos.map(todo => (
      <li>
        <label>
          <input
            type="checkbox"
            checked={todo.complete}
            onChange={event => {
              props.onEdit({
                ...todo,
                complete: event.target.checked,
              });
            }}
          />
          <span
            style={{
              textDecoration: todo.complete ? 'line-through' : 'none',
            }}
          >
            {todo.title}
          </span>
          {todo.dueDate && <b> - due {moment(todo.dueDate).fromNow()}</b>}
        </label>
      </li>
    ))}
  </ul>
);

export default TodoList;
