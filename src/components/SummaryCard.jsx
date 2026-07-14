const COLOR_MAP = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-600",
};

export function SummaryCard({ label, value, icon: Icon, color = "gray" }) {
  return (
    <div className='bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between'>
      <div>
        <p className='text-sm text-gray-500'>{label}</p>
        <p className='text-3xl text-gray-900 font-bold mt-2'>{value}</p>
      </div>
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}>
        <Icon className='w-5 h-5' strokeWidth={1.75} />
      </div>
    </div>
  );
}
