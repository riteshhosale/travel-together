function SectionHeader({ kicker, title, subtitle, align = 'left' }) {
  const isCenter = align === 'center';

  return (
    <div className={isCenter ? 'text-center' : ''}>
      {kicker ? (
        <p className='fg-kicker text-xs font-semibold uppercase tracking-[0.28em]'>{kicker}</p>
      ) : null}
      {title ? (
        <h2 className='fg-title mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl'>
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p
          className={`fg-muted mt-4 text-sm leading-7 sm:text-base ${
            isCenter ? 'mx-auto max-w-3xl' : 'max-w-3xl'
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default SectionHeader;
