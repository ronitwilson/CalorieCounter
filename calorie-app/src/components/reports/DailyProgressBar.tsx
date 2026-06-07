interface Props {
  consumed: number;
  goal: number;
}

export default function DailyProgressBar({ consumed, goal }: Props) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const overGoal = consumed > goal;
  const nearGoal = !overGoal && pct >= 80;

  const barColor = overGoal
    ? 'bg-red-500'
    : nearGoal
    ? 'bg-amber-400'
    : 'bg-green-500';

  const textColor = overGoal
    ? 'text-red-600'
    : nearGoal
    ? 'text-amber-600'
    : 'text-green-600';

  const displayPct =
    goal > 0 ? Math.round((consumed / goal) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5 text-sm">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{consumed.toLocaleString()}</span> /{' '}
          {goal.toLocaleString()} kcal
        </span>
        <span className={`font-semibold ${textColor}`}>{displayPct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
