/* eslint-disable react/button-has-type */

import { Button } from '@/components/ui/button';

export function CustomButton({
  label,
  height,
  disabled = false,
  onClick,
  icon,
  type = 'primary',
  loading = false,
  typeButton = 'button',
  accept,
  variant,
}) {
  const baseClasses =
    'flex items-center justify-center gap-3 w-full px-4 py-2 text-md rounded-md duration-150 cursor-pointer';
  const style = { height: height || '48px', width: '100%' };
  let finalClasses = '';

  switch (type) {
    case 'error':
      finalClasses = `${baseClasses} hover:bg-[#fae0e4] active:bg-indigo-200 text-[#ef233c] border border-[#ef233c] disabled:cursor-not-allowed`;
      break;

    case 'success':
      finalClasses = `${baseClasses} hover:bg-[#ecfaf1] active:bg-[#ecfaf1] text-[#18a44b] border border-[#18a44b] disabled:cursor-not-allowed`;
      break;

    case 'secondary':
      finalClasses = `${baseClasses} bg-brand/10 text-brand hover:bg-brand/20 active:bg-brand/30 border border-brand disabled:cursor-not-allowed`;
      break;

    case 'primary':
    default:
      finalClasses = `${baseClasses} bg-brand text-brand-foreground hover:bg-brand/85 active:bg-brand-dark disabled:cursor-not-allowed`;
      break;
  }

  return (
    <Button
      type={typeButton}
      className={finalClasses}
      style={style}
      disabled={disabled || loading}
      onClick={onClick}
      accept={accept}
      variant={variant}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="ml-1">{label}</span>
        </>
      ) : (
        <>
          {label}
          {icon && icon}
        </>
      )}
    </Button>
  );
}
