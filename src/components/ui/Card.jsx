// src/components/ui/Card.jsx
export function Card({ className = "", children }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }) {
  return (
    <div className="p-6 border-b border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function CardContent({ className = "", children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
