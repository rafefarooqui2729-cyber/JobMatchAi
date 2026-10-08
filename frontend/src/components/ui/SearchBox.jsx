import { useId } from 'react';
import Input from './Input.jsx';
import Button from './Button.jsx';

export default function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search',
  label = 'Search',
  className = '',
  ...props
}) {
  const id = useId();

  return (
    <form
      role="search"
      className={`
        flex
        w-full
        items-start
        gap-2
        ${className}
      `}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value ?? '');
      }}
    >
      {/* Search input */}
      <div className="min-w-0 flex-1">
        <Input
          id={id}
          label={label}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          leadingAdornment={
            <span
              aria-hidden="true"
              className="
                flex
                h-5
                w-5
                items-center
                justify-center
                rounded-md
                text-base
                text-cyan-300
                drop-shadow-[0_0_9px_rgba(34,211,238,0.35)]
              "
            >
              ⌕
            </span>
          }
          {...props}
        />
      </div>

      {/* Search action */}
      <Button
        type="submit"
        className="
          mt-[1.65rem]
          min-w-[96px]
          shrink-0
        "
      >
        Search
      </Button>
    </form>
  );
}