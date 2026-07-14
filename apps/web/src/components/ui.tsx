import { Button as AntButton, Card as AntCard } from 'antd';
import type { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  htmlType?: 'button' | 'submit' | 'reset';
}

export function Button({ variant = 'primary', className = '', children, disabled, onClick, type, htmlType, ...props }: ButtonProps) {
  const styles: Record<string, string> = {
    primary: 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'bg-white border-slate-300 text-slate-700 hover:border-emerald-400 hover:text-emerald-700',
    ghost: 'bg-transparent border-transparent text-slate-600 hover:text-emerald-700 hover:bg-emerald-50',
  };

  return (
    <AntButton
      className={`!rounded-xl !font-medium ${styles[variant]} ${className}`}
      type={variant === 'primary' ? 'primary' : 'default'}
      ghost={variant === 'ghost'}
      htmlType={htmlType ?? (type === 'submit' ? 'submit' : type === 'reset' ? 'reset' : 'button')}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </AntButton>
  );
}

export function Card({ children, className = '', title, extra }: { children: ReactNode; className?: string; title?: ReactNode; extra?: ReactNode }) {
  return (
    <AntCard
      className={`!rounded-2xl !border-slate-200 !shadow-sm ${className}`}
      title={title}
      extra={extra}
    >
      {children}
    </AntCard>
  );
}

export function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
