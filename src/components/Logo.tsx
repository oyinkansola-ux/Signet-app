interface LogoProps {
  color?: string;
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ color = '#1C1C1E', size = 24, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.22 2.28L3.28 7.22C2.47 8.03 2.47 9.34 3.28 10.14L13.86 20.72C14.66 21.53 15.97 21.53 16.78 20.72L21.72 15.78C22.53 14.97 22.53 13.66 21.72 12.86L11.14 2.28C10.34 1.47 9.03 1.47 8.22 2.28Z"
          style={{ stroke: color }}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 12C9.5 10.62 10.62 9.5 12 9.5C13.1 9.5 14.04 10.18 14.37 11.13M14.5 12C14.5 13.38 13.38 14.5 12 14.5C10.9 14.5 9.96 13.82 9.63 12.87"
          style={{ stroke: color }}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="font-serif-italic" style={{ color, fontSize: '18px' }}>
          Signet
        </span>
      )}
    </div>
  );
}
