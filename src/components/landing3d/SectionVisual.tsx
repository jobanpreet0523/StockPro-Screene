type VisualVariant =
  | 'market' | 'tools' | 'crt' | 'pro' | 'broker'
  | 'screening' | 'saved' | 'trust' | 'pricing' | 'education';

const paths: Record<VisualVariant, string[]> = {
  market: ['M54 126c30-58 102-76 154-38s62 112 11 158-124 27-79-92-41-146Z', 'M58 175c55-27 113-28 174-5', 'M91 82c38 42 72 90 88 154'],
  tools: ['M43 111 151 53l116 60-111 64Z', 'm43 111 1 78 112 61 111-64-1-73', 'm96 103 55-29 57 30-57 31Z'],
  crt: ['M58 214V121m0 28h24v42H58m59 3V70m0 35h24v58h-24m61 75V112m0 34h24v53h-24m61-5V84m0 31h24v57h-24', 'M39 201c46 18 72-13 104-6s59 56 126 2'],
  pro: ['M42 83h227v150H42Z', 'M61 105h80v48H61Zm98 0h89v103h-89ZM61 169h80v39H61Z', 'm45 233 36 25h157l31-25'],
  broker: ['M130 95h54v48h-54Z', 'M157 143v84', 'M70 207h174', 'M70 207v-48m174 48v-48', 'M46 126h48v34H46Zm174 0h48v34h-48Z'],
  screening: ['M42 67h226l-80 89v64l-60 28v-92Z', 'M78 91h154M97 117h116', 'M207 202h65v44h-65Z'],
  saved: ['M45 101h88l18 22h120v120H45Z', 'M172 82h68v122h-68Z', 'M77 151h62m-62 25h62m-62 25h43'],
  trust: ['M156 54 246 91v72c0 50-36 83-90 105-54-22-90-55-90-105V91Z', 'M121 150h70v62h-70Zm14 0v-22c0-29 42-29 42 0v22', 'M28 233h62m132 0h62'],
  pricing: ['M42 229h47v-39h47v-40h47v-39h47V72h47', 'M67 176 92 151l25 25m46-79 25-25 25 25', 'M238 44v54'],
  education: ['M62 86h151v143H62Z', 'm88 62 151 24v143l-26-4', 'M87 122h100m-100 27h100m-100 27h68', 'M222 124h42v73h-42Z'],
};

const labels: Record<VisualVariant, string> = {
  market: 'Decorative market globe and source rings',
  tools: 'Decorative isometric research workstation',
  crt: 'Decorative normalized CRT candle progression',
  pro: 'Decorative StockPro Pro workspace',
  broker: 'Decorative per-user broker vault network',
  screening: 'Decorative screening filter funnel',
  saved: 'Decorative user-locked saved research folder',
  trust: 'Decorative security shield and isolation lanes',
  pricing: 'Decorative getting-started pathway',
  education: 'Decorative research document stack',
};

export default function SectionVisual({ variant, dark = false }: { variant: VisualVariant; dark?: boolean }) {
  const strokes = paths[variant];
  return (
    <div className={`section-visual ${dark ? 'section-visual-dark' : ''}`} aria-hidden="true" title={labels[variant]}>
      <svg viewBox="0 0 312 300" role="presentation" focusable="false">
        <path className="section-visual-floor" d="m27 237 129-70 129 70-129 48Z" />
        {strokes.map((path, index) => (
          <path key={path} d={path} className={index === 0 ? 'section-visual-primary' : index === strokes.length - 1 ? 'section-visual-accent' : 'section-visual-line'} />
        ))}
        <circle className="section-visual-node" cx="54" cy="245" r="6" />
        <circle className="section-visual-node" cx="258" cy="235" r="5" />
        <circle className="section-visual-node section-visual-node-alt" cx="156" cy="274" r="7" />
      </svg>
    </div>
  );
}
