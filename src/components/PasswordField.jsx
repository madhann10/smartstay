import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  icon, label, value, onChange,
  placeholder = 'Enter password',
  minLength = 8, required = true, className = '',
}) {
  const [show, setShow] = useState(false);
  return (
    <label className={"block text-sm font-medium text-slate-700 " + className}>
      <span className="flex items-center gap-2">{icon}{label}</span>
      <span className="relative mt-2 block">
        <input
          required={required}
          type={show ? 'text' : 'password'}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 px-3 py-3 pr-10 outline-indigo-500"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}
