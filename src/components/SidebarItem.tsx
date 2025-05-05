export default function SidebarItem({
  icon,
  label,
  collapsed,
}: {
  icon: string;
  label: string;
  collapsed: boolean;
}) {
  return (
    <div
      className="flex items-center space-x-2 hover:bg-gray-700 rounded px-2 py-2 cursor-pointer"
      title={label}
    >
      <span className="text-xl">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </div>
  );
}
