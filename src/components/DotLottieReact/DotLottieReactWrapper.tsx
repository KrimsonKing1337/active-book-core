import type { PropsWithChildren } from 'react';

export type DotLottieReactWrapperProps = PropsWithChildren & React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  /** Each mounted player participates in page preparation directly. */
  amount?: number;
};

export const DotLottieReactWrapper = ({
  children,
  amount: _amount,
  className = '',
  ...etc
}: DotLottieReactWrapperProps) => {
  return (
    <div className={className} {...etc}>
      {children}
    </div>
  );
};
