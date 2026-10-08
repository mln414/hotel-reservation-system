function GuestSelect({ id, name, value, options, isOpen, onChange, onToggle }) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="custom-picker">
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        className="custom-picker-button"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        onClick={() => onToggle(!isOpen)}
      >
        <span className="picker-value">{selectedOption?.label}</span>
        <span
          className={`picker-chevron ${isOpen ? "picker-chevron--open" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id={`${id}-options`}
          className="select-popover"
          role="listbox"
          aria-label={`${name} options`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`select-option ${option.value === value ? "select-option--selected" : ""}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                onToggle(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default GuestSelect;
