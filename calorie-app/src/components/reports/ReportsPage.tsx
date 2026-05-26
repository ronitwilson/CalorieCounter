import { useNavigate } from 'react-router-dom';
import { BarChart2, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/reports/weekly')}
          className="flex flex-col items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:border-indigo-300 hover:shadow-md transition text-center group"
        >
          <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition">
            <BarChart2 size={28} className="text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Weekly Chart</p>
            <p className="text-sm text-gray-400 mt-0.5">7-day bar chart vs goal</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/reports/monthly')}
          className="flex flex-col items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:border-indigo-300 hover:shadow-md transition text-center group"
        >
          <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition">
            <Calendar size={28} className="text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Monthly Summary</p>
            <p className="text-sm text-gray-400 mt-0.5">Calendar view for the month</p>
          </div>
        </button>
      </div>
    </div>
  );
}
