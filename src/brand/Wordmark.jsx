import { brand } from './brand.js';

export default function Wordmark({ className = '' }) {
  const { before, accent, after } = brand.wordmark;
  return (
    <span className={`wordmark ${className}`} aria-label={brand.name}>
      {before}
      <span className="wordmark__accent">{accent}</span>
      {after}
    </span>
  );
}
