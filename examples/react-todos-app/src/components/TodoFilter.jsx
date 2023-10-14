import React from 'react';

const TodoFilter = props => {
  return (
    <div>
      <input
        type="search"
        placeholder="Search"
        onInput={event => {
          props.setQuery(event.target.value);
        }}
      />

      <label>
        <input
          type="checkbox"
          onChange={event => {
            props.setHideComplete(event.target.checked);
          }}
        />
        Hide complete
      </label>
    </div>
  );
};

export default TodoFilter;
