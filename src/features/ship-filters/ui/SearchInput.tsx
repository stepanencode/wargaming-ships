type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className="ship-filter-control ship-search-control">
      Search ships
      <input
        className="ship-search-input"
        id="ship-search"
        name="ship-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by ship name"
      />
    </label>
  );
}
