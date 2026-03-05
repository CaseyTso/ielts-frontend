export function ScoreBadge({ score, size = 'md' }) {
  const color =
    score >= 7 ? 'bg-success text-white' :
    score >= 5.5 ? 'bg-warning text-gray-800' :
    'bg-danger text-white';

  const sizeClass = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-base';

  return (
    <div className={`${color} ${sizeClass} rounded-full flex items-center justify-center font-bold shadow-sm`}>
      {score.toFixed(1)}
    </div>
  );
}

export function PartBadge({ part }) {
  const colors = {
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-purple-100 text-purple-700',
    3: 'bg-orange-100 text-orange-700',
  };

  return (
    <span className={`${colors[part] || colors[1]} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
      Part {part}
    </span>
  );
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && <Icon size={48} className="text-gray-300 mb-4" />}
      <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-secondary mb-4">{description}</p>
      {action}
    </div>
  );
}
