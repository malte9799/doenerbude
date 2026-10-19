import { useId } from 'react';
import Wordmark from '../brand/Wordmark.jsx';
import { brand } from '../brand/brand.js';
import { useI18n } from '../i18n/index.jsx';
import './loader.css';

// Brand loading screen. `progress` is 0..1; the döner spit fills from the
// bottom as it grows.
const CONE = 'M12 44 Q80 28 148 44 Q150 70 140 100 Q130 140 118 176 Q112 204 104 222 Q80 230 56 222 Q48 204 42 176 Q30 140 20 100 Q10 70 12 44 Z';
const TOP = 28;
const HEIGHT = 204;

export default function Loader({ progress = 0, label }) {
  const { t } = useI18n();
  const clipId = useId();
  const coneId = useId();
  const p = Math.min(1, Math.max(0, progress));
  const percent = Math.round(p * 100);
  const text = label ?? t('loader.label');

  return (
    <div className="loader" role="progressbar" aria-label={text} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="loader__brand">
        <Wordmark className="loader__wordmark" />
        <p className="loader__slogan">{brand.slogan}</p>
      </div>

      <svg className="loader__spit" viewBox="0 0 160 250" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <rect className="loader__clip" x="0" y={TOP} width="160" height={HEIGHT} style={{ transform: `translateY(${(1 - p) * HEIGHT}px)` }} />
          </clipPath>
          <clipPath id={coneId}>
            <path d={CONE} />
          </clipPath>
        </defs>
        {/* rod and base */}
        <rect className="loader__rod" x="77" y="8" width="6" height="230" rx="3" />
        <circle className="loader__knob" cx="80" cy="12" r="8" />
        <ellipse className="loader__base" cx="80" cy="238" rx="38" ry="8" />
        {/* empty cone */}
        <path className="loader__cone-empty" d={CONE} />
        {/* filled cone */}
        <g clipPath={`url(#${clipId})`}>
          <path className="loader__meat" d={CONE} />
          <g clipPath={`url(#${coneId})`}>
            <g className="loader__bands">
              <path d="M0 78 Q80 96 160 78" />
              <path d="M0 116 Q80 134 160 116" />
              <path d="M0 154 Q80 172 160 154" />
              <path d="M0 192 Q80 208 160 192" />
            </g>
            <path className="loader__shine" d="M30 62 Q26 110 48 170" />
          </g>
        </g>
        <path className="loader__cone-edge" d={CONE} />
      </svg>

      <div className="loader__meter">
        <div className="loader__track">
          <i style={{ width: `${percent}%` }} />
        </div>
        <span className="loader__text">
          {text} · {percent} %
        </span>
      </div>
    </div>
  );
}
